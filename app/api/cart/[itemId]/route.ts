import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, carts, productVariants } from "@/lib/db";
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

    // Look up cart - prefer customerId
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

    // Find item by ID (format: cart_item_{variantId})
    const variantId = parseInt(itemId.replace("cart_item_", ""), 10);
    const itemIndex = storedItems.findIndex(
      (item) => item.variantId === variantId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    if (quantity === 0) {
      // Remove item
      storedItems.splice(itemIndex, 1);
    } else {
      // Validate stock
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.id, variantId),
      });

      if (!variant) {
        return NextResponse.json(
          { error: "Product variant not found" },
          { status: 404 }
        );
      }

      const stock = variant.stock ?? 0;
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

    // Update cart
    const now = new Date().toISOString();
    await db
      .update(carts)
      .set({ items: JSON.stringify(storedItems), updatedAt: now })
      .where(eq(carts.id, cart.id));

    // Return updated cart
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

    // Look up cart - prefer customerId
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

    // Find item by ID (format: cart_item_{variantId})
    const variantId = parseInt(itemId.replace("cart_item_", ""), 10);
    const itemIndex = storedItems.findIndex(
      (item) => item.variantId === variantId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    // Remove item
    storedItems.splice(itemIndex, 1);

    // Update cart
    const now = new Date().toISOString();
    await db
      .update(carts)
      .set({ items: JSON.stringify(storedItems), updatedAt: now })
      .where(eq(carts.id, cart.id));

    // Return updated cart
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
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId),
      with: {
        product: {
          with: {
            images: {
              limit: 1,
              orderBy: (images, { asc }) => [asc(images.position)],
            },
          },
        },
      },
    });

    if (!variant || variant.product.status !== "active") {
      continue;
    }

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
      image: variant.product.images[0]?.url,
      weightGrams: variant.weightGrams ?? 100,
    });
  }

  return populatedItems;
}
