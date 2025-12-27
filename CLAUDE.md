# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Herbarium Dyeworks is a self-hosted e-commerce store for naturally dyed yarn, replacing Shopify. Built with Next.js 16 (App Router), Turso/SQLite, Drizzle ORM, and Stripe.

## Commands

```bash
npm run dev          # Start dev server (uses Turbopack)
npm run build        # Production build
npm run lint         # ESLint

npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to Turso database
npm run db:studio    # Open Drizzle Studio GUI
```

## Architecture

### Database Schema (`lib/db/schema.ts`)
Core e-commerce models with Drizzle ORM relations:
- **Products**: `products` → `productVariants` → `productImages` (variants are colorways/sizes)
- **Orders**: `orders` → `orderItems`, linked to `customers` and `discountCodes`
- **Shipping**: `shippingZones` → `shippingRates` (weight-based pricing)
- **Carts**: Persistent carts with JSON items field, supports guest sessions

Access via `import { db } from "@/lib/db"` - exports both client and all schema types.

### Auth (`components/providers.tsx`)
Clerk auth is optional and gracefully degrades - the `Providers` component checks for valid keys before wrapping with `ClerkProvider`.

### UI Components
- shadcn/ui components in `components/ui/`
- Shop-specific components in `components/shop/` (header, footer)
- Use `cn()` from `lib/utils.ts` for className merging

### Fonts
- Body: Quattrocento Sans (`font-body`)
- Headings: Trirong (`font-heading`)

## Environment Variables

Required:
- `DATABASE_URL` - Turso database URL
- `DATABASE_AUTH_TOKEN` - Turso auth token

Optional:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` - Auth (degrades gracefully)
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` - Payments
- `RESEND_API_KEY` - Transactional email

## Business Logic

### Shipping Zones
| Zone | Countries | Notes |
|------|-----------|-------|
| UK | GB | £1.95 - £8.25 |
| Ireland | IE | £3.25 - £15.00 |
| Europe | EU (excl. DE) | No duties (NI Windsor Framework) |
| International | ROW | DDU - customer pays duties |
| US | US | DDP - duties pre-included |

### Product Structure
Products have yarn-specific fields: `fiberContent`, `weight` (Laceweight/4ply/DK/Aran), `yardage`, `careInstructions`. Variants store colorway names, individual pricing, and `weightGrams` for shipping calculation.

## Testing

Visual/E2E tests are in `tests/*.md` and run via `/test` command using Chrome automation.

**Before starting any work:** Review `TEST_PROGRESS.md` to identify existing regressions or incomplete tests.

```bash
/test tests/vibe-check.md   # Run single test
/test all                   # Run all tests
/test status                # Show test summary
```

Test results are logged to `TEST_PROGRESS.md`. Failed test screenshots saved to `test-failures/`.

## Epic & Task Tracking

Epics are documented in `docs/epics/E*.md`. When working on tasks:

1. **Before starting**: Check the epic doc for current status and remaining work. Also check `TEST_PROGRESS.md` for any failing tests
2. **After completing a story/feature**: Update the epic doc immediately
   - Mark checkboxes as complete `[x]`
   - Update the status header (e.g., `📋 TODO` → `✅ COMPLETE`)
   - Add any new learnings or decisions to the doc
3. **When an epic is fully complete**: Update both the epic doc AND `docs/PROJECT_PLAN.md`

Be rigorous - don't let completed work go undocumented.

## Deployment

Push to `main` deploys via Vercel. Domain: `herbarium-dyeworks.warmwetcircles.com`
