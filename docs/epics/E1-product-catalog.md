# E1: Product Catalog

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
- [ ] Grid view of products with image, name, price
- [ ] Show "From £X" pricing when variants have different prices
- [ ] Indicate stock status (In Stock / Low Stock / Sold Out)
- [ ] Pagination or infinite scroll for large catalogs
- [ ] Sort by: Featured, Price (low-high, high-low), Newest
- [ ] Filter by: Yarn weight, Fiber content, Availability

### US1.2: View Collection
**As a** customer
**I want to** browse products by collection/category
**So that** I can find specific yarn types

**Acceptance Criteria:**
- [ ] Collection page with description and products
- [ ] Maintain Shopify URL structure: `/collections/{slug}`
- [ ] Support nested collections (e.g., Yarn > DK)
- [ ] Collection-specific filtering
- [ ] Empty state for collections with no products

### US1.3: View Product Detail
**As a** customer
**I want to** see full product details
**So that** I can make an informed purchase decision

**Acceptance Criteria:**
- [ ] Product images with gallery/zoom
- [ ] Variant selector (colorway dropdown/swatches)
- [ ] Dynamic price update based on variant
- [ ] Stock status per variant
- [ ] Full description with yarn specifications:
  - Fiber content
  - Weight category
  - Yardage/meterage
  - Care instructions
- [ ] Add to cart button (disabled when sold out)
- [ ] URL structure: `/products/{slug}`

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
- [ ] Featured products section on homepage
- [ ] Configurable via `featured` flag in database
- [ ] Limit to 4-8 products

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

- [ ] Meta title: `{Product Name} | Herbarium Dyeworks`
- [ ] Meta description from product description
- [ ] Open Graph images from product images
- [ ] JSON-LD structured data (Product schema)
- [ ] Canonical URLs
- [ ] Image alt text from database

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

## Open Questions

- [ ] Image hosting: Vercel Blob, Cloudinary, or existing Shopify CDN?
- [ ] Color swatch implementation: actual colors or variant images?
- [ ] Inventory display: show exact count or just status?

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Mobile responsive (tested on iPhone, Android)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Performance targets met
- [ ] SEO requirements implemented
- [ ] Code reviewed and merged
