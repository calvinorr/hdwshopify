# Herbarium Dyeworks - Project Implementation Plan

## Executive Summary

Self-hosted e-commerce platform replacing Shopify for Herbarium Dyeworks, a small-batch naturally dyed yarn business based in Northern Ireland.

## Project Philosophy

This is a proof-of-concept to validate self-hosting as a viable alternative to Shopify. The goal is a **fully operational store** that can be managed without developer intervention, not a pixel-perfect replica.

**Core principle**: Build what you need to *run* the business, not just *display* it.

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 16 (App Router) | SSR/SSG for SEO, React ecosystem |
| Database | Turso (SQLite edge) | Low latency, cost-effective |
| ORM | Drizzle | Type-safe, lightweight |
| Payments | Stripe Checkout | PCI compliance offloaded |
| Auth | Clerk (optional) | Admin access control |
| Images | Vercel Blob | Simple image hosting |
| Email | Resend | Transactional email |
| Hosting | Vercel | Seamless Next.js integration |

## Revised Epic Structure

### Phase 0: Stabilization (P0 - CRITICAL)

**Goal**: Production-ready reliability and safety

| Epic | Description | Status |
|------|-------------|--------|
| E12: Core Reliability | Transactional integrity, shipping accuracy, admin security | ✅ Done |
| E13: Operations & Resilience | Inventory reservation, exports, backups, notifications | ✅ Done |

> ⚠️ **These epics must be completed before launch.** Based on senior Shopify engineer review.
> See: `docs/archive/CODEBASE_REVIEW.md`, `docs/archive/STABILIZATION_ROADMAP.md`

### Phase 1: Operational Foundation (P0)

**Goal**: A store you can use and manage

| Epic | Description | Status |
|------|-------------|--------|
| E1: Product Catalog | Display products & collections | ✅ Done |
| E2: Shopping Cart | Add/remove items, persist cart | ✅ Done |
| E3: Checkout & Payments | Stripe integration | ✅ Done |
| E4: Shipping & Fulfillment | Rate calculation, fulfillment workflow | ✅ Done |
| E6: Admin Dashboard | Full store management | ✅ Done |
| E7: Sample Migration | Import ~10-20 products from Shopify | 🚧 Partial |

### Phase 2: Customer Experience (P1)

**Goal**: Feature parity for customers

| Epic | Description | Status |
|------|-------------|--------|
| E5: Customer Accounts | Login, order history | ✅ Done |
| E7: Full Migration | Import all products, customers, orders | ✅ Done |
| Email Notifications | Order confirmation, shipping updates | ✅ Done |

### Phase 3: Polish & Admin Excellence (P1)

**Goal**: Professional admin experience, UX improvements

| Epic | Description | Status |
|------|-------------|--------|
| E9: UX Improvements | Related products, quick-add, recently viewed | 🚧 In Progress |
| E14: Collection Management | Status, image upload, ordering, SEO, tags | 📋 TODO |

> **Note (Dec 2024):** Variant-heavy features (color swatches, quick-view modal) have been
> sidelined. Hand-dyed yarns are unique products - variants don't apply the same way.
> Focus shifted to professional collection management.

## Admin Dashboard Scope (E6 - Now P0)

The admin dashboard is now **core functionality**. You should be able to:

### Products
- [ ] Add new products with variants (colorways)
- [ ] Edit existing products
- [ ] Upload and manage product images
- [ ] Set prices, stock levels, weights
- [ ] Archive/activate products

### Collections (see E14 for enhanced features)
- [x] Create collections (by yarn weight, color family, etc.)
- [x] Assign products to collections
- [ ] Reorder collections (drag-drop) → E14
- [x] Set collection images and descriptions
- [ ] Collection status (draft/active/hidden) → E14
- [ ] Stock filtering per collection → E14
- [ ] Tag management → E14

### Homepage / Content
- [ ] Configure hero carousel images
- [ ] Select featured products
- [ ] Edit announcement bar text
- [ ] Update "About" page content (stretch)

### Orders
- [ ] View orders list with status
- [ ] View order details
- [ ] Mark as fulfilled, add tracking
- [ ] Print packing slips

### Shipping
- [ ] Configure shipping zones
- [ ] Set weight-based rates per zone
- [ ] Set free shipping thresholds

### Inventory
- [ ] View stock levels across all variants
- [ ] Quick stock adjustments
- [ ] Low stock alerts

### Discounts
- [ ] Create discount codes
- [ ] Set percentage or fixed discounts
- [ ] Set validity dates and usage limits

## Implementation Order

```
Current State (Product Catalog ✅)
     │
     ▼
E7: Sample Migration
Import 10-20 real products from Shopify
     │
     ▼
E6: Admin Dashboard ← FOCUS HERE FIRST
├── Products CRUD
├── Collections management
├── Homepage configuration
├── Shipping settings
├── Inventory view
└── Discount codes
     │
     ▼
🎯 Manageable Site
Validate you can run it
     │
     ▼
E2: Shopping Cart
     │
     ▼
E3: Checkout & Stripe
     │
     ▼
E4: Shipping Calculation
     │
     ▼
E6b: Order Management
(Add once orders exist)
     │
     ▼
🛒 Operational Store
```

## What This Is NOT

To keep scope manageable, we're **not** building:

- Multi-currency (GBP only for now)
- Gift cards
- Subscriptions
- Advanced analytics (use Plausible/Fathom)
- Customer reviews
- Wishlist
- Complex promotions (BOGO, bundles)
- Multi-user admin with roles

These can all be added later if needed.

## Success Criteria

**Minimum Viable Store:**
- [ ] Customers can browse, add to cart, checkout with Stripe
- [ ] Orders are recorded and visible in admin
- [ ] You can add/edit products without touching code
- [ ] You can manage collections and homepage
- [ ] Shipping rates calculate correctly by zone/weight
- [ ] You can fulfill orders and add tracking

## Environment Strategy

| Environment | Purpose | Database |
|-------------|---------|----------|
| Development | Local dev | Local SQLite |
| Preview | PR previews | Turso preview |
| Production | Live site | Turso production |

## Domain

Production: `herbarium-dyeworks.warmwetcircles.com`

(Can be changed to custom domain when ready for launch)
