import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { z } from "zod";
import { logError } from "@/lib/logger";
import { sendShippingConfirmationEmail } from "@/lib/email/send-shipping-confirmation";

const bulkUpdateSchema = z.object({
  orderIds: z.array(z.number()).min(1, "At least one order ID required"),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]),
});

export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();

    // Validate request body
    const parseResult = bulkUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { orderIds, status } = parseResult.data;

    // Get existing orders to check current status
    const existingOrders = await db.query.orders.findMany({
      where: inArray(orders.id, orderIds),
    });

    if (existingOrders.length === 0) {
      return NextResponse.json(
        { error: "No orders found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };

    // Auto-set timestamps based on status
    if (status === "shipped") {
      updateData.shippedAt = new Date().toISOString();
    }
    if (status === "delivered") {
      updateData.deliveredAt = new Date().toISOString();
    }

    // Update all orders
    await db
      .update(orders)
      .set(updateData)
      .where(inArray(orders.id, orderIds));

    // Send shipping emails for orders that are newly marked as shipped
    if (status === "shipped") {
      const ordersToNotify = existingOrders.filter(
        (order) => order.status !== "shipped"
      );

      // Send emails in background (don't await all)
      for (const order of ordersToNotify) {
        const items = await db.query.orderItems.findMany({
          where: eq(orderItems.orderId, order.id),
        });

        // Update order object with new status for email
        const updatedOrder = {
          ...order,
          status: "shipped" as const,
          shippedAt: updateData.shippedAt as string
        };

        sendShippingConfirmationEmail(updatedOrder, items).catch((err) => {
          console.error(`Failed to send shipping email for order ${order.id}:`, err);
        });
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: existingOrders.length,
    });
  } catch (error) {
    logError("orders.bulk.PATCH", error);
    return NextResponse.json(
      { error: "Failed to update orders" },
      { status: 500 }
    );
  }
}
