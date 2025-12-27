import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { desc, eq, like, or, and, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { orderQuerySchema } from "@/lib/validations/order";
import { logError } from "@/lib/logger";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const payment = searchParams.get("payment");
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const conditions = [];

    if (status) {
      conditions.push(eq(orders.status, status as any));
    }

    if (payment) {
      conditions.push(eq(orders.paymentStatus, payment as any));
    }

    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          like(orders.orderNumber, searchTerm),
          like(orders.email, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [orderList, countResult] = await Promise.all([
      db.query.orders.findMany({
        where: whereClause,
        orderBy: [desc(orders.createdAt)],
        limit,
        offset,
        with: {
          items: true,
          customer: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
    ]);

    return NextResponse.json({
      orders: orderList,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    logError("orders.GET", error, { query: request.url });
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
