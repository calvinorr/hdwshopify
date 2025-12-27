# Herbarium Dyeworks Codebase Review

This review is written as if I were advising a founder building a lean Shopify-like stack for a single, small brand. I focused on reliability, cost, and operational practicality rather than enterprise scale. I did not change any code.

## Snapshot of the current stack
- **Framework:** Next.js App Router with server components and API routes.
- **Auth:** Clerk (`lib/auth.ts`, `lib/auth/admin.ts`, `middleware.ts`).
- **DB:** SQLite/libSQL + Drizzle ORM (`lib/db/index.ts`, `lib/db/schema.ts`).
- **Payments:** Stripe Checkout + Webhooks (`app/api/checkout/session/route.ts`, `app/api/webhooks/stripe/route.ts`).
- **Email:** Resend (`lib/email.ts`, `lib/email/send-order-confirmation.ts`).
- **Admin UI:** Custom pages + Radix UI components (`components`, `app/admin/...`).
- **Tests:** Vitest with API/admin/storefront suites (`tests/...`).

---

## What’s working well
1. **Clear separation of concerns.** The code splits admin, storefront, and API routes cleanly (`app/admin/...`, `app/api/...`, `components/...`). This keeps the surface area understandable and small.
2. **Schema-first thinking.** The Drizzle schema is comprehensive and models core commerce concepts (products, variants, orders, discounts, shipping, tags) in a way that mirrors real Shopify patterns (`lib/db/schema.ts`).
3. **Admin APIs are guarded and validated.** Request validation with Zod and the `requireAdmin` guard is a good foundation for safety and stability (`app/api/admin/...`, `lib/validations/...`, `lib/auth/admin.ts`).
4. **Stripe integration uses webhooks (not just client success).** You’re correctly creating orders on `checkout.session.completed`, not on the client redirect (`app/api/webhooks/stripe/route.ts`). That’s the right pattern.
5. **Thoughtful operational details.** You’re logging structured errors (`lib/logger.ts`), handling email configuration safely (`lib/email.ts`), and keeping migrations / Shopify import paths optional (`lib/shopify/*`, `scripts/migrate-shopify.ts`).
6. **Tests exist and are grouped by surface area.** You already have tests for API/admin/storefront, which is more than many early-stage builds (`tests/...`).

---

## Areas for improvement (highest impact first)
1. **Order creation is not transactional.** In `app/api/webhooks/stripe/route.ts`, order creation, order items insertion, and stock decrement are separate calls without a transaction. Under concurrency, you can oversell or end up with a partial order. For any checkout flow, this is the #1 reliability risk.
2. **Inventory and discount usage aren’t revalidated at order time.** The Stripe session is created earlier, but stock and discount usage should be rechecked when the webhook fires (and possibly adjusted/failed gracefully). Right now the webhook trusts the cart snapshot and increments discount usage without rechecking limits.
3. **Shipping rates are not restricted by country.** `getShippingOptions` uses shipping zones but returns all rates irrespective of destination (`app/api/checkout/session/route.ts`). Stripe will show every option to every customer, which can create undercharging or compliance problems. This is a silent revenue leak.
4. **Admin access is open if `ADMIN_USER_IDS` is unset.** Both middleware and API guard allow admin access if no allowlist is configured (`middleware.ts`, `lib/auth/admin.ts`). That is safe in local dev but risky if someone deploys without setting it.
5. **`CURRENT_TIMESTAMP` defaults are likely literal strings.** In `lib/db/schema.ts` you use `.default("CURRENT_TIMESTAMP")`. In SQLite this typically stores the literal string rather than the actual timestamp unless the DDL uses `DEFAULT CURRENT_TIMESTAMP`. If so, the timestamps will be wrong without any obvious failure. This is easy to miss.
6. **N+1 query patterns in cart/checkout.** Cart population and checkout build line items by querying variants one-by-one (`app/api/cart/route.ts`, `app/api/checkout/session/route.ts`). This is fine at low scale, but it will get expensive as SKU counts grow.
7. **Environment-variable failures crash at import time.** `lib/stripe.ts` throws if `STRIPE_SECRET_KEY` is missing. This can cause builds/tests to fail even for pages that don’t use Stripe. Consider lazy initialization or clearer dev fallbacks.
8. **JSON blobs for carts and addresses limit reporting.** Storing cart items and addresses as JSON (`carts.items`, `orders.shippingAddress`) is pragmatic, but it makes analytics, GDPR export, and returns workflows harder later. You’ll want to normalize these fields as soon as reporting becomes important.

---

## Likely unnecessary or temporary pieces
1. **Shopify migration code should be isolated or removed post-migration.** `lib/shopify/*` and `scripts/migrate-shopify.ts` are useful during migration but add maintenance risk long-term. If migration is complete, quarantine in a separate repo or move into a clearly named “one-off” folder.
2. **Local database file committed to repo.** `local.db` in the root is convenient but risky (sensitive data, merge conflicts, repo bloat). Consider moving it to `.gitignore` if it’s not meant for production.
3. **Plan docs duplicated in multiple places.** There are multiple plan/epic files at root and in `docs/`. That’s okay early on, but once execution starts it becomes noise and divergence risk.

---

## Recommended future development (lean, high ROI)
1. **Reliable order state machine.** Introduce explicit lifecycle transitions (pending → paid → fulfilled → shipped → delivered) with idempotent transitions and audit logging. This is the backbone of Shopify reliability.
2. **Inventory reservation.** Add a short-lived reservation at checkout session creation to prevent overselling, then release on session expiry (you already receive `checkout.session.expired`).
3. **Shipping rate policy + dimensional weight.** Introduce a strategy for rate calculation that accounts for destination country, weight tiers, and optional tracked upgrades. Right now this is the easiest path to negative margin.
4. **Operational tooling for the owner.** Add bulk update tools (price, stock, tagging), export CSVs, and low-friction order notes. These are “owner hours” multipliers.
5. **Basic analytics.** Even a lightweight dashboard for conversion rate, AOV, and top SKUs will reduce dependency on Shopify Analytics.
6. **Customer communications.** You already send order confirmations. Add “shipment confirmation” and “delivery follow-up” emails when order status changes (`lib/email/shipping-confirmation.tsx` exists, but it isn’t wired into a state machine).
7. **Data portability and backups.** Provide simple export of customers/orders/products and scheduled backups. For a small business, this is non‑negotiable safety.

---

## Overall verdict
You’ve already captured the hard parts: product/variant modeling, order creation via webhooks, and an admin surface. This is far more complete than a typical “clone” project, and it’s moving in the right direction for a low-overhead business. The biggest gaps are around **transactional integrity**, **inventory protection**, and **shipping accuracy** — all of which are fixable without a huge architectural shift. If you tackle those first, you’ll have something genuinely viable for a lean, independent commerce stack.

If you want, I can follow up with a prioritized stabilization roadmap (2–4 weeks) or a more detailed security/performance audit.
