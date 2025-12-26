import { cookies } from "next/headers";

export const CART_SESSION_COOKIE = "cart_session";
const SESSION_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

export interface CartItemData {
  variantId: number;
  quantity: number;
}

export interface CartItem {
  id: string;
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  variantName: string;
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

export function generateCartItemId(variantId: number): string {
  return `cart_item_${variantId}`;
}
