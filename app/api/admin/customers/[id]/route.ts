import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let customerId: number | undefined;

  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    customerId = parsedId;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.id, parsedId),
      with: {
        orders: {
          orderBy: (orders, { desc }) => [desc(orders.createdAt)],
          with: {
            items: true,
          },
        },
        addresses: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Calculate stats
    const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
    const orderCount = customer.orders.length;

    return NextResponse.json({
      ...customer,
      orderCount,
      totalSpent,
    });
  } catch (error) {
    logError("customers.GET", error, { customerId });
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let customerId: number | undefined;

  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    customerId = parsedId;

    const body = await request.json();
    const { firstName, lastName, phone, acceptsMarketing } = body;

    // Check if customer exists
    const existing = await db.query.customers.findFirst({
      where: eq(customers.id, parsedId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(customers)
      .set({
        firstName: firstName !== undefined ? firstName : existing.firstName,
        lastName: lastName !== undefined ? lastName : existing.lastName,
        phone: phone !== undefined ? phone : existing.phone,
        acceptsMarketing: acceptsMarketing !== undefined ? acceptsMarketing : existing.acceptsMarketing,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customers.id, parsedId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    logError("customers.PATCH", error, { customerId });
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
