import { NextRequest, NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";
import { db, carts, productVariants, products, productImages } from "@/lib/db";
import {
  getOrCreateCartSession,
  getCartSession,
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
    const sessionId = await getCartSession();

    if (!sessionId) {
      return NextResponse.json<CartResponse>({
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    const cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    });

    if (!cart) {
      return NextResponse.json<CartResponse>({
        items: [],
        subtotal: 0,
        itemCount: 0,
      });
    }

    const storedItems: CartItemData[] = JSON.parse(cart.items || "[]");

    // Populate cart items with current product data
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
    const { variantId, quantity = 1 } = body;

    if (!variantId || typeof variantId !== "number") {
      return NextResponse.json(
        { error: "Invalid variant ID" },
        { status: 400 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1" },
        { status: 400 }
      );
    }

    // Validate variant exists and has stock
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      with: {
        product: true,
      },
    });

    if (!variant) {
      return NextResponse.json(
        { error: "Product variant not found" },
        { status: 404 }
      );
    }

    if (variant.product.status !== "active") {
      return NextResponse.json(
        { error: "Product is not available" },
        { status: 400 }
      );
    }

    const sessionId = await getOrCreateCartSession();

    // Get or create cart
    let cart = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    });

    let storedItems: CartItemData[] = cart ? JSON.parse(cart.items || "[]") : [];

    // Check if item already in cart
    const existingIndex = storedItems.findIndex(
      (item) => item.variantId === variantId
    );
    const existingQuantity = existingIndex >= 0 ? storedItems[existingIndex].quantity : 0;
    const newQuantity = existingQuantity + quantity;

    // Validate stock
    const stock = variant.stock ?? 0;
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
      storedItems.push({ variantId, quantity });
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
        sessionId,
        items: itemsJson,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Return updated cart
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
// Uses batch loading to avoid N+1 queries
async function populateCartItems(items: CartItemData[]): Promise<CartItem[]> {
  if (items.length === 0) return [];

  const variantIds = items.map((item) => item.variantId);

  // Batch load all variants with their products (1 query)
  const variants = await db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
    with: {
      product: true,
    },
  });

  // Create lookup map for quick access
  const variantMap = new Map(variants.map((v) => [v.id, v]));

  // Get all product IDs for image lookup
  const productIds = [...new Set(variants.map((v) => v.productId))];

  // Batch load all images for these products (1 query)
  // Get both variant-specific and product-level images
  const allImages = await db.query.productImages.findMany({
    where: inArray(productImages.productId, productIds),
    orderBy: (images, { asc }) => [asc(images.position)],
  });

  // Create lookup maps for images
  // variantImageMap: variantId -> image (for variant-specific images)
  // productImageMap: productId -> first image (for fallback)
  const variantImageMap = new Map<number, string>();
  const productImageMap = new Map<number, string>();

  for (const image of allImages) {
    if (image.variantId && !variantImageMap.has(image.variantId)) {
      variantImageMap.set(image.variantId, image.url);
    }
    if (!productImageMap.has(image.productId)) {
      productImageMap.set(image.productId, image.url);
    }
  }

  // Build populated items from in-memory data
  const populatedItems: CartItem[] = [];

  for (const item of items) {
    const variant = variantMap.get(item.variantId);

    if (!variant || variant.product.status !== "active") {
      continue; // Skip invalid or inactive products
    }

    // Try variant-specific image first, then fall back to product image
    const imageUrl =
      variantImageMap.get(variant.id) || productImageMap.get(variant.productId);

    populatedItems.push({
      id: generateCartItemId(item.variantId),
      variantId: item.variantId,
      productId: variant.productId,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      variantName: variant.name,
      price: variant.price,
      quantity: item.quantity,
      stock: variant.stock ?? 0,
      image: imageUrl,
      weightGrams: variant.weightGrams ?? 100,
    });
  }

  return populatedItems;
}
