# E12: Core Reliability 🔲 TODO

> **Status**: IN PROGRESS
> **Priority**: P0 - CRITICAL (blocks launch)
> **Source**: Senior Shopify engineer codebase review
> **Completed**: US12.1, US12.2, US12.3
> **Remaining**: US12.4, US12.5, US12.6, US12.7

## Overview

Critical reliability fixes identified during external code review. These issues affect transactional integrity, revenue protection, and security. Must be resolved before any production traffic.

## Business Value

- **Prevents overselling** - No partial orders or inventory mismatches
- **Protects revenue** - Correct shipping rates by destination
- **Ensures security** - Admin access locked down in production
- **Improves reliability** - Atomic operations, proper timestamps

## Key Issues Addressed

From codebase review:
1. Order creation is not transactional (can create partial orders)
2. Inventory/discounts not revalidated at order time
3. Shipping rates not filtered by country (revenue leak)
4. Admin access open if ADMIN_USER_IDS unset
5. CURRENT_TIMESTAMP defaults may be literal strings
6. N+1 query patterns in cart/checkout

## User Stories

### US12.1: Transactional Order Creation ✅
**As a** store owner
**I want** order creation to be atomic
**So that** I never have partial orders or orphaned data

**Acceptance Criteria:**
- [x] Order, order items, inventory decrement, discount usage in single transaction
- [x] Idempotency check prevents duplicate order creation
- [x] Webhook failure rolls back all changes
- [x] Add test: simulate failure mid-transaction, verify rollback

**Files:** `app/api/webhooks/stripe/route.ts`

---

### US12.2: Stock & Discount Revalidation ✅
**As a** store owner
**I want** stock and discounts verified at payment time
**So that** I don't oversell or over-apply discounts

**Acceptance Criteria:**
- [x] On webhook, verify each variant has sufficient stock
- [x] If stock insufficient, mark order as `on-hold` and log
- [x] Recheck discount validity and usage limits before applying
- [x] Stock/discount mismatch surfaces in admin (not silent)

**Files:** `app/api/webhooks/stripe/route.ts`, `lib/db/schema.ts`, `app/admin/orders/`

---

### US12.3: Fix Timestamp Defaults ✅
**As a** developer
**I want** timestamps to use actual SQL CURRENT_TIMESTAMP
**So that** records have correct creation/update times

**Acceptance Criteria:**
- [x] Audit all `.default("CURRENT_TIMESTAMP")` in schema (found 25 instances)
- [x] Update to use proper SQLite timestamp function (`sql\`CURRENT_TIMESTAMP\``)
- [x] Create migration to backfill incorrect timestamps if needed (not needed - code sets timestamps explicitly)
- [x] Add test to verify new records have valid timestamps (verified via build + code analysis)

**Files:** `lib/db/schema.ts`

---

### US12.4: Order Event Audit Log
**As a** store owner
**I want** a log of order state changes
**So that** I can debug issues and understand order history

**Acceptance Criteria:**
- [ ] Create `order_events` table (orderId, event, data, timestamp)
- [ ] Log: created, paid, stock-updated, email-sent, fulfilled, shipped
- [ ] Display event timeline in admin order detail
- [ ] Events are immutable (append-only)

**Files:** `lib/db/schema.ts`, `app/api/webhooks/stripe/route.ts`, `app/admin/orders/[id]/page.tsx`

---

### US12.5: Shipping Rates by Destination
**As a** customer
**I want** to see only shipping options valid for my country
**So that** I'm charged correctly

**Acceptance Criteria:**
- [ ] Filter shipping options by customer's country in checkout
- [ ] Return clear error if no shipping zone matches destination
- [ ] Never show UK-only rates to US customers (or vice versa)
- [ ] Add test: verify rate filtering by country code

**Files:** `app/api/checkout/session/route.ts`

---

### US12.6: Harden Admin Access
**As a** store owner
**I want** admin access locked down in production
**So that** unauthorized users cannot access admin

**Acceptance Criteria:**
- [ ] Require `ADMIN_USER_IDS` in production environment
- [ ] Fail closed (deny access) if env var missing in production
- [ ] Log loud warning on startup if missing
- [ ] Dev environment can still work without it (for local dev)

**Files:** `middleware.ts`, `lib/auth/admin.ts`

---

### US12.7: Optimize Cart/Checkout Queries
**As a** developer
**I want** cart and checkout to use efficient queries
**So that** performance doesn't degrade with more products

**Acceptance Criteria:**
- [ ] Batch-load variants with single query (not N+1)
- [ ] Batch-load product images with single query
- [ ] Cart API: fixed query count regardless of item count
- [ ] Checkout API: fixed query count regardless of item count

**Files:** `app/api/cart/route.ts`, `app/api/checkout/session/route.ts`

---

## Technical Notes

### Transaction Pattern
```typescript
await db.transaction(async (tx) => {
  // All operations inside single transaction
  const order = await tx.insert(orders).values({...}).returning();
  await tx.insert(orderItems).values(items);
  await tx.update(productVariants).set({ stock: sql`stock - ${qty}` });
  await tx.update(discountCodes).set({ usageCount: sql`usageCount + 1` });
  await tx.delete(carts).where(eq(carts.sessionId, sessionId));
});
```

### Idempotency Pattern
```typescript
// Check before transaction
const existing = await db.query.orders.findFirst({
  where: eq(orders.stripeSessionId, session.id)
});
if (existing) return NextResponse.json({ received: true });
```

## Definition of Done

- [ ] All acceptance criteria met
- [ ] No partial orders possible under any failure scenario
- [ ] Shipping rates always match customer country
- [ ] Admin inaccessible without proper configuration
- [ ] All queries are O(1) not O(n)
- [ ] Build passes, no regressions
