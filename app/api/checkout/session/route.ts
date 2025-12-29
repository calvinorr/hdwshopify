import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray, gt, sql } from "drizzle-orm";
import Stripe from "stripe";
import { db, carts, shippingZones, discountCodes, products, productImages, stockReservations } from "@/lib/db";
import { getCartSession, CartItemData } from "@/lib/cart";

// Create Stripe instance with fetch-based HTTP client for Vercel serverless compatibility
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
  httpClient: Stripe.createFetchHttpClient(),
});

const RESERVATION_DURATION_MINUTES = 30;

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
const FREE_SHIPPING_THRESHOLD = 50;
const FREE_SHIPPING_ZONES = ["UK"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { discountCode, shippingCountry } = body;

    if (!shippingCountry) {
      return NextResponse.json(
        { error: "Please select your shipping destination" },
        { status: 400 }
      );
    }

    if (!ALL_SHIPPING_COUNTRIES.includes(shippingCountry)) {
      return NextResponse.json(
        { error: "Sorry, we don't currently ship to your selected country" },
        { status: 400 }
      );
    }

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

    // Batch load all products
    const productIds = cartItems.map((item) => item.productId);
    const productList = await db.query.products.findMany({
      where: inArray(products.id, productIds),
    });

    const productMap = new Map(productList.map((p) => [p.id, p]));

    // Batch load all product images
    const allImages = await db.query.productImages.findMany({
      where: inArray(productImages.productId, productIds),
      orderBy: (images, { asc }) => [asc(images.position)],
    });

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
      const product = productMap.get(item.productId);

      if (!product || product.status !== "active") {
        return NextResponse.json(
          { error: `Product "${product?.name || "Unknown"}" is no longer available` },
          { status: 400 }
        );
      }

      // Check available stock (accounting for active reservations)
      const physicalStock = product.stock ?? 0;
      const availableStock = await getAvailableStock(product.id, physicalStock);

      if (item.quantity > availableStock) {
        return NextResponse.json(
          {
            error: availableStock === 0
              ? `"${product.name}" is out of stock`
              : `Only ${availableStock} of "${product.name}" available`,
          },
          { status: 400 }
        );
      }

      const itemWeight = (product.weightGrams ?? 100) * item.quantity;
      totalWeightGrams += itemWeight;
      subtotal += product.price * item.quantity;

      const imageUrl = productImageMap.get(product.id);

      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: product.name,
            images: imageUrl ? [imageUrl] : undefined,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity,
      });
    }

    const shippingOptions = await getShippingOptions(totalWeightGrams, subtotal, shippingCountry);

    if (shippingOptions.length === 0) {
      return NextResponse.json(
        { error: "No shipping options available for your destination. Please contact us for assistance." },
        { status: 400 }
      );
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: [shippingCountry] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
      },
      shipping_options: shippingOptions,
      success_url: `${getBaseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/cart`,
      metadata: {
        cartId: cart.id.toString(),
        sessionId: sessionId,
      },
    };

    if (discountCode) {
      const discount = await validateAndGetDiscount(discountCode, subtotal);
      if (discount) {
        const stripeCoupon = await getOrCreateStripeCoupon(discount);
        if (stripeCoupon) {
          sessionParams.discounts = [{ coupon: stripeCoupon.id }];
          sessionParams.metadata!.discountCodeId = discount.id.toString();
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create stock reservations for all items
    await createReservations(cartItems, session.id);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    // Return detailed error in development/test for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    // TEMP: Show detailed errors to debug production issue
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: errorMessage  // TEMP: Always show details for debugging
      },
      { status: 500 }
    );
  }
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
}

async function getAvailableStock(productId: number, currentStock: number): Promise<number> {
  const now = new Date().toISOString();

  const reservations = await db
    .select({ totalReserved: sql<number>`COALESCE(SUM(${stockReservations.quantity}), 0)` })
    .from(stockReservations)
    .where(
      and(
        eq(stockReservations.productId, productId),
        gt(stockReservations.expiresAt, now)
      )
    );

  const reserved = reservations[0]?.totalReserved ?? 0;
  return Math.max(0, currentStock - reserved);
}

async function createReservations(
  cartItems: CartItemData[],
  stripeSessionId: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MINUTES * 60 * 1000).toISOString();

  await db.insert(stockReservations).values(
    cartItems.map((item) => ({
      productId: item.productId,
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

    if (!countries.includes(customerCountry)) {
      continue;
    }

    const applicableRates = zone.rates.filter(
      (rate) =>
        weightGrams >= (rate.minWeightGrams ?? 0) &&
        (!rate.maxWeightGrams || weightGrams <= rate.maxWeightGrams)
    );

    for (const rate of applicableRates) {
      const isFreeShippingEligible =
        FREE_SHIPPING_ZONES.includes(zone.name) &&
        subtotal >= FREE_SHIPPING_THRESHOLD &&
        !rate.tracked;

      const priceInPence = isFreeShippingEligible ? 0 : Math.round(rate.price * 100);

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

  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return null;
  }

  if (discount.minOrderValue && subtotal < discount.minOrderValue) {
    return null;
  }

  if (discount.maxUses && (discount.usesCount ?? 0) >= discount.maxUses) {
    return null;
  }

  return discount;
}

async function getOrCreateStripeCoupon(discount: typeof discountCodes.$inferSelect) {
  try {
    const couponId = `hd_${discount.code.toLowerCase()}`;

    try {
      const existingCoupon = await stripe.coupons.retrieve(couponId);
      return existingCoupon;
    } catch {
      // Coupon doesn't exist, create it
    }

    const couponParams: Stripe.CouponCreateParams = {
      id: couponId,
      name: discount.code,
      currency: "gbp",
    };

    if (discount.type === "percentage") {
      couponParams.percent_off = discount.value;
    } else {
      couponParams.amount_off = Math.round(discount.value * 100);
    }

    const coupon = await stripe.coupons.create(couponParams);
    return coupon;
  } catch (error) {
    console.error("Error creating Stripe coupon:", error);
    return null;
  }
}
