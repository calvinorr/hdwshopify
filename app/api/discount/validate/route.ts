import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, discountCodes } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, subtotal } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 }
      );
    }

    if (typeof subtotal !== "number" || subtotal < 0) {
      return NextResponse.json(
        { error: "Valid subtotal is required" },
        { status: 400 }
      );
    }

    // Find the discount code
    const discount = await db.query.discountCodes.findFirst({
      where: and(
        eq(discountCodes.code, code.toUpperCase()),
        eq(discountCodes.active, true)
      ),
    });

    if (!discount) {
      return NextResponse.json(
        { error: "Invalid discount code" },
        { status: 400 }
      );
    }

    // Check expiry
    if (discount.expiresAt) {
      const expiryDate = new Date(discount.expiresAt);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: "This discount code has expired" },
          { status: 400 }
        );
      }
    }

    // Check start date
    if (discount.startsAt) {
      const startDate = new Date(discount.startsAt);
      if (startDate > new Date()) {
        return NextResponse.json(
          { error: "This discount code is not yet active" },
          { status: 400 }
        );
      }
    }

    // Check minimum order value
    if (discount.minOrderValue && subtotal < discount.minOrderValue) {
      return NextResponse.json(
        {
          error: `Minimum order of £${discount.minOrderValue.toFixed(2)} required for this code`,
        },
        { status: 400 }
      );
    }

    // Check usage limit
    if (discount.maxUses && (discount.usesCount ?? 0) >= discount.maxUses) {
      return NextResponse.json(
        { error: "This discount code has reached its usage limit" },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount: number;
    if (discount.type === "percentage") {
      discountAmount = subtotal * (discount.value / 100);
    } else {
      // Fixed amount - can't be more than subtotal
      discountAmount = Math.min(discount.value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      amount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
      description:
        discount.type === "percentage"
          ? `${discount.value}% off`
          : `£${discount.value.toFixed(2)} off`,
    });
  } catch (error) {
    console.error("Discount validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate discount code" },
      { status: 500 }
    );
  }
}
