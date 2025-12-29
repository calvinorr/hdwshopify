import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { db, carts, customers } from "@/lib/db";
import { eq, and, isNull } from "drizzle-orm";

export const CART_SESSION_COOKIE = "cart_session";
const SESSION_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

// Check if Clerk is configured
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

export interface CartItemData {
  productId: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: number;
  productName: string;
  productSlug: string;
  colorway?: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  weightGrams: number;
}

export interface CartResponse {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export async function getOrCreateCartSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_SESSION_COOKIE);

  if (existing) return existing.value;

  const sessionId = crypto.randomUUID();
  cookieStore.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY,
  });

  return sessionId;
}

export async function getCartSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_SESSION_COOKIE)?.value ?? null;
}

export function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export function generateCartItemId(productId: number): string {
  return `cart_item_${productId}`;
}

/**
 * Get the current customer ID if logged in
 */
export async function getCustomerId(): Promise<number | null> {
  if (!isClerkConfigured) return null;

  try {
    const { userId } = await auth();
    if (!userId) return null;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.clerkId, userId),
      columns: { id: true },
    });

    return customer?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Get cart identifier - returns customerId if logged in, otherwise sessionId
 */
export async function getCartIdentifier(): Promise<{
  customerId: number | null;
  sessionId: string | null;
}> {
  const customerId = await getCustomerId();
  const sessionId = await getCartSession();
  return { customerId, sessionId };
}

/**
 * Merge guest cart into customer cart on login.
 * Combines quantities for duplicate products.
 */
export async function mergeCartsOnLogin(
  customerId: number,
  sessionId: string
): Promise<void> {
  // Find guest cart
  const guestCart = await db.query.carts.findFirst({
    where: and(eq(carts.sessionId, sessionId), isNull(carts.customerId)),
  });

  if (!guestCart) return; // No guest cart to merge

  const guestItems: CartItemData[] = JSON.parse(guestCart.items || "[]");
  if (guestItems.length === 0) {
    // Empty guest cart, just delete it
    await db.delete(carts).where(eq(carts.id, guestCart.id));
    return;
  }

  // Find customer cart
  const customerCart = await db.query.carts.findFirst({
    where: eq(carts.customerId, customerId),
  });

  const now = new Date().toISOString();

  if (!customerCart) {
    // No customer cart - convert guest cart to customer cart
    await db
      .update(carts)
      .set({ customerId, sessionId: null, updatedAt: now })
      .where(eq(carts.id, guestCart.id));
    return;
  }

  // Both carts exist - merge items
  const customerItems: CartItemData[] = JSON.parse(customerCart.items || "[]");

  // Create map of customer items for quick lookup
  const itemMap = new Map<number, number>();
  for (const item of customerItems) {
    itemMap.set(item.productId, item.quantity);
  }

  // Add guest items to map (combine quantities)
  for (const item of guestItems) {
    const existing = itemMap.get(item.productId) || 0;
    itemMap.set(item.productId, existing + item.quantity);
  }

  // Convert map back to array
  const mergedItems: CartItemData[] = Array.from(itemMap.entries()).map(
    ([productId, quantity]) => ({ productId, quantity })
  );

  // Update customer cart with merged items
  await db
    .update(carts)
    .set({ items: JSON.stringify(mergedItems), updatedAt: now })
    .where(eq(carts.id, customerCart.id));

  // Delete guest cart
  await db.delete(carts).where(eq(carts.id, guestCart.id));
}

/**
 * Ensure cart is linked to customer if logged in.
 * Call this when accessing cart to auto-link on first access after login.
 */
export async function ensureCartLinkedToCustomer(): Promise<{
  customerId: number | null;
  sessionId: string | null;
}> {
  const customerId = await getCustomerId();
  const sessionId = await getCartSession();

  if (customerId && sessionId) {
    // Logged in with a session - check if we need to merge
    await mergeCartsOnLogin(customerId, sessionId);
  }

  return { customerId, sessionId };
}
