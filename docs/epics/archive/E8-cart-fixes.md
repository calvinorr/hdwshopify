# E8: Cart Fixes & Toast Notifications ✅ COMPLETED

> **Status**: COMPLETED (Archived)
> **Completed**: December 2024

**Priority**: P0 (Critical - Blocking Conversion)
**Complexity**: Medium
**Dependencies**: E1 (Product Catalog), E2 (Shopping Cart specs)

## Overview

Implement the shopping cart functionality outlined in E2, plus add-to-cart toast notifications. This epic focuses on the critical path to enable conversions: API routes, state management, cart UI, and user feedback.

## Business Value

- Customers cannot purchase without a working cart
- Toast notifications provide essential feedback, reducing confusion
- Cart persistence reduces abandonment
- Foundation for checkout (E3)

## User Stories

### US8.1: Cart API Routes
**As a** developer
**I want to** implement server-side cart endpoints
**So that** cart state persists and syncs across sessions

**Acceptance Criteria:**
- [ ] `GET /api/cart` - Fetch current cart with populated product details
- [ ] `POST /api/cart` - Add item (variantId, quantity)
- [ ] `PATCH /api/cart/[itemId]` - Update quantity
- [ ] `DELETE /api/cart/[itemId]` - Remove item
- [ ] Session cookie (`cart_session`) created for guest users
- [ ] Stock validated before adding items
- [ ] Returns `{ items, subtotal, itemCount }`
- [ ] Handles cart merge on authentication (guest -> user)

---

### US8.2: Cart Context Provider
**As a** customer
**I want to** my cart state to persist across page navigation
**So that** I don't lose my selections while browsing

**Acceptance Criteria:**
- [ ] React Context provides cart state globally
- [ ] `addItem(variantId, quantity)` with optimistic UI update
- [ ] `updateQuantity(itemId, quantity)` with optimistic update
- [ ] `removeItem(itemId)` with optimistic update
- [ ] `cartCount` for header badge
- [ ] `cartSubtotal` calculated total
- [ ] Syncs with server via API calls
- [ ] Loads cart on initial mount
- [ ] Handles loading and error states

---

### US8.3: Full Cart Page UI
**As a** customer
**I want to** view and manage my cart contents
**So that** I can review and adjust before checkout

**Acceptance Criteria:**
- [ ] Cart items display: image, product name, variant, unit price, line total
- [ ] Quantity selector with +/- buttons per item
- [ ] Remove button per item
- [ ] Cart summary sidebar with subtotal
- [ ] Shipping estimate or "Calculated at checkout"
- [ ] "Proceed to Checkout" button
- [ ] "Continue Shopping" link
- [ ] Empty cart state with CTA to browse products
- [ ] Mobile responsive layout
- [ ] Loading skeleton while fetching

---

### US8.4: Header Cart Integration
**As a** customer
**I want to** see my cart item count in the header
**So that** I know how many items I've added

**Acceptance Criteria:**
- [ ] Cart icon shows item count badge
- [ ] Badge hidden when cart is empty
- [ ] Badge updates in real-time on add/remove
- [ ] Clicking icon navigates to `/cart`

---

### US8.5: Cart Drawer (Enhancement)
**As a** customer
**I want to** quickly preview my cart without leaving the page
**So that** I can continue shopping efficiently

**Acceptance Criteria:**
- [ ] Sheet/drawer slides in from right
- [ ] Shows mini list of cart items
- [ ] Quick quantity adjustment
- [ ] "View Cart" and "Checkout" buttons
- [ ] Closes on outside click or X button
- [ ] Opens on add-to-cart (optional behavior)

---

### US8.6: Success Toast on Add to Cart
**As a** customer
**I want to** see confirmation when I add an item to my cart
**So that** I know the action was successful

**Acceptance Criteria:**
- [ ] Toast appears on successful add-to-cart
- [ ] Shows product name and variant added
- [ ] Includes "View Cart" action button
- [ ] Auto-dismisses after 4 seconds
- [ ] Stacks if multiple items added quickly
- [ ] Uses Sonner toast library

---

### US8.7: Error Toast on Failure
**As a** customer
**I want to** see clear error messages when something goes wrong
**So that** I understand what happened and can take action

**Acceptance Criteria:**
- [ ] Toast shows on stock validation failure
- [ ] Toast shows on network error
- [ ] Clear, helpful message (e.g., "Only 2 left in stock")
- [ ] Error styling (destructive/red variant)
- [ ] Retry suggestion for network errors

---

## Technical Approach

### Files to Create

```
app/
├── api/
│   └── cart/
│       ├── route.ts              # GET, POST
│       └── [itemId]/
│           └── route.ts          # PATCH, DELETE
components/
├── cart/
│   ├── cart-item.tsx             # Line item component
│   ├── cart-summary.tsx          # Totals sidebar
│   └── cart-drawer.tsx           # Slide-out drawer
contexts/
└── cart-context.tsx              # Cart state provider
lib/
└── cart.ts                       # Cart utilities
```

### Files to Modify

```
app/cart/page.tsx                 # Full cart page (currently skeleton)
components/providers.tsx          # Wrap with CartProvider
components/shop/header.tsx        # Add cart count badge
app/products/[slug]/product-client.tsx  # Trigger toasts
```

### Cart Context Interface

```typescript
interface CartItem {
  id: string;  // Unique cart item ID
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  variantName: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  error: string | null;
  addItem: (variantId: number, quantity: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}
```

### API Response Format

```typescript
// GET /api/cart
interface CartResponse {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

// POST /api/cart
interface AddToCartRequest {
  variantId: number;
  quantity: number;
}

// PATCH /api/cart/[itemId]
interface UpdateCartRequest {
  quantity: number;
}
```

### Session Management

```typescript
// lib/cart.ts
const CART_SESSION_COOKIE = 'cart_session';
const SESSION_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

export function getOrCreateCartSession(): string {
  const cookieStore = cookies();
  const existing = cookieStore.get(CART_SESSION_COOKIE);

  if (existing) return existing.value;

  const sessionId = crypto.randomUUID();
  cookieStore.set(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
  });

  return sessionId;
}
```

### Toast Implementation

```typescript
// In cart-context.tsx or product-client.tsx
import { toast } from 'sonner';

// Success toast
toast.success('Added to cart', {
  description: `${productName} - ${variantName}`,
  action: {
    label: 'View Cart',
    onClick: () => router.push('/cart'),
  },
});

// Error toast
toast.error('Could not add to cart', {
  description: 'Only 2 items left in stock',
});
```

## Testing Strategy

### Unit Tests
- Cart calculations (subtotal, item count)
- Stock validation logic
- Session cookie handling

### Integration Tests
- API endpoint CRUD operations
- Cart persistence across requests
- Cart merge on authentication

### E2E Tests
- Add item -> view cart -> update quantity -> remove
- Toast notifications appear correctly
- Cart persists across page refreshes
- Empty cart state displays properly

## Performance Considerations

- Optimistic UI updates (instant feedback, sync in background)
- Debounce quantity changes (500ms delay before API call)
- Cache cart in React state, sync with server periodically
- Lazy load cart drawer component

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Cart persists across browser sessions
- [ ] Stock validation prevents overselling
- [ ] Toast notifications provide clear feedback
- [ ] Mobile responsive
- [ ] Performance: cart operations < 200ms perceived latency
- [ ] Code reviewed and merged
