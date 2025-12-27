import { NextResponse } from "next/server";
import { migrateOrders, clearAllOrders } from "@/lib/shopify";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const result = await migrateOrders({
      limit: limit ? parseInt(limit, 10) : 250,
    });

    return NextResponse.json({
      success: true,
      message: "Order import completed",
      ...result,
    });
  } catch (error) {
    logError("migrate.orders.POST", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Order import failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    await clearAllOrders();
    return NextResponse.json({
      success: true,
      message: "All orders cleared",
    });
  } catch (error) {
    logError("migrate.orders.DELETE", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Clear failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  return NextResponse.json({
    message: "POST to this endpoint to import orders from Shopify",
    options: {
      limit: "Number of orders to import (default: 250)",
    },
    example: "POST /api/admin/migrate/orders?limit=100",
    notes: [
      "Orders are matched by order number to avoid duplicates",
      "Customers are linked by email if they exist",
      "Line items are linked to variants by SKU if possible",
      "Import customers before orders for proper linking",
    ],
  });
}
