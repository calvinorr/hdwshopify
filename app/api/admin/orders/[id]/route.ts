import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { updateOrderSchema } from "@/lib/validations/order";
import { logError } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let orderId: number | undefined;

  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    orderId = parsedId;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parsedId),
      with: {
        items: true,
        customer: true,
        discountCode: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    logError("orders.GET", error, { orderId });
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let orderId: number | undefined;

  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    orderId = parsedId;

    const body = await request.json();

    // Validate request body with Zod
    const parseResult = updateOrderSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      status,
      paymentStatus,
      trackingNumber,
      trackingUrl,
      internalNotes,
    } = parseResult.data;

    // Check if order exists
    const existing = await db.query.orders.findFirst({
      where: eq(orders.id, parsedId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;

      // Auto-set timestamps based on status changes
      if (status === "shipped" && !existing.shippedAt) {
        updateData.shippedAt = new Date().toISOString();
      }
      if (status === "delivered" && !existing.deliveredAt) {
        updateData.deliveredAt = new Date().toISOString();
      }
    }

    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }

    if (trackingNumber !== undefined) {
      updateData.trackingNumber = trackingNumber;
    }

    if (trackingUrl !== undefined) {
      updateData.trackingUrl = trackingUrl;
    }

    if (internalNotes !== undefined) {
      updateData.internalNotes = internalNotes;
    }

    const [updated] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, parsedId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    logError("orders.PATCH", error, { orderId });
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
