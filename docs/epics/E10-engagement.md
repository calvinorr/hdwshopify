# E10: Engagement Features 📋 TODO

> **Status**: NOT STARTED
> **Features**: Product reviews, wishlist, search autocomplete, price filter

**Priority**: P2 (Medium - Engagement)
**Complexity**: High
**Dependencies**: E1 (Product Catalog), E5 (Customer Accounts - for wishlist)

## Overview

Implement features that drive customer engagement and return visits: product reviews and ratings, wishlist/favorites, search autocomplete, and price range filtering.

## Business Value

- Reviews build social proof and trust, increasing conversion rates
- Wishlists drive return visits and email marketing opportunities
- Search autocomplete improves product discovery
- Price filtering helps budget-conscious customers find products faster

## User Stories

### US10.1: Reviews Database Schema
**As a** developer
**I want to** store product reviews in the database
**So that** customers can leave and view reviews

**Acceptance Criteria:**
- [ ] `productReviews` table with columns:
  - id, productId, customerId (nullable)
  - rating (1-5 integer), title, content
  - reviewerName, reviewerEmail
  - status (pending, approved, rejected)
  - verifiedPurchase boolean
  - helpfulCount integer (default 0)
  - createdAt, updatedAt
- [ ] Index on productId for fast queries
- [ ] Foreign key to products table
- [ ] Drizzle migration

---

### US10.2: Review Display Component
**As a** customer
**I want to** see product reviews on the detail page
**So that** I can learn from other customers' experiences

**Acceptance Criteria:**
- [ ] Average rating displayed with star icons
- [ ] Total review count
- [ ] Rating distribution bar chart (5-star, 4-star, etc.)
- [ ] Individual review cards showing:
  - Star rating
  - Title and content
  - Reviewer name and date
  - "Verified Purchase" badge if applicable
  - Helpful/Not helpful buttons
- [ ] Pagination or "Load more" for many reviews
- [ ] Empty state: "No reviews yet. Be the first!"
- [ ] Sort options: Most recent, Highest rated, Most helpful

---

### US10.3: Review Submission Form
**As a** customer
**I want to** leave a review for products I've purchased
**So that** I can share my experience with others

**Acceptance Criteria:**
- [ ] Star rating selector (1-5, required)
- [ ] Title field (optional, max 100 chars)
- [ ] Review content textarea (required, min 20 chars)
- [ ] Name field (required if not logged in)
- [ ] Email field (required if not logged in, not displayed)
- [ ] Submit goes to moderation queue (status: pending)
- [ ] Success message after submission
- [ ] One review per product per customer/email
- [ ] "Verified Purchase" auto-set if order history matches

---

### US10.4: Admin Review Moderation
**As an** admin
**I want to** moderate customer reviews
**So that** I can approve quality reviews and reject spam

**Acceptance Criteria:**
- [ ] Reviews list page in admin dashboard
- [ ] Filter by status: All, Pending, Approved, Rejected
- [ ] Filter by rating: 1-5 stars
- [ ] Search by product name or reviewer
- [ ] Bulk actions: Approve selected, Reject selected
- [ ] Individual review detail view
- [ ] Approve/Reject buttons with confirmation
- [ ] Delete review (permanent)
- [ ] View associated product and customer

---

### US10.5: Wishlist Database Schema
**As a** developer
**I want to** store customer wishlists
**So that** customers can save products for later

**Acceptance Criteria:**
- [ ] `wishlists` table: id, customerId, createdAt
- [ ] `wishlistItems` table: id, wishlistId, productId, variantId (nullable), addedAt
- [ ] Foreign keys to customers, products, variants
- [ ] Unique constraint: one wishlist per customer
- [ ] Drizzle migration

---

### US10.6: Wishlist Heart Button
**As a** customer
**I want to** save products to my wishlist
**So that** I can easily find them later

**Acceptance Criteria:**
- [ ] Heart icon on product cards and detail page
- [ ] Outline heart = not in wishlist
- [ ] Filled heart = in wishlist
- [ ] Click toggles wishlist status
- [ ] Requires authentication (prompts login if not)
- [ ] Optimistic UI update
- [ ] Toast confirmation on add/remove
- [ ] Shows item count in header (optional)

---

### US10.7: Wishlist Page
**As a** customer
**I want to** view and manage my saved items
**So that** I can decide what to purchase

**Acceptance Criteria:**
- [ ] Grid of wishlist items using ProductCard
- [ ] "Remove from Wishlist" action per item
- [ ] "Add to Cart" action per item
- [ ] "Add All to Cart" button (adds all in-stock items)
- [ ] Empty state with CTA to browse products
- [ ] Shows "Out of Stock" badge on unavailable items
- [ ] Accessible at `/wishlist`
- [ ] Protected route (requires authentication)

---

### US10.8: Search Autocomplete
**As a** customer
**I want to** see suggestions as I type in search
**So that** I can find products faster

**Acceptance Criteria:**
- [ ] Dropdown appears after 2+ characters typed
- [ ] Shows up to 5 matching products with:
  - Product image thumbnail
  - Product name with highlighted match
  - Price
- [ ] Shows matching categories (if any)
- [ ] Keyboard navigation (up/down arrows, Enter to select)
- [ ] Click or Enter navigates to product/category
- [ ] "See all results for [query]" link at bottom
- [ ] Debounced API calls (300ms)
- [ ] Loading state while fetching
- [ ] "No results" state

---

### US10.9: Price Range Filter
**As a** customer
**I want to** filter products by price range
**So that** I can find items within my budget

**Acceptance Criteria:**
- [ ] Dual-handle range slider for min/max price
- [ ] Text inputs for manual entry
- [ ] Updates URL params (`?minPrice=10&maxPrice=50`)
- [ ] Shows count of products in selected range
- [ ] Respects variant price ranges (min/max across variants)
- [ ] Integrates with existing filter sidebar
- [ ] "Clear" button resets price filter
- [ ] Min/max bounds based on available products

---

## Technical Approach

### Files to Create

```
lib/db/schema.ts                      # Add reviews, wishlists tables
app/
├── api/
│   ├── reviews/
│   │   └── route.ts                  # POST (submit review)
│   ├── products/
│   │   └── [slug]/
│   │       └── reviews/
│   │           └── route.ts          # GET (product reviews)
│   ├── wishlist/
│   │   ├── route.ts                  # GET, POST
│   │   └── [productId]/
│   │       └── route.ts              # DELETE
│   └── admin/
│       └── reviews/
│           ├── route.ts              # GET (list)
│           └── [id]/
│               └── route.ts          # PATCH, DELETE
├── admin/
│   └── reviews/
│       └── page.tsx                  # Admin moderation page
└── wishlist/
    └── page.tsx                      # Customer wishlist page
components/
├── products/
│   ├── product-reviews.tsx           # Reviews section
│   ├── star-rating.tsx               # Star display/input
│   ├── review-card.tsx               # Individual review
│   ├── review-form.tsx               # Submit review form
│   └── wishlist-button.tsx           # Heart toggle
├── search/
│   └── search-autocomplete.tsx       # Suggestions dropdown
├── ui/
│   └── range-slider.tsx              # Dual-handle slider
└── wishlist/
    └── wishlist-grid.tsx             # Wishlist items grid
```

### Files to Modify

```
components/products/product-filters.tsx  # Add price filter
components/search/search-input.tsx       # Integrate autocomplete
app/products/[slug]/page.tsx             # Add reviews section
components/products/product-card.tsx     # Add wishlist button
components/shop/header.tsx               # Add wishlist icon (optional)
```

### Reviews Schema

```typescript
export const productReviews = sqliteTable('product_reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content').notNull(),
  reviewerName: text('reviewer_name').notNull(),
  reviewerEmail: text('reviewer_email').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .default('pending')
    .notNull(),
  verifiedPurchase: integer('verified_purchase', { mode: 'boolean' })
    .default(false),
  helpfulCount: integer('helpful_count').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
  customer: one(customers, {
    fields: [productReviews.customerId],
    references: [customers.id],
  }),
}));
```

### Wishlist Schema

```typescript
export const wishlists = sqliteTable('wishlists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id')
    .notNull()
    .unique()
    .references(() => customers.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const wishlistItems = sqliteTable('wishlist_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  wishlistId: integer('wishlist_id')
    .notNull()
    .references(() => wishlists.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: integer('variant_id')
    .references(() => productVariants.id, { onDelete: 'set null' }),
  addedAt: text('added_at').default(sql`CURRENT_TIMESTAMP`),
});
```

### Star Rating Component

```typescript
// components/products/star-rating.tsx
interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };

  return (
    <div className="flex gap-0.5" role={interactive ? 'radiogroup' : 'img'}>
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type={interactive ? 'button' : undefined}
          onClick={() => interactive && onChange?.(i + 1)}
          disabled={!interactive}
          className={cn(
            sizes[size],
            i < rating ? 'text-yellow-400' : 'text-gray-300'
          )}
          aria-label={interactive ? `${i + 1} stars` : undefined}
        >
          <Star className="fill-current" />
        </button>
      ))}
    </div>
  );
}
```

### Search Autocomplete API

```typescript
// Extend existing search route
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type'); // 'suggestions' | 'full'

  if (type === 'suggestions') {
    const products = await db.query.products.findMany({
      where: and(
        eq(products.status, 'active'),
        like(products.name, `%${query}%`)
      ),
      with: { images: { limit: 1 }, variants: { limit: 1 } },
      limit: 5,
    });

    const categories = await db.query.categories.findMany({
      where: like(categories.name, `%${query}%`),
      limit: 3,
    });

    return NextResponse.json({ products, categories });
  }

  // Existing full search logic...
}
```

### Price Filter Logic

```typescript
// In collection-products.tsx filter logic
function applyPriceFilter(
  products: ProductWithRelations[],
  minPrice?: number,
  maxPrice?: number
) {
  return products.filter((product) => {
    // Get min and max price across all variants
    const prices = product.variants.map((v) => v.price);
    const productMinPrice = Math.min(...prices);
    const productMaxPrice = Math.max(...prices);

    // Product passes if any variant falls within range
    if (minPrice && productMaxPrice < minPrice) return false;
    if (maxPrice && productMinPrice > maxPrice) return false;
    return true;
  });
}
```

## Testing Strategy

### Unit Tests
- Star rating calculation and display
- Price filter range logic
- Review validation (min length, rating bounds)

### Integration Tests
- Review submission -> pending status
- Admin approve -> status update
- Wishlist add/remove operations
- Search autocomplete API

### E2E Tests
- Submit review flow (form -> confirmation)
- Admin moderation flow
- Wishlist add -> view page -> add to cart
- Search autocomplete -> click suggestion
- Price filter -> results update

## Performance Considerations

- Index reviews by productId for fast lookups
- Cache average ratings per product
- Debounce search autocomplete (300ms)
- Lazy load reviews section (only visible reviews)
- Paginate reviews (10 per page)

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Reviews display correctly with ratings
- [ ] Review moderation workflow functional
- [ ] Wishlist persists for authenticated users
- [ ] Search autocomplete provides relevant suggestions
- [ ] Price filter works with variant pricing
- [ ] Mobile responsive
- [ ] Accessible (keyboard, screen readers)
- [ ] Code reviewed and merged
