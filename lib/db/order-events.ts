import { db, orderEvents } from "@/lib/db";

type OrderEventType =
  | "created"
  | "paid"
  | "stock_updated"
  | "email_sent"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "note_added"
  | "status_changed";

interface LogOrderEventParams {
  orderId: number;
  event: OrderEventType;
  data?: Record<string, unknown>;
}

/**
 * Log an immutable event to the order audit trail.
 * Events are append-only and cannot be modified or deleted.
 */
export async function logOrderEvent({ orderId, event, data }: LogOrderEventParams): Promise<void> {
  const now = new Date().toISOString();

  await db.insert(orderEvents).values({
    orderId,
    event,
    data: data ? JSON.stringify(data) : null,
    createdAt: now,
  });
}

/**
 * Log multiple events in a single transaction (for use within existing transactions).
 * Pass the transaction context (tx) to use within an existing transaction.
 */
export function createEventLogger(tx: typeof db) {
  return async function logEvent({ orderId, event, data }: LogOrderEventParams): Promise<void> {
    const now = new Date().toISOString();

    await tx.insert(orderEvents).values({
      orderId,
      event,
      data: data ? JSON.stringify(data) : null,
      createdAt: now,
    });
  };
}
