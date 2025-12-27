# E2: Shopping Cart ✅ COMPLETED

> **Status**: COMPLETED (Archived)
> **Completed**: December 2024

**Priority**: P0
**Complexity**: Medium
**Dependencies**: E1 (Product Catalog)

## Overview

Implement a persistent shopping cart that allows customers to add products, modify quantities, and prepare for checkout. Supports both guest and authenticated users.

## Business Value

- Customers can build orders across multiple sessions
- Reduced cart abandonment through persistence
- Foundation for checkout process

## User Stories

### US2.1: Add to Cart
**As a** customer
**I want to** add a product variant to my cart
**So that** I can purchase it later

**Acceptance Criteria:**
- [ ] "Add to Cart" button on product detail page
- [ ] Select variant before adding (required)
- [ ] Quantity selector (default 1)
- [ ] Visual confirmation when added (toast notification)
- [ ] Cart icon updates with item count
- [ ] Cannot add more than available stock

### US2.2: View Cart
**As a** customer
**I want to** view my cart contents
**So that** I can review before checkout

**Acceptance Criteria:**
- [ ] Cart page at `/cart`
- [ ] List of items with: image, product name, variant name, quantity, price
- [ ] Subtotal per line item
- [ ] Cart subtotal
- [ ] "Continue Shopping" link
- [ ] "Proceed to Checkout" button
- [ ] Empty cart state with CTA

### US2.3: Update Cart Quantity
**As a** customer
**I want to** change item quantities
**So that** I can adjust my order

**Acceptance Criteria:**
- [ ] Quantity +/- buttons or input field
- [ ] Maximum quantity = available stock
- [ ] Minimum quantity = 1 (use remove for 0)
- [ ] Real-time subtotal update
- [ ] Debounced API updates

### US2.4: Remove from Cart
**As a** customer
**I want to** remove items from my cart
**So that** I can change my mind

**Acceptance Criteria:**
- [ ] Remove button per line item
- [ ] Confirmation not required (can re-add)
- [ ] Cart updates immediately
- [ ] Empty cart state when last item removed

### US2.5: Cart Persistence
**As a** customer
**I want to** my cart to persist across sessions
**So that** I don't lose my selections

**Acceptance Criteria:**
- [ ] Guest cart stored with session ID (cookie)
- [ ] Authenticated user cart linked to account
- [ ] Cart merges on login (combine quantities)
- [ ] Cart expires after 30 days of inactivity

### US2.6: Cart Drawer (Slide-out)
**As a** customer
**I want to** quickly view my cart without leaving the page
**So that** I can continue shopping efficiently

**Acceptance Criteria:**
- [ ] Slide-out drawer on "Add to Cart"
- [ ] Shows recent addition + cart summary
- [ ] Quick checkout button
- [ ] "View Cart" link for full page
- [ ] Closable with X or click outside

### US2.7: Stock Validation
**As a** customer
**I want to** be notified if items become unavailable
**So that** I don't try to buy out-of-stock items

**Acceptance Criteria:**
- [ ] Validate stock on cart load
- [ ] Show warning for items with reduced stock
- [ ] Remove or disable items that are now sold out
- [ ] Re-validate before checkout

## Technical Approach

### State Management

```typescript
// Cart context for client-side state
interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
}

interface CartState {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  isLoading: boolean;
}
```

### API Routes

```
GET /api/cart
  Headers: Session cookie or auth token
  Response: { items: CartItem[], subtotal: number }

POST /api/cart/items
  Body: { variantId: number, quantity: number }
  Response: { cart: CartState }

PATCH /api/cart/items/[variantId]
  Body: { quantity: number }
  Response: { cart: CartState }

DELETE /api/cart/items/[variantId]
  Response: { cart: CartState }

POST /api/cart/validate
  Response: { valid: boolean, issues: StockIssue[] }
```

### Cart Storage Strategy

| User Type | Storage | Identifier |
|-----------|---------|------------|
| Guest | Database + Cookie | `cart_session_id` cookie |
| Authenticated | Database | `customer_id` |

### Session Cookie

```typescript
// middleware.ts or API route
const CART_SESSION_COOKIE = 'cart_session';
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days

function getOrCreateCartSession(req: Request): string {
  const existing = cookies().get(CART_SESSION_COOKIE);
  if (existing) return existing.value;

  const sessionId = crypto.randomUUID();
  cookies().set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
  });
  return sessionId;
}
```

### Components

```
components/
├── cart/
│   ├── cart-provider.tsx       # Context provider
│   ├── cart-drawer.tsx         # Slide-out drawer
│   ├── cart-page.tsx           # Full cart page
│   ├── cart-item.tsx           # Line item
│   ├── cart-summary.tsx        # Totals
│   ├── cart-icon.tsx           # Header icon with count
│   ├── quantity-selector.tsx   # +/- controls
│   └── empty-cart.tsx          # Empty state
```

### Database Operations

```typescript
// Get or create cart
async function getCart(sessionId: string, customerId?: number) {
  const cart = await db.query.carts.findFirst({
    where: customerId
      ? eq(carts.customerId, customerId)
      : eq(carts.sessionId, sessionId),
  });

  if (!cart) {
    const [newCart] = await db.insert(carts).values({
      sessionId: customerId ? null : sessionId,
      customerId,
      items: JSON.stringify([]),
    }).returning();
    return newCart;
  }

  return cart;
}

// Add item to cart
async function addToCart(cartId: number, variantId: number, quantity: number) {
  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
  });

  const items = JSON.parse(cart.items);
  const existingIndex = items.findIndex(i => i.variantId === variantId);

  if (existingIndex >= 0) {
    items[existingIndex].quantity += quantity;
  } else {
    // Fetch variant details
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
      with: { product: true },
    });

    items.push({
      variantId,
      productId: variant.productId,
      productName: variant.product.name,
      variantName: variant.name,
      price: variant.price,
      quantity,
    });
  }

  await db.update(carts)
    .set({ items: JSON.stringify(items), updatedAt: new Date().toISOString() })
    .where(eq(carts.id, cartId));
}
```

### Cart Merge on Login

```typescript
async function mergeCartsOnLogin(sessionId: string, customerId: number) {
  const guestCart = await getCartBySession(sessionId);
  const userCart = await getCartByCustomer(customerId);

  if (!guestCart?.items.length) return;

  if (!userCart) {
    // Transfer guest cart to user
    await db.update(carts)
      .set({ customerId, sessionId: null })
      .where(eq(carts.sessionId, sessionId));
  } else {
    // Merge items
    const merged = mergeCartItems(
      JSON.parse(userCart.items),
      JSON.parse(guestCart.items)
    );

    await db.update(carts)
      .set({ items: JSON.stringify(merged) })
      .where(eq(carts.id, userCart.id));

    // Delete guest cart
    await db.delete(carts).where(eq(carts.id, guestCart.id));
  }
}
```

## Testing Strategy

### Unit Tests
- Cart calculations (subtotal, item count)
- Cart merge logic
- Stock validation

### Integration Tests
- Add/update/remove API endpoints
- Session cookie handling
- Cart persistence

### E2E Tests
- Add to cart → view cart → update quantity → remove
- Cart persistence across page refreshes
- Cart drawer interaction
- Guest → login cart merge

## Performance Considerations

- Optimistic UI updates (update immediately, sync in background)
- Debounce quantity changes (500ms)
- Cache cart in memory/context, sync with server
- Lazy load cart drawer component

## Rollout Plan

1. **Dev**: Implement cart context and UI
2. **Preview**: Test with E1 product pages
3. **Staging**: Verify persistence and edge cases
4. **Production**: Enable alongside product catalog

## Open Questions

- [ ] Cart expiry: 30 days or different?
- [ ] Show shipping estimate in cart?
- [ ] Allow notes per item?

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Cart persists across browser sessions
- [ ] Stock validation prevents overselling
- [ ] Mobile responsive
- [ ] Performance: cart operations <200ms
- [ ] Code reviewed and merged
