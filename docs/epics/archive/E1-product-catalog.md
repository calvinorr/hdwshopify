# E1: Product Catalog ✅ MOSTLY COMPLETE

> **Status**: MOSTLY COMPLETE
> **Remaining**: Accessibility audit

**Priority**: P0
**Complexity**: Medium
**Dependencies**: Database schema (complete)

## Overview

Build the public-facing product catalog enabling customers to browse products, view collections, and access detailed product information. This is the foundation for all commerce functionality.

## Business Value

- Customers can discover and browse the full yarn catalog
- SEO-optimized pages maintain search rankings during migration
- Collection-based navigation mirrors existing Shopify structure

## User Stories

### US1.1: Browse All Products
**As a** customer
**I want to** see all available products
**So that** I can discover what's available

**Acceptance Criteria:**
- [x] Grid view of products with image, name, price
- [x] Show "From £X" pricing when variants have different prices
- [x] Indicate stock status (In Stock / Low Stock / Sold Out)
- [x] Pagination or infinite scroll for large catalogs
- [x] Sort by: Featured, Price (low-high, high-low), Newest
- [x] Filter by: Yarn weight, Fiber content, Availability

### US1.2: View Collection
**As a** customer
**I want to** browse products by collection/category
**So that** I can find specific yarn types

**Acceptance Criteria:**
- [x] Collection page with description and products
- [x] Maintain Shopify URL structure: `/collections/{slug}`
- [ ] Support nested collections (e.g., Yarn > DK)
- [x] Collection-specific filtering (same as products page)
- [x] Empty state for collections with no products

### US1.3: View Product Detail
**As a** customer
**I want to** see full product details
**So that** I can make an informed purchase decision

**Acceptance Criteria:**
- [x] Product images with gallery/zoom (lightbox with 2.5x zoom and pan)
- [x] Variant selector (colorway dropdown/swatches)
- [x] Dynamic price update based on variant
- [x] Stock status per variant
- [x] Full description with yarn specifications:
  - Fiber content
  - Weight category
  - Yardage/meterage
  - Care instructions
- [x] Add to cart button (disabled when sold out)
- [x] URL structure: `/products/{slug}`

### US1.4: Search Products
**As a** customer
**I want to** search for products
**So that** I can quickly find specific items

**Acceptance Criteria:**
- [ ] Search input in header
- [ ] Search by product name, variant name, description
- [ ] Search results page with product grid
- [ ] "No results" state with suggestions
- [ ] Search suggestions/autocomplete (stretch goal)

### US1.5: Featured Products
**As a** customer
**I want to** see featured products on the homepage
**So that** I can discover highlighted items

**Acceptance Criteria:**
- [x] Featured products section on homepage
- [x] Configurable via `featured` flag in database
- [x] Limit to 4-8 products

## Technical Approach

### API Routes

```
GET /api/products
  Query: ?collection=slug&sort=price-asc&page=1&limit=24
  Response: { products: Product[], pagination: {...} }

GET /api/products/[slug]
  Response: Product with variants and images

GET /api/collections
  Response: Collection[] with hierarchy

GET /api/collections/[slug]
  Response: Collection with products

GET /api/search
  Query: ?q=merino&limit=20
  Response: { products: Product[], total: number }
```

### Data Fetching Strategy

| Page | Strategy | Rationale |
|------|----------|-----------|
| Product list | SSR + SWR | Fresh data, fast navigation |
| Product detail | SSG + ISR | SEO critical, cache-friendly |
| Collection | SSG + ISR | SEO critical, rarely changes |
| Search | Client-side | Dynamic, user-initiated |

### Components

```
components/
├── products/
│   ├── product-card.tsx        # Grid item
│   ├── product-grid.tsx        # Grid layout
│   ├── product-filters.tsx     # Filter sidebar
│   ├── product-sort.tsx        # Sort dropdown
│   ├── product-gallery.tsx     # Image gallery
│   ├── variant-selector.tsx    # Colorway picker
│   └── add-to-cart.tsx         # Add to cart button
├── collections/
│   ├── collection-header.tsx   # Title, description
│   └── collection-nav.tsx      # Category navigation
└── search/
    ├── search-input.tsx        # Header search
    └── search-results.tsx      # Results grid
```

### Page Routes

```
app/
├── page.tsx                     # Homepage with featured
├── products/
│   └── [slug]/
│       └── page.tsx             # Product detail
├── collections/
│   ├── page.tsx                 # All collections
│   └── [slug]/
│       └── page.tsx             # Collection detail
└── search/
    └── page.tsx                 # Search results
```

## Database Queries

### Get Products with Variants (optimized)
```typescript
const products = await db.query.products.findMany({
  where: eq(products.status, 'active'),
  with: {
    variants: true,
    images: {
      orderBy: [asc(productImages.position)],
      limit: 1, // Just primary image for list
    },
    category: true,
  },
  orderBy: [desc(products.featured), desc(products.createdAt)],
});
```

### Get Product Detail
```typescript
const product = await db.query.products.findFirst({
  where: eq(products.slug, slug),
  with: {
    variants: {
      orderBy: [asc(productVariants.position)],
    },
    images: {
      orderBy: [asc(productImages.position)],
    },
    category: true,
  },
});
```

## SEO Requirements

- [x] Meta title: `{Product Name} | Herbarium Dyeworks`
- [x] Meta description from product description
- [x] Open Graph images from product images
- [ ] JSON-LD structured data (Product schema)
- [x] Canonical URLs
- [x] Image alt text from database

## Testing Strategy

### Unit Tests
- Price formatting utilities
- Stock status calculations
- Filter/sort logic

### Integration Tests
- API routes return correct data
- Pagination works correctly
- Filters combine properly

### E2E Tests
- Browse collection → view product → variant selection
- Search → results → product detail
- Mobile responsive behavior

## Performance Targets

- Product list: <500ms TTFB
- Product detail: <300ms TTFB (cached)
- Images: WebP format, lazy loading, proper sizing
- Core Web Vitals: LCP <2.5s, CLS <0.1

## Rollout Plan

1. **Dev**: Build all components and pages
2. **Preview**: Test with sample data
3. **Staging**: Import real product data
4. **Production**: Launch with feature flag

## Open Questions (Resolved)

- [x] **Image hosting**: Keep existing Shopify CDN for migrated products (no re-upload needed), use Vercel Blob for new uploads via admin dashboard
- [x] **Color swatch implementation**: Use variant images - natural dyes create unique color variations that hex codes can't capture; thumbnail images show actual yarn texture
- [x] **Inventory display**: Show status only (In Stock / Low Stock / Sold Out) - exact counts can create false urgency and disappoint customers with stock discrepancies

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Mobile responsive (tested on iPhone, Android)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance targets met
- [ ] SEO requirements implemented
- [ ] Code reviewed and merged
