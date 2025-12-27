# Stabilization Roadmap (2–4 Weeks)

Goal: harden the core commerce loop for reliability and profit protection without expanding scope.

## Week 1: Transactional integrity + checkout safety
**Outcome:** Orders cannot be partially created, and overselling is materially reduced.

1. **Wrap order creation in a DB transaction**
   - Scope: `app/api/webhooks/stripe/route.ts`
   - Actions:
     - Create order, order items, inventory decrement, discount usage, and cart deletion inside a single transaction.
     - Ensure idempotency check (existing order) happens outside or at the top of the transaction.
   - Acceptance:
     - A webhook failure never leaves orphaned order items or inventory changes.

2. **Revalidate stock and discounts during webhook processing**
   - Scope: `app/api/webhooks/stripe/route.ts`, `app/api/checkout/session/route.ts`
   - Actions:
     - On webhook, confirm each variant stock can cover quantity; if not, mark order as `pending` or `on-hold` and log.
     - Recheck discount validity and usage limits before incrementing usage.
   - Acceptance:
     - Stock/discount mismatch is detected and surfaced rather than silently applied.

3. **Fix timestamp defaults to avoid literal strings**
   - Scope: `lib/db/schema.ts`
   - Actions:
     - Ensure defaults use SQL `CURRENT_TIMESTAMP` rather than string literal.
     - Validate in migration or create a one-time migration to backfill incorrect timestamps.
   - Acceptance:
     - New records have correct timestamps; existing records corrected or left with known limitations.

4. **Add minimal order-status audit logging**
   - Scope: `lib/db/schema.ts`, `app/api/webhooks/stripe/route.ts`
   - Actions:
     - Create a small `order_events` table or append a JSON log in `orders.internalNotes`.
     - Log key transitions: created, paid, stock-updated, email-sent.
   - Acceptance:
     - You can reconstruct why an order changed state.

---

## Week 2: Shipping correctness + admin safety
**Outcome:** Customers see valid shipping options and admin isn’t accidentally exposed.

1. **Apply shipping rates by destination country**
   - Scope: `app/api/checkout/session/route.ts`, `shipping_zones` data
   - Actions:
     - Match shipping options to the customer’s country when generating Stripe options.
     - If no match, return a clear error before redirecting to Stripe.
   - Acceptance:
     - A customer in the US never sees UK-only rates.

2. **Harden admin access**
   - Scope: `middleware.ts`, `lib/auth/admin.ts`
   - Actions:
     - Require `ADMIN_USER_IDS` in production; fail closed if missing.
     - Add a loud log warning on boot if missing.
   - Acceptance:
     - Production deploy without admin allowlist cannot access admin.

3. **Reduce N+1 queries in cart and checkout**
   - Scope: `app/api/cart/route.ts`, `app/api/checkout/session/route.ts`
   - Actions:
     - Batch-load variants and images with a single query per request.
   - Acceptance:
     - Cart/checkout API performs a fixed number of queries regardless of item count.

---

## Week 3: Inventory reservation + operational UX
**Outcome:** Lower oversell risk and smoother daily ops.

1. **Inventory reservation on checkout session creation**
   - Scope: `app/api/checkout/session/route.ts`, webhook handling
   - Actions:
     - Create a `reserved_stock` table keyed by session.
     - Decrement reservations on `checkout.session.expired` webhook.
     - Convert reservation to actual decrement on payment success.
   - Acceptance:
     - Simultaneous checkouts for scarce stock are controlled.

2. **Basic operational tooling**
   - Scope: admin pages
   - Actions:
     - Add CSV export for orders and customers.
     - Add bulk stock adjustment in admin inventory page.
   - Acceptance:
     - Owner can reconcile inventory or do exports without manual DB work.

---

## Week 4: Customer comms + resilience
**Outcome:** Customers get predictable updates; ops can recover faster.

1. **Shipment confirmation wiring**
   - Scope: `lib/email/shipping-confirmation.tsx`, order update flow
   - Actions:
     - Send shipping email when tracking is added or status becomes shipped.
   - Acceptance:
     - Tracking updates trigger a customer email.

2. **Backups and data export**
   - Scope: ops scripts or scheduled jobs
   - Actions:
     - Add a scheduled DB backup job or manual command.
     - Add “export all data” script for compliance.
   - Acceptance:
     - You can restore from backup and provide customer/order exports.

---

## Optional fast wins (can be pulled into any week)
- Add a basic analytics panel: AOV, conversion rate, top SKUs.
- Move `local.db` into `.gitignore` if it isn’t required in repo.
- Add a “maintenance mode” toggle via `site_settings`.

---

## Delivery checkpoints
- **End of Week 1:** Orders are transaction-safe and no partial data exists.
- **End of Week 2:** Shipping options are accurate and admin is locked down.
- **End of Week 3:** Oversell risk reduced and day‑to‑day ops faster.
- **End of Week 4:** Customers get full communication and data is safer.
