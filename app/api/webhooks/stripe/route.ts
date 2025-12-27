import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import {
  db,
  orders,
  orderItems,
  carts,
  productVariants,
  discountCodes,
} from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import type Stripe from "stripe";

// Disable body parsing - we need raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "checkout.session.expired":
        // Optional: Log expired sessions for analytics
        console.log("Checkout session expired:", event.data.object.id);
        break;

      case "payment_intent.payment_failed":
        // Optional: Log failed payments
        console.log("Payment failed:", event.data.object.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.completed:", session.id);

  // Check if order already exists (idempotency) - BEFORE transaction
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, session.id),
  });

  if (existingOrder) {
    console.log("Order already exists for session:", session.id);
    return;
  }

  // Get cart from metadata
  const cartId = session.metadata?.cartId;
  const sessionId = session.metadata?.sessionId;
  const discountCodeId = session.metadata?.discountCodeId;

  if (!cartId) {
    console.error("No cartId in session metadata:", session.id);
    return;
  }

  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, parseInt(cartId, 10)),
  });

  if (!cart) {
    console.error("Cart not found:", cartId);
    return;
  }

  const cartItems = JSON.parse(cart.items || "[]") as Array<{
    variantId: number;
    quantity: number;
  }>;
  if (cartItems.length === 0) {
    console.error("Cart is empty:", cartId);
    return;
  }

  // Batch-load all variants before transaction (read operations)
  const variantIds = cartItems.map((item) => item.variantId);
  const variants = await db.query.productVariants.findMany({
    where: sql`${productVariants.id} IN (${sql.join(
      variantIds.map((id) => sql`${id}`),
      sql`, `
    )})`,
    with: { product: true },
  });

  // Create a map for quick lookup
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // Validate all variants exist
  const missingVariants = variantIds.filter((id) => !variantMap.has(id));
  if (missingVariants.length > 0) {
    console.error("Missing variants:", missingVariants);
    return;
  }

  // Generate order number (involves a read, do before transaction)
  const orderNumber = await generateOrderNumber();

  // Extract shipping details (collected via shipping_address_collection)
  const collectedShipping = session.collected_information?.shipping_details;
  const shippingAddress = collectedShipping?.address ?? session.customer_details?.address;
  const shippingName = collectedShipping?.name ?? session.customer_details?.individual_name;

  // Build shipping address JSON
  const shippingAddressJson = JSON.stringify({
    name: shippingName,
    line1: shippingAddress?.line1,
    line2: shippingAddress?.line2,
    city: shippingAddress?.city,
    state: shippingAddress?.state,
    postalCode: shippingAddress?.postal_code,
    country: shippingAddress?.country,
  });

  // Calculate amounts (convert from pence to pounds)
  const subtotal = (session.amount_subtotal ?? 0) / 100;
  const shippingCost = (session.shipping_cost?.amount_total ?? 0) / 100;
  const discountAmount = (session.total_details?.amount_discount ?? 0) / 100;
  const total = (session.amount_total ?? 0) / 100;

  // Get shipping method name
  const shippingMethod = session.shipping_cost?.shipping_rate
    ? await getShippingMethodName(session.shipping_cost.shipping_rate as string)
    : "Standard Shipping";

  const now = new Date().toISOString();

  // ============================================================
  // TRANSACTION: All writes happen atomically
  // If any operation fails, everything rolls back
  // ============================================================
  const { order, createdOrderItems } = await db.transaction(async (tx) => {
    // 1. Create order
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        email: session.customer_details?.email ?? "",
        status: "pending",
        paymentStatus: "paid",
        subtotal,
        shippingCost,
        discountAmount,
        taxAmount: 0, // VAT included in prices
        total,
        currency: "GBP",
        discountCodeId: discountCodeId ? parseInt(discountCodeId, 10) : null,
        shippingMethod,
        shippingAddress: shippingAddressJson,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // 2. Create all order items
    const orderItemsToInsert = cartItems.map((item) => {
      const variant = variantMap.get(item.variantId)!;
      return {
        orderId: order.id,
        variantId: item.variantId,
        productName: variant.product.name,
        variantName: variant.name,
        sku: variant.sku,
        quantity: item.quantity,
        price: variant.price,
        weightGrams: variant.weightGrams,
        createdAt: now,
      };
    });

    const createdOrderItems = await tx
      .insert(orderItems)
      .values(orderItemsToInsert)
      .returning();

    // 3. Decrement inventory for all variants
    for (const item of cartItems) {
      await tx
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} - ${item.quantity}`,
          updatedAt: now,
        })
        .where(eq(productVariants.id, item.variantId));
    }

    // 4. Update discount code usage count
    if (discountCodeId) {
      await tx
        .update(discountCodes)
        .set({
          usesCount: sql`${discountCodes.usesCount} + 1`,
        })
        .where(eq(discountCodes.id, parseInt(discountCodeId, 10)));
    }

    // 5. Clear the cart
    await tx.delete(carts).where(eq(carts.id, parseInt(cartId, 10)));

    return { order, createdOrderItems };
  });
  // ============================================================
  // END TRANSACTION
  // ============================================================

  console.log("Order created:", order.orderNumber);
  console.log("Order processing complete:", order.orderNumber);

  // Send confirmation email (async, don't block webhook response)
  sendOrderConfirmationEmail(order, createdOrderItems)
    .then((result) => {
      if (result.success) {
        console.log("Order confirmation email sent for:", order.orderNumber);
      } else {
        console.error("Failed to send order confirmation email:", result.error);
      }
    })
    .catch((error) => {
      console.error("Error sending order confirmation email:", error);
    });
}

async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

  // Get today's order count
  const todayStart = new Date(date);
  todayStart.setHours(0, 0, 0, 0);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(sql`${orders.createdAt} >= ${todayStart.toISOString()}`);

  const count = (result[0]?.count ?? 0) + 1;
  return `HD-${dateStr}-${count.toString().padStart(3, "0")}`;
}

async function getShippingMethodName(shippingRateId: string): Promise<string> {
  try {
    const shippingRate = await stripe.shippingRates.retrieve(shippingRateId);
    return shippingRate.display_name ?? "Standard Shipping";
  } catch {
    return "Standard Shipping";
  }
}
