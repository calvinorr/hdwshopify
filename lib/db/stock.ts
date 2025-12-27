import { and, eq, gt, sql, inArray } from "drizzle-orm";
import { db } from "./index";
import { stockReservations, productVariants } from "./schema";

/**
 * Get available stock for a single variant (accounting for active reservations)
 */
export async function getAvailableStock(variantId: number): Promise<number> {
  const now = new Date().toISOString();

  // Get physical stock
  const variant = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
    columns: { stock: true },
  });

  const physicalStock = variant?.stock ?? 0;

  // Sum up all non-expired reservations for this variant
  const reservations = await db
    .select({ totalReserved: sql<number>`COALESCE(SUM(${stockReservations.quantity}), 0)` })
    .from(stockReservations)
    .where(
      and(
        eq(stockReservations.variantId, variantId),
        gt(stockReservations.expiresAt, now)
      )
    );

  const reserved = reservations[0]?.totalReserved ?? 0;
  return Math.max(0, physicalStock - reserved);
}

/**
 * Get available stock for multiple variants in a single query (accounting for active reservations)
 * Returns a map of variantId -> availableStock
 */
export async function getAvailableStockBatch(variantIds: number[]): Promise<Map<number, number>> {
  if (variantIds.length === 0) {
    return new Map();
  }

  const now = new Date().toISOString();

  // Get physical stock for all variants
  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
    columns: { id: true, stock: true },
  });

  const physicalStockMap = new Map<number, number>();
  for (const v of variants) {
    physicalStockMap.set(v.id, v.stock ?? 0);
  }

  // Sum up all non-expired reservations for these variants
  const reservations = await db
    .select({
      variantId: stockReservations.variantId,
      totalReserved: sql<number>`COALESCE(SUM(${stockReservations.quantity}), 0)`,
    })
    .from(stockReservations)
    .where(
      and(
        inArray(stockReservations.variantId, variantIds),
        gt(stockReservations.expiresAt, now)
      )
    )
    .groupBy(stockReservations.variantId);

  const reservedMap = new Map<number, number>();
  for (const r of reservations) {
    reservedMap.set(r.variantId, r.totalReserved);
  }

  // Calculate available stock for each variant
  const result = new Map<number, number>();
  for (const variantId of variantIds) {
    const physical = physicalStockMap.get(variantId) ?? 0;
    const reserved = reservedMap.get(variantId) ?? 0;
    result.set(variantId, Math.max(0, physical - reserved));
  }

  return result;
}
