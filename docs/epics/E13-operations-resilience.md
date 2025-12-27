# E13: Operations & Resilience 🚧 IN PROGRESS

> **Status**: IN PROGRESS
> **Priority**: P0 - HIGH (required for launch)
> **Source**: Senior Shopify engineer stabilization roadmap
> **Completed**: US13.1
> **Remaining**: US13.2 - US13.7

## Overview

Operational improvements and resilience features to reduce oversell risk, improve daily operations, and ensure business continuity. These complement E12 (Core Reliability) and complete the stabilization work.

## Business Value

- **Prevents overselling** - Inventory reservation during checkout
- **Saves time** - Bulk operations and CSV exports
- **Customer trust** - Automated shipping notifications
- **Business continuity** - Backups and data portability

## User Stories

### US13.1: Inventory Reservation System ✅
**As a** store owner
**I want** stock reserved during checkout
**So that** simultaneous purchases don't oversell

**Acceptance Criteria:**
- [x] Create `stock_reservations` table (variantId, quantity, sessionId, expiresAt)
- [x] Reserve stock when checkout session created
- [x] Release reservation on `checkout.session.expired` webhook
- [x] Convert reservation to actual decrement on payment success
- [x] Reservation expires after 30 minutes if no webhook received
- [x] Show "Only X left" warning when stock is low/reserved

**Files:** `lib/db/schema.ts`, `app/api/checkout/session/route.ts`, `app/api/webhooks/stripe/route.ts`, `lib/db/stock.ts`, `app/api/cron/cleanup-reservations/route.ts`

---

### US13.2: CSV Export - Orders
**As a** store owner
**I want** to export orders as CSV
**So that** I can do accounting and analysis in spreadsheets

**Acceptance Criteria:**
- [ ] Export button on admin orders page
- [ ] CSV includes: order number, date, customer, email, items, total, status, tracking
- [ ] Date range filter for export
- [ ] Download triggers immediately (no background job needed at this scale)

**Files:** `app/admin/orders/page.tsx`, `app/api/admin/orders/export/route.ts`

---

### US13.3: CSV Export - Customers
**As a** store owner
**I want** to export customers as CSV
**So that** I can do marketing and GDPR compliance

**Acceptance Criteria:**
- [ ] Export button on admin customers page
- [ ] CSV includes: name, email, order count, total spent, created date
- [ ] Respects marketing consent (flag in export)
- [ ] GDPR-ready: can export single customer's data on request

**Files:** `app/admin/customers/page.tsx`, `app/api/admin/customers/export/route.ts`

---

### US13.4: Bulk Stock Adjustment
**As a** store owner
**I want** to adjust stock for multiple variants at once
**So that** inventory reconciliation is fast

**Acceptance Criteria:**
- [ ] Multi-select variants in inventory page
- [ ] Bulk action: "Adjust stock" with increment/decrement/set options
- [ ] Confirmation dialog showing affected variants
- [ ] Log stock changes in audit trail

**Files:** `app/admin/inventory/page.tsx`, `app/api/admin/inventory/bulk/route.ts`

---

### US13.5: Shipping Confirmation Email
**As a** customer
**I want** an email when my order ships
**So that** I can track my delivery

**Acceptance Criteria:**
- [ ] Email sent automatically when tracking number added
- [ ] Email includes: order number, tracking number, carrier link, items
- [ ] Only sends once per order (idempotent)
- [ ] Uses existing email template system (`lib/email/shipping-confirmation.tsx`)

**Files:** `lib/email/send-shipping-confirmation.ts`, `app/api/admin/orders/[id]/fulfill/route.ts`

---

### US13.6: Database Backups
**As a** store owner
**I want** regular database backups
**So that** I can recover from disasters

**Acceptance Criteria:**
- [ ] Manual backup command: `npm run db:backup`
- [ ] Backup saved to local file with timestamp
- [ ] Document restore process in README
- [ ] Turso automatic backups documented (if available on plan)

**Files:** `scripts/backup-db.ts`, `package.json`

---

### US13.7: Full Data Export
**As a** store owner
**I want** to export all my data
**So that** I have portability and GDPR compliance

**Acceptance Criteria:**
- [ ] Export command: `npm run data:export`
- [ ] Exports: products, variants, customers, orders, settings as JSON
- [ ] Output is human-readable and can be re-imported
- [ ] Document in README for compliance requests

**Files:** `scripts/export-all-data.ts`, `package.json`

---

## Optional Fast Wins

These can be pulled into any sprint if time allows:

### US13.8: Basic Analytics Dashboard (Optional)
**As a** store owner
**I want** basic sales analytics
**So that** I understand my business performance

**Acceptance Criteria:**
- [ ] Dashboard shows: total revenue, order count, AOV
- [ ] Top selling products (by quantity and revenue)
- [ ] Date range selector (7d, 30d, 90d, all time)
- [ ] Simple charts using lightweight library

**Files:** `app/admin/analytics/page.tsx`

---

### US13.9: Maintenance Mode (Optional)
**As a** store owner
**I want** to put the store in maintenance mode
**So that** I can do updates without customers seeing errors

**Acceptance Criteria:**
- [ ] Toggle in site settings
- [ ] Shows friendly "back soon" page to customers
- [ ] Admin still accessible
- [ ] Optional: scheduled maintenance windows

**Files:** `middleware.ts`, `app/maintenance/page.tsx`

---

## Technical Notes

### Stock Reservation Schema
```typescript
export const stockReservations = sqliteTable("stock_reservations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  variantId: integer("variant_id").notNull().references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  stripeSessionId: text("stripe_session_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### Reservation Flow
1. POST /api/checkout/session → create reservation → return Stripe URL
2. Stripe `checkout.session.completed` → convert reservation to decrement
3. Stripe `checkout.session.expired` → delete reservation (stock freed)
4. Cron/cleanup job → delete expired reservations (backup)

## Definition of Done

- [ ] All core acceptance criteria met (US13.1-US13.7)
- [ ] Oversell risk significantly reduced via reservations
- [ ] Owner can export data without developer help
- [ ] Shipping notifications automated
- [ ] Backup/restore process documented and tested
- [ ] Build passes, no regressions
