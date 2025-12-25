# Herbarium Dyeworks - Project Implementation Plan

## Executive Summary

Self-hosted e-commerce platform replacing Shopify for Herbarium Dyeworks, a small-batch naturally dyed yarn business based in Northern Ireland.

## Business Context

- **Current State**: Shopify store with established product catalog and customer base
- **Target State**: Fully self-hosted solution with lower operational costs and greater customization
- **Critical Success Factors**: Zero downtime migration, maintained SEO rankings, seamless customer experience

## Technical Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 16 (App Router) | SSR/SSG for SEO, React ecosystem |
| Database | Turso (SQLite edge) | Low latency, cost-effective, sufficient for volume |
| ORM | Drizzle | Type-safe, lightweight, excellent DX |
| Payments | Stripe Checkout | PCI compliance offloaded, strong UK/EU support |
| Auth | Clerk (optional) | Graceful degradation, handles edge cases |
| Email | Resend | Transactional email, good deliverability |
| Hosting | Vercel | Seamless Next.js integration, edge network |

## Epic Overview

| Epic | Priority | Complexity | Dependencies |
|------|----------|------------|--------------|
| [E1: Product Catalog](./epics/E1-product-catalog.md) | P0 | Medium | Database schema (done) |
| [E2: Shopping Cart](./epics/E2-shopping-cart.md) | P0 | Medium | E1 |
| [E3: Checkout & Payments](./epics/E3-checkout-payments.md) | P0 | High | E2, Stripe account |
| [E4: Shipping & Fulfillment](./epics/E4-shipping-fulfillment.md) | P0 | Medium | E3 |
| [E5: Customer Accounts](./epics/E5-customer-accounts.md) | P1 | Medium | E3 |
| [E6: Admin Dashboard](./epics/E6-admin-dashboard.md) | P1 | High | E1-E4 |
| [E7: Data Migration](./epics/E7-data-migration.md) | P0 | Medium | E1, Shopify export |

## Implementation Phases

### Phase 1: Core Commerce (P0)
**Goal**: Minimum viable store that can accept orders

1. E1: Product Catalog - Display products and collections
2. E2: Shopping Cart - Add/remove items, persist cart
3. E3: Checkout & Payments - Stripe integration, order creation
4. E4: Shipping & Fulfillment - Rate calculation, zone handling

### Phase 2: Customer Experience (P1)
**Goal**: Feature parity with Shopify

5. E5: Customer Accounts - Login, order history, saved addresses
6. E6: Admin Dashboard - Product/order management

### Phase 3: Migration (P0 - Parallel)
**Goal**: Seamless transition from Shopify

7. E7: Data Migration - Import products, customers, historical orders

## Critical Path

```
Database Schema (DONE)
       │
       ▼
   E1: Products ──────────────────┐
       │                          │
       ▼                          ▼
   E2: Cart                  E7: Migration
       │                     (parallel work)
       ▼
   E3: Checkout
       │
       ▼
   E4: Shipping
       │
       ├──────────────────────────┤
       ▼                          ▼
   E5: Accounts              E6: Admin
```

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Stripe integration complexity | High | Medium | Use Checkout Sessions, not custom |
| SEO ranking loss | High | Medium | Maintain URL structure, 301 redirects |
| Data migration errors | High | Low | Dry-run imports, validation scripts |
| Payment failures at launch | Critical | Low | Extensive testing, Stripe test mode |
| Shipping calculation errors | Medium | Medium | Weight-based with fallback flat rates |

## Success Metrics

- **Launch Criteria**: All P0 epics complete, tested with real payments
- **Performance**: <2s page load, Core Web Vitals pass
- **Conversion**: Maintain or improve checkout completion rate
- **Operations**: Order processing time unchanged

## Environment Strategy

| Environment | Purpose | Database |
|-------------|---------|----------|
| Development | Local dev | Local Turso / SQLite |
| Preview | PR previews | Turso preview branch |
| Production | Live site | Turso production |

## Documentation Standards

Each epic follows a consistent structure:
- Overview & business value
- User stories with acceptance criteria
- Technical approach & API design
- Database changes (if any)
- Dependencies & blockers
- Testing strategy
- Rollout plan
