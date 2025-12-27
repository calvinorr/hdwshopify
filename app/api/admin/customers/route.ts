import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";
import { desc, like, or, sql, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let whereClause;
    if (q) {
      const searchTerm = `%${q}%`;
      whereClause = or(
        like(customers.email, searchTerm),
        like(customers.firstName, searchTerm),
        like(customers.lastName, searchTerm)
      );
    }

    // Use SQL aggregation to avoid N+1 query
    // This fetches customers with order stats in a single query
    const [customerList, countResult] = await Promise.all([
      db
        .select({
          id: customers.id,
          email: customers.email,
          clerkId: customers.clerkId,
          firstName: customers.firstName,
          lastName: customers.lastName,
          phone: customers.phone,
          acceptsMarketing: customers.acceptsMarketing,
          createdAt: customers.createdAt,
          updatedAt: customers.updatedAt,
          orderCount: sql<number>`count(${orders.id})`.as("order_count"),
          totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`.as("total_spent"),
        })
        .from(customers)
        .leftJoin(orders, eq(customers.id, orders.customerId))
        .where(whereClause)
        .groupBy(customers.id)
        .orderBy(desc(customers.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause),
    ]);

    return NextResponse.json({
      customers: customerList,
      total: Number(countResult[0]?.count || 0),
      page,
      limit,
    });
  } catch (error) {
    logError("customers.GET", error, { query: request.url });
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
