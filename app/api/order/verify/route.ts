import { NextRequest, NextResponse } from "next/server";
import { db, orders } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateOrderToken } from "@/lib/order-token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, email } = body;

    if (!orderId || !email) {
      return NextResponse.json(
        { error: "Order ID and email are required" },
        { status: 400 }
      );
    }

    // Find the order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if email matches (case-insensitive)
    if (order.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match our records" },
        { status: 403 }
      );
    }

    // Generate token
    const token = generateOrderToken(orderId, email);

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Order verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify order" },
      { status: 500 }
    );
  }
}
