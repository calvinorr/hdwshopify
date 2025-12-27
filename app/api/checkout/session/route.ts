import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db, carts, shippingZones, shippingRates, discountCodes, productVariants } from "@/lib/db";
import { getCartSession, CartItemData } from "@/lib/cart";
import type Stripe from "stripe";

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
    const { discountCode } = body;

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

    // Populate cart items with current product data and validate stock
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    let totalWeightGrams = 0;
    let subtotal = 0;

    for (const item of cartItems) {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, item.variantId),
        with: {
          product: {
            with: {
              images: {
                limit: 1,
                orderBy: (images, { asc }) => [asc(images.position)],
              },
            },
          },
        },
      });

      if (!variant || variant.product.status !== "active") {
        return NextResponse.json(
          { error: `Product "${variant?.product?.name || "Unknown"}" is no longer available` },
          { status: 400 }
        );
      }

      // Check stock
      const stock = variant.stock ?? 0;
      if (item.quantity > stock) {
        return NextResponse.json(
          {
            error: stock === 0
              ? `"${variant.product.name} - ${variant.name}" is out of stock`
              : `Only ${stock} of "${variant.product.name} - ${variant.name}" available`,
          },
          { status: 400 }
        );
      }

      // Calculate weight and subtotal
      const itemWeight = (variant.weightGrams ?? 100) * item.quantity;
      totalWeightGrams += itemWeight;
      subtotal += variant.price * item.quantity;

      // Build Stripe line item
      const images = variant.product.images.length > 0
        ? [variant.product.images[0].url]
        : [];

      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: variant.product.name,
            description: variant.name !== variant.product.name ? variant.name : undefined,
            images: images.length > 0 ? images : undefined,
          },
          unit_amount: Math.round(variant.price * 100), // Convert pounds to pence
        },
        quantity: item.quantity,
      });
    }

    // Get shipping options
    const shippingOptions = await getShippingOptions(totalWeightGrams, subtotal);

    // Build checkout session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ALL_SHIPPING_COUNTRIES as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
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

async function getShippingOptions(
  weightGrams: number,
  subtotal: number
): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]> {
  const zones = await db.query.shippingZones.findMany({
    with: { rates: true },
  });

  const options: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];

  for (const zone of zones) {
    const countries: string[] = JSON.parse(zone.countries || "[]");

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

  // If no shipping options from DB, add a default
  if (options.length === 0) {
    options.push({
      shipping_rate_data: {
        type: "fixed_amount",
        fixed_amount: {
          amount: 395, // £3.95 default
          currency: "gbp",
        },
        display_name: "Standard Shipping",
        delivery_estimate: {
          minimum: { unit: "business_day", value: 3 },
          maximum: { unit: "business_day", value: 7 },
        },
      },
    });
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
