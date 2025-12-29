import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import {
  db,
  orders,
  orderItems,
  orderEvents,
  carts,
  products,
  discountCodes,
  stockReservations,
} from "@/lib/db";
import { sendOrderConfirmationEmail } from "@/lib/email/send-order-confirmation";
import { logOrderEvent } from "@/lib/db/order-events";
import type Stripe from "stripe";

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

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      case "payment_intent.payment_failed":
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

  // Check if order already exists (idempotency)
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, session.id),
  });

  if (existingOrder) {
    console.log("Order already exists for session:", session.id);
    return;
  }

  const cartId = session.metadata?.cartId;
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
    productId: number;
    quantity: number;
  }>;
  if (cartItems.length === 0) {
    console.error("Cart is empty:", cartId);
    return;
  }

  // Batch-load all products
  const productIds = cartItems.map((item) => item.productId);
  const productList = await db.query.products.findMany({
    where: sql`${products.id} IN (${sql.join(
      productIds.map((id) => sql`${id}`),
      sql`, `
    )})`,
  });

  const productMap = new Map(productList.map((p) => [p.id, p]));

  // Validate all products exist
  const missingProducts = productIds.filter((id) => !productMap.has(id));
  if (missingProducts.length > 0) {
    console.error("Missing products:", missingProducts);
    return;
  }

  // Stock validation
  const stockIssues: string[] = [];
  for (const item of cartItems) {
    const product = productMap.get(item.productId)!;
    const availableStock = product.stock ?? 0;
    if (availableStock < item.quantity) {
      stockIssues.push(
        `${product.name}: requested ${item.quantity}, available ${availableStock}`
      );
    }
  }
  const hasStockIssues = stockIssues.length > 0;
  if (hasStockIssues) {
    console.warn("Stock issues detected:", stockIssues);
  }

  const subtotal = (session.amount_subtotal ?? 0) / 100;
  const shippingCost = (session.shipping_cost?.amount_total ?? 0) / 100;
  const discountAmount = (session.total_details?.amount_discount ?? 0) / 100;
  const total = (session.amount_total ?? 0) / 100;

  // Discount validation
  let discountIssues: string[] = [];
  let validatedDiscountCodeId: number | null = null;

  if (discountCodeId) {
    const discountCode = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, parseInt(discountCodeId, 10)),
    });

    if (!discountCode) {
      discountIssues.push("Discount code no longer exists");
    } else {
      const now = new Date();

      if (!discountCode.active) {
        discountIssues.push("Discount code is no longer active");
      }

      if (discountCode.startsAt && new Date(discountCode.startsAt) > now) {
        discountIssues.push("Discount code has not started yet");
      }

      if (discountCode.expiresAt && new Date(discountCode.expiresAt) < now) {
        discountIssues.push("Discount code has expired");
      }

      const currentUses = discountCode.usesCount ?? 0;
      if (discountCode.maxUses !== null && currentUses >= discountCode.maxUses) {
        discountIssues.push(
          `Discount code usage limit reached (${currentUses}/${discountCode.maxUses})`
        );
      }

      if (discountCode.minOrderValue !== null && subtotal < discountCode.minOrderValue) {
        discountIssues.push(
          `Order subtotal £${subtotal.toFixed(2)} below minimum £${discountCode.minOrderValue.toFixed(2)}`
        );
      }

      if (discountIssues.length === 0) {
        validatedDiscountCodeId = discountCode.id;
      }
    }
  }
  const hasDiscountIssues = discountIssues.length > 0;
  if (hasDiscountIssues) {
    console.warn("Discount issues detected:", discountIssues);
  }

  const allIssues = [...stockIssues, ...discountIssues];
  const orderStatus = hasStockIssues ? "on-hold" : "pending";
  const internalNotes = allIssues.length > 0
    ? `[AUTO] Order requires attention:\n- ${allIssues.join("\n- ")}`
    : null;

  const orderNumber = await generateOrderNumber();

  const collectedShipping = session.collected_information?.shipping_details;
  const shippingAddress = collectedShipping?.address ?? session.customer_details?.address;
  const shippingName = collectedShipping?.name ?? session.customer_details?.individual_name;

  const shippingAddressJson = JSON.stringify({
    name: shippingName,
    line1: shippingAddress?.line1,
    line2: shippingAddress?.line2,
    city: shippingAddress?.city,
    state: shippingAddress?.state,
    postalCode: shippingAddress?.postal_code,
    country: shippingAddress?.country,
  });

  const shippingMethod = session.shipping_cost?.shipping_rate
    ? await getShippingMethodName(session.shipping_cost.shipping_rate as string)
    : "Standard Shipping";

  const now = new Date().toISOString();

  // Transaction: All writes happen atomically
  const { order, createdOrderItems } = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        email: session.customer_details?.email ?? "",
        status: orderStatus,
        paymentStatus: "paid",
        subtotal,
        shippingCost,
        discountAmount,
        taxAmount: 0,
        total,
        currency: "GBP",
        discountCodeId: validatedDiscountCodeId,
        shippingMethod,
        shippingAddress: shippingAddressJson,
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string,
        internalNotes,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const orderItemsToInsert = cartItems.map((item) => {
      const product = productMap.get(item.productId)!;
      return {
        orderId: order.id,
        productId: item.productId,
        productName: product.name,
        colorway: product.colorHex ?? null,
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
        weightGrams: product.weightGrams,
        createdAt: now,
      };
    });

    const createdOrderItems = await tx
      .insert(orderItems)
      .values(orderItemsToInsert)
      .returning();

    // Decrement inventory for all products
    for (const item of cartItems) {
      await tx
        .update(products)
        .set({
          stock: sql`${products.stock} - ${item.quantity}`,
          updatedAt: now,
        })
        .where(eq(products.id, item.productId));
    }

    if (validatedDiscountCodeId) {
      await tx
        .update(discountCodes)
        .set({
          usesCount: sql`${discountCodes.usesCount} + 1`,
        })
        .where(eq(discountCodes.id, validatedDiscountCodeId));
    }

    await tx.delete(carts).where(eq(carts.id, parseInt(cartId, 10)));
    await tx.delete(stockReservations).where(eq(stockReservations.stripeSessionId, session.id));

    await tx.insert(orderEvents).values({
      orderId: order.id,
      event: "created",
      data: JSON.stringify({
        orderNumber: order.orderNumber,
        total: order.total,
        itemCount: createdOrderItems.length,
        hasIssues: hasStockIssues || hasDiscountIssues,
      }),
      createdAt: now,
    });

    await tx.insert(orderEvents).values({
      orderId: order.id,
      event: "paid",
      data: JSON.stringify({
        amount: order.total,
        stripeSessionId: session.id,
        paymentIntentId: session.payment_intent,
      }),
      createdAt: now,
    });

    await tx.insert(orderEvents).values({
      orderId: order.id,
      event: "stock_updated",
      data: JSON.stringify({
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        hasStockIssues,
      }),
      createdAt: now,
    });

    return { order, createdOrderItems };
  });

  console.log("Order created:", order.orderNumber, "status:", order.status);
  if (hasStockIssues || hasDiscountIssues) {
    console.warn("Order requires attention:", order.orderNumber, allIssues);
  }

  sendOrderConfirmationEmail(order, createdOrderItems)
    .then(async (result) => {
      if (result.success) {
        console.log("Order confirmation email sent for:", order.orderNumber);
        await logOrderEvent({
          orderId: order.id,
          event: "email_sent",
          data: { type: "order_confirmation", email: order.email },
        });
      } else {
        console.error("Failed to send order confirmation email:", result.error);
      }
    })
    .catch((error) => {
      console.error("Error sending order confirmation email:", error);
    });
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log("Processing checkout.session.expired:", session.id);

  await db
    .delete(stockReservations)
    .where(eq(stockReservations.stripeSessionId, session.id));

  console.log("Released reservations for expired session:", session.id);
}

async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");

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
