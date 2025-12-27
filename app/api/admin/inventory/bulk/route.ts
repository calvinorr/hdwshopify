import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productVariants } from "@/lib/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

interface BulkAdjustmentRequest {
  variantIds: number[];
  operation: "increment" | "decrement" | "set";
  value: number;
}

/**
 * Bulk stock adjustment endpoint
 *
 * Operations:
 * - increment: Add value to current stock
 * - decrement: Subtract value from current stock (min 0)
 * - set: Set stock to exact value
 */
export async function PATCH(request: NextRequest) {
  try {
    const body: BulkAdjustmentRequest = await request.json();
    const { variantIds, operation, value } = body;

    // Validate input
    if (!variantIds || !Array.isArray(variantIds) || variantIds.length === 0) {
      return NextResponse.json(
        { error: "No variants selected" },
        { status: 400 }
      );
    }

    if (!["increment", "decrement", "set"].includes(operation)) {
      return NextResponse.json(
        { error: "Invalid operation" },
        { status: 400 }
      );
    }

    if (typeof value !== "number" || value < 0) {
      return NextResponse.json(
        { error: "Value must be a non-negative number" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let updatedCount = 0;

    // Perform the bulk update based on operation
    if (operation === "set") {
      // Set all variants to exact value
      const result = await db
        .update(productVariants)
        .set({
          stock: value,
          updatedAt: now,
        })
        .where(inArray(productVariants.id, variantIds));

      updatedCount = variantIds.length;
    } else if (operation === "increment") {
      // Increment all variants by value
      const result = await db
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} + ${value}`,
          updatedAt: now,
        })
        .where(inArray(productVariants.id, variantIds));

      updatedCount = variantIds.length;
    } else if (operation === "decrement") {
      // Decrement all variants by value (minimum 0)
      const result = await db
        .update(productVariants)
        .set({
          stock: sql`MAX(0, COALESCE(${productVariants.stock}, 0) - ${value})`,
          updatedAt: now,
        })
        .where(inArray(productVariants.id, variantIds));

      updatedCount = variantIds.length;
    }

    console.log(`Bulk stock adjustment: ${operation} ${value} on ${updatedCount} variants`);

    return NextResponse.json({
      success: true,
      updatedCount,
      operation,
      value,
    });
  } catch (error) {
    console.error("Bulk stock adjustment error:", error);
    return NextResponse.json(
      { error: "Failed to adjust stock" },
      { status: 500 }
    );
  }
}
