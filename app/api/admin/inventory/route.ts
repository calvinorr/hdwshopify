import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productVariants } from "@/lib/db/schema";
import { eq, desc, lte, gt, and, or, isNull, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

const LOW_STOCK_THRESHOLD = 2;

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];

    if (status === "out") {
      conditions.push(or(eq(productVariants.stock, 0), isNull(productVariants.stock)));
    } else if (status === "low") {
      conditions.push(
        and(
          gt(productVariants.stock, 0),
          lte(productVariants.stock, LOW_STOCK_THRESHOLD)
        )
      );
    } else if (status === "in") {
      conditions.push(gt(productVariants.stock, LOW_STOCK_THRESHOLD));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [variants, totalCount, outOfStockCount, lowStockCount] = await Promise.all([
      db.query.productVariants.findMany({
        where: whereClause,
        orderBy: [productVariants.stock, desc(productVariants.createdAt)],
        limit,
        offset,
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
      }),
      db.select({ count: sql<number>`count(*)` }).from(productVariants),
      db
        .select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .where(or(eq(productVariants.stock, 0), isNull(productVariants.stock))),
      db
        .select({ count: sql<number>`count(*)` })
        .from(productVariants)
        .where(
          and(
            gt(productVariants.stock, 0),
            lte(productVariants.stock, LOW_STOCK_THRESHOLD)
          )
        ),
    ]);

    return NextResponse.json({
      variants,
      stats: {
        total: Number(totalCount[0]?.count || 0),
        outOfStock: Number(outOfStockCount[0]?.count || 0),
        lowStock: Number(lowStockCount[0]?.count || 0),
      },
      page,
      limit,
    });
  } catch (error) {
    logError("inventory.GET", error, { query: request.url });
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const { variantId, stock } = body;

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant ID is required" },
        { status: 400 }
      );
    }

    if (stock === undefined || stock < 0) {
      return NextResponse.json(
        { error: "Stock must be a non-negative number" },
        { status: 400 }
      );
    }

    // Check if variant exists
    const existing = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Variant not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(productVariants)
      .set({
        stock,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(productVariants.id, variantId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    logError("inventory.PATCH", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}
