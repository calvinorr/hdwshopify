import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray, gt, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db, carts, shippingZones, shippingRates, discountCodes, productVariants, productImages, stockReservations } from "@/lib/db";
import { getCartSession, CartItemData } from "@/lib/cart";
import type Stripe from "stripe";

// Reservation duration in minutes
const RESERVATION_DURATION_MINUTES = 30;

// Countries we ship to, grouped by zone
const SHIPPING_COUNTRIES: Record<string, string[]> = {
  UK: ["GB"],
  Ireland: ["IE"],
  Europe: [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
    "GR", "HU", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT",
    "RO", "SK", "SI", "ES", "SE",
  ],
  International: ["US", "CA", "AU", "NZ", "JP", "CH", "NO"],
};

const ALL_SHIPPING_COUNTRIES = Object.values(SHIPPING_COUNTRIES).flat();

// Free shipping threshold (in pounds)
const FREE_SHIPPING_THRESHOLD = 50;
const FREE_SHIPPING_ZONES = ["UK"]; // Only UK gets free shipping

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discountCode, shippingCountry } = body;

    // Validate shipping country is provided
    if (!shippingCountry) {
      return NextResponse.json(
        { error: "Please select your shipping destination" },
        { status: 400 }
      );
    }

    // Validate country is in our allowed list
    if (!ALL_SHIPPING_COUNTRIES.includes(shippingCountry)) {
      return NextResponse.json(
        { error: "Sorry, we don't currently ship to your selected country" },
        { status: 400 }
      );
    }

    // Get cart
    const sessionId = await getCartSession();
    if (!sessionId) {
      return NextResponse.json(
        { error: "No cart found" },
        { status: 400 }
      );
    }

    const cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    });

    if (!cart) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const cartItems: CartItemData[] = JSON.parse(cart.items || "[]");
    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Batch load all variants with their products (1 query instead of N)
    const variantIds = cartItems.map((item) => item.variantId);
    const variants = await db.query.productVariants.findMany({
      where: inArray(productVariants.id, variantIds),
      with: {
        product: true,
      },
    });

    // Create lookup map
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Batch load all product images (1 query instead of N)
    const productIds = [...new Set(variants.map((v) => v.productId))];
    const allImages = await db.query.productImages.findMany({
      where: inArray(productImages.productId, productIds),
      orderBy: (images, { asc }) => [asc(images.position)],
    });

    // Create image lookup map (productId -> first image URL)
    const productImageMap = new Map<number, string>();
    for (const image of allImages) {
      if (!productImageMap.has(image.productId)) {
        productImageMap.set(image.productId, image.url);
      }
    }

    // Validate all items and build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let totalWeightGrams = 0;
    let subtotal = 0;

    for (const item of cartItems) {
      const variant = variantMap.get(item.variantId);

      if (!variant || variant.product.status !== "active") {
        return NextResponse.json(
          { error: `Product "${variant?.product?.name || "Unknown"}" is no longer available` },
          { status: 400 }
        );
      }

      // Check available stock (accounting for active reservations)
      const physicalStock = variant.stock ?? 0;
      const availableStock = await getAvailableStock(variant.id, physicalStock);

      if (item.quantity > availableStock) {
        return NextResponse.json(
          {
            error: availableStock === 0
              ? `"${variant.product.name} - ${variant.name}" is out of stock`
              : `Only ${availableStock} of "${variant.product.name} - ${variant.name}" available`,
          },
          { status: 400 }
        );
      }

      // Calculate weight and subtotal
      const itemWeight = (variant.weightGrams ?? 100) * item.quantity;
      totalWeightGrams += itemWeight;
      subtotal += variant.price * item.quantity;

      // Build Stripe line item
      const imageUrl = productImageMap.get(variant.productId);

      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: variant.product.name,
            description: variant.name !== variant.product.name ? variant.name : undefined,
            images: imageUrl ? [imageUrl] : undefined,
          },
          unit_amount: Math.round(variant.price * 100), // Convert pounds to pence
        },
        quantity: item.quantity,
      });
    }

    // Get shipping options filtered by customer's country
    const shippingOptions = await getShippingOptions(totalWeightGrams, subtotal, shippingCountry);

    if (shippingOptions.length === 0) {
      return NextResponse.json(
        { error: "No shipping options available for your destination. Please contact us for assistance." },
        { status: 400 }
      );
    }

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_address_collection: {
        // Only allow the country the customer selected - prevents mismatch
        allowed_countries: [shippingCountry] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      shipping_options: shippingOptions,
      success_url: `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/cart`,
      metadata: {
        cartId: cart.id.toString(),
        sessionId: sessionId,
      },
      // Enable adaptive pricing for international customers
      adaptive_pricing: { enabled: true },
    };

    // Handle discount code
    if (discountCode) {
      const discount = await validateAndGetDiscount(discountCode, subtotal);
      if (discount) {
        // Create or get Stripe coupon
        const stripeCoupon = await getOrCreateStripeCoupon(discount);
        if (stripeCoupon) {
          sessionParams.discounts = [{ coupon: stripeCoupon.id }];
          sessionParams.metadata!.discountCodeId = discount.id.toString();
        }
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create stock reservations for all items in this session
    await createReservations(cartItems, session.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
}

/**
 * Get the available stock for a variant, accounting for active reservations
 */
async function getAvailableStock(variantId: number, currentStock: number): Promise<number> {
  const now = new Date().toISOString();

  // Sum up all non-expired reservations for this variant
  const reservations = await db
    .select({ totalReserved: sql<number>`COALESCE(SUM(${stockReservations.quantity}), 0)` })
    .from(stockReservations)
    .where(
      and(
        eq(stockReservations.variantId, variantId),
        gt(stockReservations.expiresAt, now)
      )
    );

  const reserved = reservations[0]?.totalReserved ?? 0;
  return Math.max(0, currentStock - reserved);
}

/**
 * Create stock reservations for all cart items
 */
async function createReservations(
  cartItems: { variantId: number; quantity: number }[],
  stripeSessionId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();

  await db.insert(stockReservations).values(
    cartItems.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      stripeSessionId,
      expiresAt,
    }))
  );
}

async function getShippingOptions(
  weightGrams: number,
  subtotal: number,
  customerCountry: string
): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]> {
  const zones = await db.query.shippingZones.findMany({
    with: { rates: true },
  });

  const options: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];

  for (const zone of zones) {
    const countries: string[] = JSON.parse(zone.countries || "[]");

    // Only include rates for zones that include the customer's country
    if (!countries.includes(customerCountry)) {
      continue;
    }

    // Find applicable rates for this weight
    const applicableRates = zone.rates.filter(
      (rate) =>
        weightGrams >= (rate.minWeightGrams ?? 0) &&
        (!rate.maxWeightGrams || weightGrams <= rate.maxWeightGrams)
    );

    for (const rate of applicableRates) {
      // Check for free shipping eligibility
      const isFreeShippingEligible =
        FREE_SHIPPING_ZONES.includes(zone.name) &&
        subtotal >= FREE_SHIPPING_THRESHOLD &&
        !rate.tracked; // Free shipping only on standard (non-tracked)

      const priceInPence = isFreeShippingEligible ? 0 : Math.round(rate.price * 100);

      // Parse delivery estimate
      const [minDays, maxDays] = (rate.estimatedDays || "3-7")
        .split("-")
        .map((d) => parseInt(d.trim(), 10));

      options.push({
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: priceInPence,
            currency: "gbp",
          },
          display_name: isFreeShippingEligible
            ? `${rate.name} (Free over £${FREE_SHIPPING_THRESHOLD})`
            : rate.name,
          delivery_estimate: {
            minimum: { unit: "business_day", value: minDays || 3 },
            maximum: { unit: "business_day", value: maxDays || 7 },
          },
          metadata: {
            zone_id: zone.id.toString(),
            rate_id: rate.id.toString(),
            zone_name: zone.name,
          },
        },
      });
    }
  }

  // No fallback - if no rates match, caller should return error
  return options;
}

async function validateAndGetDiscount(code: string, subtotal: number) {
  const discount = await db.query.discountCodes.findFirst({
    where: and(
      eq(discountCodes.code, code.toUpperCase()),
      eq(discountCodes.active, true)
    ),
  });

  if (!discount) return null;

  // Check expiry
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return null;
  }

  // Check minimum order value
  if (discount.minOrderValue && subtotal < discount.minOrderValue) {
    return null;
  }

  // Check usage limit
  if (discount.maxUses && (discount.usesCount ?? 0) >= discount.maxUses) {
    return null;
  }

  return discount;
}

async function getOrCreateStripeCoupon(discount: typeof discountCodes.$inferSelect) {
  try {
    // Try to retrieve existing coupon
    const couponId = `hd_${discount.code.toLowerCase()}`;

    try {
      const existingCoupon = await stripe.coupons.retrieve(couponId);
      return existingCoupon;
    } catch {
      // Coupon doesn't exist, create it
    }

    // Create new coupon
    const couponParams: Stripe.CouponCreateParams = {
      id: couponId,
      name: discount.code,
      currency: "gbp",
    };

    if (discount.type === "percentage") {
      couponParams.percent_off = discount.value;
    } else {
      couponParams.amount_off = Math.round(discount.value * 100); // Convert to pence
    }

    const coupon = await stripe.coupons.create(couponParams);
    return coupon;
  } catch (error) {
    console.error("Error creating Stripe coupon:", error);
    return null;
  }
}
