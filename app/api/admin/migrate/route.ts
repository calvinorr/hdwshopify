import { NextResponse } from "next/server";
import { migrateFromShopify, clearAllProducts } from "@/lib/shopify";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const clearExisting = searchParams.get("clear") === "true";

    const result = await migrateFromShopify({
      limit: limit ? parseInt(limit, 10) : 250,
      activeOnly,
      clearExisting,
    });

    return NextResponse.json({
      success: true,
      message: "Migration completed",
      ...result,
    });
  } catch (error) {
    logError("migrate.POST", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Migration failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    await clearAllProducts();
    return NextResponse.json({
      success: true,
      message: "All products cleared",
    });
  } catch (error) {
    logError("migrate.DELETE", error);
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
    message: "POST to this endpoint to run migration",
    options: {
      limit: "Number of products to import (default: 20)",
      activeOnly: "Only import active products (default: true)",
    },
    example: "POST /api/admin/migrate?limit=10&activeOnly=true",
  });
}
