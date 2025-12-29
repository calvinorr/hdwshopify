import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";

interface BulkAdjustmentRequest {
  productIds: number[];
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
    const { productIds, operation, value } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: "No products selected" },
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

    if (operation === "set") {
      await db
        .update(products)
        .set({
          stock: value,
          updatedAt: now,
        })
        .where(inArray(products.id, productIds));

      updatedCount = productIds.length;
    } else if (operation === "increment") {
      await db
        .update(products)
        .set({
          stock: sql`${products.stock} + ${value}`,
          updatedAt: now,
        })
        .where(inArray(products.id, productIds));

      updatedCount = productIds.length;
    } else if (operation === "decrement") {
      await db
        .update(products)
        .set({
          stock: sql`MAX(0, COALESCE(${products.stock}, 0) - ${value})`,
          updatedAt: now,
        })
        .where(inArray(products.id, productIds));

      updatedCount = productIds.length;
    }

    console.log(`Bulk stock adjustment: ${operation} ${value} on ${updatedCount} products`);

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
