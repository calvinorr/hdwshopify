# Codebase Documentation

> **Last Updated**: 2025-12-29
> **Purpose**: Living document tracking what's built, what works, and what needs work.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Framework | Next.js 16 (App Router) | Uses Turbopack for dev |
| Database | Turso (SQLite edge) | Two databases: primary + golden backup |
| ORM | Drizzle | Type-safe, lightweight |
| Payments | Stripe Checkout | Test mode verified |
| Auth | Clerk (optional) | Gracefully degrades if not configured |
| Images | Shopify CDN + Vercel Blob | Existing images from Shopify, new uploads via Blob |
| Email | Resend | Configured but needs testing |
| Hosting | Vercel | Push to main deploys |
| UI | shadcn/ui + Tailwind | Custom fonts: Quattrocento Sans, Trirong |

---

## Database State

| Database | Purpose | URL |
|----------|---------|-----|
| Primary | Production/dev | `libsql://herbarium-dyeworks-db-calvinorr.aws-eu-west-1.turso.io` |
| Golden | Immutable backup | `libsql://herbarium-dyeworks-golden-calvinorr.aws-eu-west-1.turso.io` |

### Current Data

| Table | Count | Notes |
|-------|-------|-------|
| products | 198 | Active products imported from Shopify |
| categories | 17 | Shopify collections |
| product_images | 281 | Images (Shopify CDN URLs) |
| shipping_zones | 4 | UK, Ireland, Europe, International |
| shipping_rates | 11 | Weight-based rates |
| customers | 0 | Need to import from Shopify |
| orders | 0 | Fresh start (not importing historical) |

---

## Pages - Customer Facing

### Shop

| Route | Status | Description |
|-------|--------|-------------|
| `/` | ✅ Done | Homepage with hero carousel, featured products |
| `/products` | ✅ Done | Product grid with filters (weight, fiber, availability), sorting |
| `/products/[slug]` | ✅ Done | Product detail with gallery, zoom, add-to-cart |
| `/collections` | ✅ Done | All collections grid |
| `/collections/[slug]` | ✅ Done | Collection page with products |
| `/search` | ⚠️ Basic | Searches name/description/SKU. Missing: fiber, weight search |
| `/cart` | ✅ Done | Cart page with quantity controls |
| `/checkout` | ✅ Done | Country selection, shipping rates |
| `/checkout/success` | ✅ Done | Order confirmation |

### Customer Account

| Route | Status | Description |
|-------|--------|-------------|
| `/account` | ✅ Done | Dashboard with recent orders, addresses |
| `/account/orders` | ✅ Done | Full order history |
| `/account/orders/[id]` | ✅ Done | Order detail with status, tracking |
| `/account/addresses` | ✅ Done | Saved addresses |
| `/account/settings` | ✅ Done | Profile settings |
| `/order/[orderNumber]` | ✅ Done | Guest order lookup |

### Content Pages

| Route | Status | Description |
|-------|--------|-------------|
| `/about` | ✅ Done | About page (admin editable) |
| `/contact` | ✅ Done | Contact page |
| `/faq` | ✅ Done | FAQ page |
| `/natural-dyes` | ✅ Done | Natural dyes info |
| `/dyestuffs` | ✅ Done | Dyestuffs info |
| `/environmental` | ✅ Done | Environmental commitment |
| `/stockists` | ✅ Done | Stockists page |
| `/shipping` | ✅ Done | Shipping info (admin editable) |
| `/returns` | ✅ Done | Returns policy (admin editable) |
| `/terms` | ✅ Done | Terms & conditions (admin editable) |
| `/privacy` | ✅ Done | Privacy policy (admin editable) |

---

## Pages - Admin

| Route | Status | Description |
|-------|--------|-------------|
| `/admin` | ✅ Done | Dashboard: today's orders, revenue, pending orders, low stock |
| `/admin/products` | ✅ Done | Product list with search |
| `/admin/products/new` | ✅ Done | Create product form |
| `/admin/products/[id]` | ✅ Done | Edit product with images, tags |
| `/admin/collections` | ✅ Done | Collection list, drag-to-reorder |
| `/admin/collections/new` | ✅ Done | Create collection |
| `/admin/collections/[id]` | ✅ Done | Edit collection, manage products |
| `/admin/orders` | ✅ Done | Order list with filters |
| `/admin/orders/[id]` | ✅ Done | Order detail, fulfillment, tracking |
| `/admin/orders/[id]/packing-slip` | ✅ Done | Printable packing slip |
| `/admin/customers` | ✅ Done | Customer list |
| `/admin/customers/[id]` | ✅ Done | Customer detail, order history |
| `/admin/inventory` | ✅ Done | Stock levels, quick adjust |
| `/admin/discounts` | ✅ Done | Discount codes list |
| `/admin/discounts/new` | ✅ Done | Create discount |
| `/admin/discounts/[id]` | ✅ Done | Edit discount |
| `/admin/settings` | ✅ Done | Settings overview |
| `/admin/settings/homepage` | ✅ Done | Hero carousel management |
| `/admin/settings/shipping` | ✅ Done | Shipping zones/rates |
| `/admin/settings/legal` | ✅ Done | Edit legal pages |
| `/admin/settings/about` | ✅ Done | Edit about page |
| `/admin/settings/taxonomies` | ✅ Done | Manage weight types, tags |
| `/admin/settings/redirects` | ✅ Done | URL redirects for SEO |
| `/admin/settings/import` | ✅ Done | Shopify import tools |

---

## Key Features

### Working Well

| Feature | Notes |
|---------|-------|
| Product catalog | Grid, filters, sorting, pagination |
| Collections | Full management, reordering |
| Shopping cart | Persistent, guest support |
| Stripe checkout | Happy path tested, 3DS works |
| Stock reservations | Holds stock during checkout |
| Shipping calculation | Weight-based, 4 zones |
| Discount codes | Percentage & fixed, min order |
| Admin dashboard | Stats, pending orders, low stock |
| Product management | Create/edit, images, tags |
| Order fulfillment | Status updates, tracking, packing slips |
| Customer accounts | Login, order history, addresses |
| Hero carousel | Admin manageable |
| Related products | Shows on product page |
| Recently viewed | Client-side tracking |
| SEO fields | Meta title/description on products/collections |

### Needs Improvement

| Feature | Current State | What's Needed |
|---------|--------------|---------------|
| Search | Searches name/description/SKU | Add fiber content, weight search |
| Email | Resend configured, untested | Test or switch to Gmail SMTP |
| Customer import | Blocked by Shopify API | Get CSV export or API approval |
| Social media | Not implemented | Add footer links |

### Not Built (Out of Scope)

- Multi-currency (GBP only)
- Gift cards
- Subscriptions
- Customer reviews
- Wishlist
- Complex promotions (BOGO, bundles)
- AI-assisted SEO (future enhancement)
- Themes (future enhancement)

---

## Database Schema (Simplified)

```
products
├── id, name, slug, description
├── price, compareAtPrice, stock, weightGrams, sku
├── fiberContent, weight, yardage, careInstructions
├── status (draft/active/archived), featured
├── metaTitle, metaDescription
└── categoryId → categories

product_images
└── productId, url, alt, position

categories (collections)
├── id, name, slug, description, image
├── status, metaTitle, metaDescription
└── position, parentId

customers
├── id, email, clerkId
├── firstName, lastName, phone
└── acceptsMarketing

addresses
└── customerId, type, line1, line2, city, postalCode, country

orders
├── orderNumber, customerId, email
├── status, paymentStatus
├── subtotal, shippingCost, discountAmount, total
├── shippingMethod, shippingAddress, trackingNumber
└── stripeSessionId, stripePaymentIntentId

order_items
└── orderId, productId, productName, colorway, quantity, price

order_events (audit log)
└── orderId, event, data, createdAt

shipping_zones
└── id, name, countries (JSON)

shipping_rates
└── zoneId, name, minWeight, maxWeight, price

discount_codes
└── code, type, value, minOrderValue, maxUses, expiresAt

stock_reservations
└── productId, quantity, stripeSessionId, expiresAt

site_settings (key-value)
hero_slides
weight_types
product_tags
redirects
newsletter_subscribers
carts
```

---

## API Endpoints

### Public

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products` | GET | List products with filters |
| `/api/products/[slug]` | GET | Single product |
| `/api/products/[slug]/related` | GET | Related products |
| `/api/products/recently-viewed` | GET | Recently viewed |
| `/api/collections` | GET | List collections |
| `/api/collections/[slug]` | GET | Single collection |
| `/api/search` | GET | Product search |
| `/api/cart` | GET/POST | Get/update cart |
| `/api/cart/[itemId]` | PATCH/DELETE | Update/remove item |
| `/api/checkout/session` | POST | Create Stripe session |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |
| `/api/discount/validate` | POST | Validate discount code |
| `/api/order/verify` | GET | Verify order (guest) |
| `/api/account/*` | Various | Account management |

### Admin (Protected)

| Endpoint | Description |
|----------|-------------|
| `/api/admin/products` | Product CRUD |
| `/api/admin/collections` | Collection CRUD + reorder |
| `/api/admin/orders` | Order management + export |
| `/api/admin/customers` | Customer management + export |
| `/api/admin/inventory` | Stock management + bulk |
| `/api/admin/discounts` | Discount CRUD |
| `/api/admin/settings/*` | All settings endpoints |
| `/api/admin/taxonomies/*` | Weight types, tags |
| `/api/admin/redirects` | URL redirects |
| `/api/admin/migrate` | Shopify import |

---

## Environment Variables

### Required

```bash
DATABASE_URL=libsql://...turso.io
DATABASE_AUTH_TOKEN=...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Optional

```bash
# Auth (degrades gracefully)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Email (needed for notifications)
RESEND_API_KEY=re_...
EMAIL_FROM=Herbarium Dyeworks <orders@...>

# Image upload
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

---

## Current Branch State

| Branch | Contains | Status |
|--------|----------|--------|
| `main` | Pre-E16 code (with variants) | Stable |
| `feature/e16-remove-variants` | E16 + E17 (no variants, DB populated) | Ready to merge |

**Action needed**: Merge `feature/e16-remove-variants` to `main`

---

## File Structure

```
app/
├── (auth)/            # Sign in/up pages
├── account/           # Customer account pages
├── admin/             # Admin dashboard
├── api/               # API routes
├── checkout/          # Checkout flow
├── collections/       # Collection pages
├── products/          # Product pages
├── search/            # Search page
└── [content pages]    # About, contact, etc.

components/
├── admin/             # Admin-specific components
├── cart/              # Cart drawer, items
├── collections/       # Collection header/nav
├── home/              # Hero carousel
├── products/          # Product cards, gallery, filters
├── search/            # Search input/results
├── shop/              # Header, footer, user menu
└── ui/                # shadcn/ui components

lib/
├── db/                # Database client, schema, queries
├── email/             # Email templates
├── shopify/           # Shopify API (for import)
└── utils.ts           # Utility functions

scripts/
├── import-from-shopify.ts
├── seed-shipping.ts
└── validate-*.ts
```

---

## Known Issues

1. **Search doesn't search fiber/weight** - API only searches name/description/SKU
2. **Email untested** - Resend is configured but needs end-to-end test
3. **Customer import blocked** - Shopify API doesn't allow customer PII access

---

## Version History

| Date | Change |
|------|--------|
| 2025-12-29 | Created initial documentation |
| 2025-12-29 | E16 complete - removed variants, simplified to single product model |
| 2025-12-29 | E17 complete - databases created, Shopify data imported |
