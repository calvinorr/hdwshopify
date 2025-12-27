import { NextResponse } from "next/server";
import { migrateCustomers, clearAllCustomers } from "@/lib/shopify";
import { logError } from "@/lib/logger";
import { requireAdmin } from "@/lib/auth/admin";

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const result = await migrateCustomers({
      limit: limit ? parseInt(limit, 10) : 250,
    });

    return NextResponse.json({
      success: true,
      message: "Customer import completed",
      ...result,
    });
  } catch (error) {
    logError("migrate.customers.POST", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Customer import failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    await clearAllCustomers();
    return NextResponse.json({
      success: true,
      message: "All customers cleared",
    });
  } catch (error) {
    logError("migrate.customers.DELETE", error);
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
    message: "POST to this endpoint to import customers from Shopify",
    options: {
      limit: "Number of customers to import (default: 250)",
    },
    example: "POST /api/admin/migrate/customers?limit=100",
  });
}
