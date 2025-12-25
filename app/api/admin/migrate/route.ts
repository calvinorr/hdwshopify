import { NextResponse } from "next/server";
import { migrateFromShopify, importSampleProducts } from "@/lib/shopify";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const activeOnly = searchParams.get("activeOnly") === "true";

    let result;

    if (limit) {
      // Import limited number of products
      result = await migrateFromShopify({
        limit: parseInt(limit, 10),
        activeOnly,
      });
    } else {
      // Import sample (20 active products)
      result = await importSampleProducts(20);
    }

    return NextResponse.json({
      success: true,
      message: "Migration completed",
      ...result,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to this endpoint to run migration",
    options: {
      limit: "Number of products to import (default: 20)",
      activeOnly: "Only import active products (default: true)",
    },
    example: "POST /api/admin/migrate?limit=10&activeOnly=true",
  });
}
