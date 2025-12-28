# Herbarium Dyeworks - Project Plan

## Executive Summary

Self-hosted e-commerce platform replacing Shopify for Herbarium Dyeworks, a small-batch naturally dyed yarn business based in Northern Ireland.

**Status**: Core platform complete. Ready for production configuration and launch.

## Project Philosophy

This is a proof-of-concept to validate self-hosting as a viable alternative to Shopify. The goal is a **fully operational store** that can be managed without developer intervention, not a pixel-perfect replica.

**Core principle**: Build what you need to *run* the business, not just *display* it.

---

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

---

## Completion Status

### Phase 0: Stabilization ✅ COMPLETE

| Epic | Description | Status |
|------|-------------|--------|
| E12: Core Reliability | Transactional integrity, shipping accuracy, admin security | ✅ Done |
| E13: Operations & Resilience | Inventory reservation, exports, backups, notifications | ✅ Done |

### Phase 1: Operational Foundation ✅ COMPLETE

| Epic | Description | Status |
|------|-------------|--------|
| E1: Product Catalog | Display products & collections | ✅ Done |
| E2: Shopping Cart | Add/remove items, persist cart | ✅ Done |
| E3: Checkout & Payments | Stripe integration | ✅ Done |
| E4: Shipping & Fulfillment | Rate calculation, fulfillment workflow | ✅ Done |
| E6: Admin Dashboard | Full store management | ✅ Done |
| E7: Data Migration | Import from Shopify | ✅ Done |

### Phase 2: Customer Experience ✅ COMPLETE

| Epic | Description | Status |
|------|-------------|--------|
| E5: Customer Accounts | Login, order history | ✅ Done |
| Email Notifications | Order confirmation, shipping updates | ✅ Done |

### Phase 3: Polish & Admin Excellence ✅ COMPLETE

| Epic | Description | Status |
|------|-------------|--------|
| E9: UX Improvements | Related products, quick-add, recently viewed | ✅ Done |
| E14: Collection Management | Status, image upload, ordering, SEO, tags | ✅ Done |

---

## What's Next

### Immediate: Launch Preparation
See **[LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md)** for:
- Stripe production configuration
- Resend domain verification
- Final testing checklist
- Go-live steps

### Post-Launch: Optional Enhancements
See **[epics/BACKLOG.md](./epics/BACKLOG.md)** for:
- Product reviews & ratings
- Wishlist functionality
- Search autocomplete
- Cloudflare migration (~$250/yr savings)

---

## Directory Structure

```
docs/
├── PROJECT_PLAN.md          # This file - project overview
├── LAUNCH_CHECKLIST.md      # Pre-launch tasks
├── epics/
│   ├── archive/             # Completed epics (E3-E7, E9, E12-E14)
│   ├── E1-product-catalog.md    # Minor remaining (accessibility)
│   ├── E6-admin-dashboard.md    # Minor remaining (bulk actions)
│   ├── E8-cloudflare-migration.md  # Post-launch optimization
│   └── BACKLOG.md           # Future enhancements
└── archive/
    ├── CODEBASE_REVIEW.md   # Senior engineer review
    └── STABILIZATION_ROADMAP.md
```

---

## Success Criteria ✅

**Minimum Viable Store** - All complete:
- [x] Customers can browse, add to cart, checkout with Stripe
- [x] Orders are recorded and visible in admin
- [x] Admin can add/edit products without touching code
- [x] Admin can manage collections and homepage
- [x] Shipping rates calculate correctly by zone/weight
- [x] Admin can fulfill orders and add tracking

---

## What This Is NOT

To keep scope manageable, we're **not** building:
- Multi-currency (GBP only)
- Gift cards
- Subscriptions
- Advanced analytics (use Plausible/Fathom)
- Customer reviews (backlog)
- Wishlist (backlog)
- Complex promotions (BOGO, bundles)
- Multi-user admin with roles

---

## Environment Strategy

| Environment | Purpose | Database |
|-------------|---------|----------|
| Development | Local dev | Turso (dev branch) |
| Preview | PR previews | Turso (preview) |
| Production | Live site | Turso (production) |

## Domain

- **Current**: `herbarium-dyeworks.warmwetcircles.com`
- **Future**: Custom domain when ready for public launch
