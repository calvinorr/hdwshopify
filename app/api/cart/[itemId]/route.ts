import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, carts, products } from "@/lib/db";
import {
  ensureCartLinkedToCustomer,
  CartItemData,
  CartResponse,
  calculateSubtotal,
  calculateItemCount,
  CartItem,
  generateCartItemId,
} from "@/lib/cart";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// PATCH /api/cart/[itemId] - Update item quantity
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const { quantity } = body;

    if (typeof quantity !== "number" || quantity < 0) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      );
    }

    const { customerId, sessionId } = await ensureCartLinkedToCustomer();
    if (!customerId && !sessionId) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    // Look up cart
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
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    let storedItems: CartItemData[] = JSON.parse(cart.items || "[]");

    // Find item by ID (format: cart_item_{productId})
    const productId = parseInt(itemId.replace("cart_item_", ""), 10);
    const itemIndex = storedItems.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      storedItems.splice(itemIndex, 1);
    } else {
      // Validate stock
      const product = await db.query.products.findFirst({
        where: eq(products.id, productId),
      });

      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      const stock = product.stock ?? 0;
      if (quantity > stock) {
        return NextResponse.json(
          {
            error: `Only ${stock} available in stock`,
            availableStock: stock,
          },
          { status: 400 }
        );
      }

      storedItems[itemIndex].quantity = quantity;
    }

    const now = new Date().toISOString();
    await db
      .update(carts)
      .set({ items: JSON.stringify(storedItems), updatedAt: now })
      .where(eq(carts.id, cart.id));

    const populatedItems = await populateCartItems(storedItems);

    return NextResponse.json<CartResponse>({
      items: populatedItems,
      subtotal: calculateSubtotal(populatedItems),
      itemCount: calculateItemCount(populatedItems),
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update cart item" },
      { status: 500 }
    );
  }
}

// DELETE /api/cart/[itemId] - Remove item from cart
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { itemId } = await params;

    const { customerId, sessionId } = await ensureCartLinkedToCustomer();
    if (!customerId && !sessionId) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

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
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    let storedItems: CartItemData[] = JSON.parse(cart.items || "[]");

    const productId = parseInt(itemId.replace("cart_item_", ""), 10);
    const itemIndex = storedItems.findIndex(
      (item) => item.productId === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    storedItems.splice(itemIndex, 1);

    const now = new Date().toISOString();
    await db
      .update(carts)
      .set({ items: JSON.stringify(storedItems), updatedAt: now })
      .where(eq(carts.id, cart.id));

    const populatedItems = await populateCartItems(storedItems);

    return NextResponse.json<CartResponse>({
      items: populatedItems,
      subtotal: calculateSubtotal(populatedItems),
      itemCount: calculateItemCount(populatedItems),
    });
  } catch (error) {
    console.error("Error removing cart item:", error);
    return NextResponse.json(
      { error: "Failed to remove cart item" },
      { status: 500 }
    );
  }
}

// Helper to populate cart items with current product data
async function populateCartItems(items: CartItemData[]): Promise<CartItem[]> {
  if (items.length === 0) return [];

  const populatedItems: CartItem[] = [];

  for (const item of items) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, item.productId),
      with: {
        images: {
          limit: 1,
          orderBy: (images, { asc }) => [asc(images.position)],
        },
      },
    });

    if (!product || product.status !== "active") {
      continue;
    }

    populatedItems.push({
      id: generateCartItemId(item.productId),
      productId: item.productId,
      productName: product.name,
      productSlug: product.slug,
      price: product.price,
      quantity: item.quantity,
      stock: product.stock ?? 0,
      image: product.images[0]?.url,
      weightGrams: product.weightGrams ?? 100,
    });
  }

  return populatedItems;
}
