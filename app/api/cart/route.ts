import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db, carts, products, productImages } from "@/lib/db";
import {
  getOrCreateCartSession,
  ensureCartLinkedToCustomer,
  CartItem,
  CartItemData,
  CartResponse,
  calculateSubtotal,
  calculateItemCount,
  generateCartItemId,
} from "@/lib/cart";

// GET /api/cart - Fetch current cart with populated product details
export async function GET() {
  try {
    const { customerId, sessionId } = await ensureCartLinkedToCustomer();

    if (!customerId && !sessionId) {
      return NextResponse.json<CartResponse>({
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    // Look up cart - prefer customerId, fallback to sessionId
    let cart;
    if (customerId) {
      cart = await db.query.carts.findFirst({
        where: eq(carts.customerId, customerId),
      });
    }
    if (!cart && sessionId) {
      cart = await db.query.carts.findFirst({
        where: eq(carts.sessionId, sessionId),
      });
    }

    if (!cart) {
      return NextResponse.json<CartResponse>({
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    const storedItems: CartItemData[] = JSON.parse(cart.items || "[]");
    const populatedItems = await populateCartItems(storedItems);

    return NextResponse.json<CartResponse>({
      items: populatedItems,
      subtotal: calculateSubtotal(populatedItems),
      itemCount: calculateItemCount(populatedItems),
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId || typeof productId !== "number") {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    // Validate product exists and is active
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.status !== "active") {
      return NextResponse.json(
        { error: "Product is not available" },
        { status: 400 }
      );
    }

    // Get cart identifier
    const { customerId, sessionId: existingSessionId } = await ensureCartLinkedToCustomer();
    const sessionId = existingSessionId || await getOrCreateCartSession();

    // Get or create cart
    let cart;
    if (customerId) {
      cart = await db.query.carts.findFirst({
        where: eq(carts.customerId, customerId),
      });
    }
    if (!cart && sessionId) {
      cart = await db.query.carts.findFirst({
        where: eq(carts.sessionId, sessionId),
      });
    }

    let storedItems: CartItemData[] = cart ? JSON.parse(cart.items || "[]") : [];

    // Check if item already in cart
    const existingIndex = storedItems.findIndex(
      (item) => item.productId === productId
    );
    const existingQuantity = existingIndex >= 0 ? storedItems[existingIndex].quantity : 0;
    const newQuantity = existingQuantity + quantity;

    // Validate stock
    const stock = product.stock ?? 0;
    if (newQuantity > stock) {
      return NextResponse.json(
        {
          error: stock === 0
            ? "This item is out of stock"
            : `Only ${stock} available in stock`,
          availableStock: stock,
        },
        { status: 400 }
      );
    }

    // Update or add item
    if (existingIndex >= 0) {
      storedItems[existingIndex].quantity = newQuantity;
    } else {
      storedItems.push({ productId, quantity });
    }

    const itemsJson = JSON.stringify(storedItems);
    const now = new Date().toISOString();

    if (cart) {
      await db
        .update(carts)
        .set({ items: itemsJson, updatedAt: now })
        .where(eq(carts.id, cart.id));
    } else {
      await db.insert(carts).values({
        customerId: customerId || null,
        sessionId: customerId ? null : sessionId,
        items: itemsJson,
        createdAt: now,
        updatedAt: now,
      });
    }

    const populatedItems = await populateCartItems(storedItems);

    return NextResponse.json<CartResponse>({
      items: populatedItems,
      subtotal: calculateSubtotal(populatedItems),
      itemCount: calculateItemCount(populatedItems),
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

// Helper to populate cart items with current product data
async function populateCartItems(items: CartItemData[]): Promise<CartItem[]> {
  if (items.length === 0) return [];

  const productIds = items.map((item) => item.productId);

  // Batch load all products
  const productList = await db.query.products.findMany({
    where: inArray(products.id, productIds),
  });

  const productMap = new Map(productList.map((p) => [p.id, p]));

  // Batch load images
  const allImages = await db.query.productImages.findMany({
    where: inArray(productImages.productId, productIds),
    orderBy: (images, { asc }) => [asc(images.position)],
  });

  const productImageMap = new Map<number, string>();
  for (const image of allImages) {
    if (!productImageMap.has(image.productId)) {
      productImageMap.set(image.productId, image.url);
    }
  }

  const populatedItems: CartItem[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product || product.status !== "active") {
      continue;
    }

    populatedItems.push({
      id: generateCartItemId(item.productId),
      productId: item.productId,
      productName: product.name,
      productSlug: product.slug,
      colorway: product.colorHex ? undefined : undefined, // Could add colorway field to products
      price: product.price,
      quantity: item.quantity,
      stock: product.stock ?? 0,
      image: productImageMap.get(item.productId),
      weightGrams: product.weightGrams ?? 100,
    });
  }

  return populatedItems;
}
