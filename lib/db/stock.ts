import { and, eq, gt, sql, inArray } from "drizzle-orm";
import { db } from "./index";
import { stockReservations, products } from "./schema";

/**
 * Get available stock for a single product (accounting for active reservations)
 */
export async function getAvailableStock(productId: number): Promise<number> {
  const now = new Date().toISOString();

  // Get physical stock
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
    columns: { stock: true },
  });

  const physicalStock = product?.stock ?? 0;

  // Sum up all non-expired reservations for this product
  const reservations = await db
    .select({ totalReserved: sql<number>`COALESCE(SUM(${stockReservations.quantity}), 0)` })
    .from(stockReservations)
    .where(
      and(
        eq(stockReservations.productId, productId),
        gt(stockReservations.expiresAt, now)
      )
    );

  const reserved = reservations[0]?.totalReserved ?? 0;
  return Math.max(0, physicalStock - reserved);
}

/**
 * Get available stock for multiple products in a single query (accounting for active reservations)
 * Returns a map of productId -> availableStock
 */
export async function getAvailableStockBatch(productIds: number[]): Promise<Map<number, number>> {
  if (productIds.length === 0) {
    return new Map();
  }

  const now = new Date().toISOString();

  // Get physical stock for all products
  const productList = await db.query.products.findMany({
    where: inArray(products.id, productIds),
    columns: { id: true, stock: true },
  });

  const physicalStockMap = new Map<number, number>();
  for (const p of productList) {
    physicalStockMap.set(p.id, p.stock ?? 0);
  }

  // Sum up all non-expired reservations for these products
  const reservations = await db
    .select({
      productId: stockReservations.productId,
      totalReserved: sql<number>`COALESCE(SUM(${stockReservations.quantity}), 0)`,
    })
    .from(stockReservations)
    .where(
      and(
        inArray(stockReservations.productId, productIds),
        gt(stockReservations.expiresAt, now)
      )
    )
    .groupBy(stockReservations.productId);

  const reservedMap = new Map<number, number>();
  for (const r of reservations) {
    reservedMap.set(r.productId, r.totalReserved);
  }

  // Calculate available stock for each product
  const result = new Map<number, number>();
  for (const productId of productIds) {
    const physical = physicalStockMap.get(productId) ?? 0;
    const reserved = reservedMap.get(productId) ?? 0;
    result.set(productId, Math.max(0, physical - reserved));
  }

  return result;
}
