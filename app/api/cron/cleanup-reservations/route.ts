import { NextRequest, NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { db, stockReservations } from "@/lib/db";

/**
 * Cleanup expired stock reservations
 *
 * This is a fallback mechanism in case Stripe's checkout.session.expired
 * webhook isn't received. Should be called periodically (e.g., every 5 minutes).
 *
 * Can be triggered by:
 * - Vercel Cron (add to vercel.json)
 * - External cron service
 * - Manual curl request
 */
export async function GET(request: NextRequest) {
  // Optional: Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const now = new Date().toISOString();

    // Delete all expired reservations
    const result = await db
      .delete(stockReservations)
      .where(lt(stockReservations.expiresAt, now))
      .returning({ id: stockReservations.id });

    const deletedCount = result.length;

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired stock reservations`);
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: now,
    });
  } catch (error) {
    console.error("Error cleaning up reservations:", error);
    return NextResponse.json(
      { error: "Failed to cleanup reservations" },
      { status: 500 }
    );
  }
}

// Also support POST for webhook-style triggers
export { GET as POST };
