# E9: UX Improvements 🚧 IN PROGRESS

> **Status**: IN PROGRESS
> **Features**: Color swatches, related products, quick-add, recently viewed
> **Completed**: US9.1 (Color hex column), US9.2 (Visual color swatches - on hold)
> **Future**: US9.8 (Collection-level color swatches)

**Priority**: P1 (High - Friction Points)
**Complexity**: Medium
**Dependencies**: E1 (Product Catalog), E8 (Cart Fixes)

## Overview

Implement high-impact UX improvements that reduce friction in the shopping journey: visual color swatches for yarn colorways, related product recommendations, quick-add-to-cart on product cards, and recently viewed product tracking.

## Business Value

- Color swatches help customers visualize yarn colors without clicking through each variant
- Related products increase average order value through cross-selling
- Quick-add reduces clicks to purchase, improving conversion
- Recently viewed helps customers return to products they were considering

## User Stories

### US9.1: Add Color Hex to Variants ✅
**As an** admin
**I want to** specify a hex color for each variant
**So that** customers see accurate color swatches

**Acceptance Criteria:**
- [x] Add `colorHex` column to `productVariants` table (nullable)
- [x] Color picker input in admin product form
- [x] Drizzle migration preserves existing data
- [x] Hex validation (6-character format)

---

### US9.2: Visual Color Swatches ✅ (On Hold)
**As a** customer
**I want to** see color swatches for yarn colorways
**So that** I can quickly compare colors without clicking each option

**Acceptance Criteria:**
- [x] Round swatch circles display variant color
- [x] Selected state shown with ring/border
- [x] Tooltip shows colorway name on hover
- [x] Falls back to card-style selector if no hex set (auto-detection)
- [x] Keyboard navigable with ARIA labels
- [ ] Works on both product detail and quick-view (quick-view not yet implemented)

> **Note (Dec 2024):** Feature implemented but **on hold for business validation**.
> Hand-dyed yarns are unique - each skein varies naturally, so per-variant hex colors
> may not accurately represent the product. The swatch infrastructure could be
> repurposed for **collection-level color theming** instead (see US9.8 below).

---

### US9.3: Related Products Component
**As a** customer
**I want to** see related products on the product detail page
**So that** I can discover other yarns I might like

**Acceptance Criteria:**
- [ ] "You may also like" section on product detail page
- [ ] Displays 4 related products
- [ ] Algorithm: same category > same yarn weight > newest
- [ ] Excludes current product from results
- [ ] Horizontal scroll on mobile, grid on desktop
- [ ] Uses existing ProductCard component
- [ ] Lazy loaded (below the fold)

---

### US9.4: Quick-Add-to-Cart Button
**As a** customer
**I want to** add products to cart from the listing page
**So that** I don't have to visit each product page

**Acceptance Criteria:**
- [ ] "Add to Cart" or "+" button appears on product card hover
- [ ] Single-variant products: add directly to cart
- [ ] Multi-variant products: open quick-view modal or link to PDP
- [ ] Button positioned at bottom of product image
- [ ] Shows on keyboard focus for accessibility
- [ ] Mobile: always visible as smaller button
- [ ] Shows loading state during add
- [ ] Triggers success toast on add

---

### US9.5: Quick-View Modal
**As a** customer
**I want to** see product details and select variants without leaving the listing
**So that** I can quickly add items to my cart

**Acceptance Criteria:**
- [ ] Modal opens from quick-add on multi-variant products
- [ ] Shows: product image, name, price, variant selector
- [ ] Color swatches for variant selection
- [ ] Quantity selector
- [ ] "Add to Cart" button
- [ ] "View Full Details" link to PDP
- [ ] Closes on backdrop click or ESC

---

### US9.6: Track Recently Viewed Products
**As a** customer
**I want to** my recently viewed products to be remembered
**So that** I can easily find items I was looking at

**Acceptance Criteria:**
- [ ] Track last 10 viewed products in localStorage
- [ ] Store: productSlug, productName, image, price, timestamp
- [ ] Update on product detail page visit
- [ ] Deduplicate (move to front if re-viewed)
- [ ] Expire entries older than 30 days

---

### US9.7: Recently Viewed Section
**As a** customer
**I want to** see my recently viewed products
**So that** I can return to items I was considering

**Acceptance Criteria:**
- [ ] "Recently Viewed" section displays on product detail pages
- [ ] Shows up to 4 products
- [ ] Hidden if no viewing history
- [ ] Uses ProductCard component
- [ ] Positioned below main product content
- [ ] Optional: also show on homepage

---

### US9.8: Collection Color Swatches 📋 FUTURE
**As a** customer
**I want to** filter or browse products by color family/mood
**So that** I can find yarns that match my project palette

> **Background:** The per-variant `colorHex` swatch feature (US9.1/9.2) was implemented
> but may not suit hand-dyed products where each skein is unique. This story explores
> using swatches at the **collection level** instead.

**Possible Approaches:**
1. **Collection-level swatch**: Add `colorHex` to collections (e.g., "Warm Tones" = #8B4513)
2. **Color family tags**: Tag products with color families (warm, cool, neutral, earth)
3. **Mood/palette filtering**: Filter products by color mood on shop page
4. **Dye source grouping**: Group by botanical dye (indigo = blues, madder = reds/oranges)

**Acceptance Criteria (TBD):**
- [ ] Define color families or moods relevant to natural dyes
- [ ] Assign swatches/colors to collections or tags
- [ ] Display visual swatches on collection pages or filters
- [ ] Customers can browse by color mood

**Technical Notes:**
- Existing `colorHex` column on variants can remain for future use
- Could add `colorHex` to `categories` or create new `colorFamilies` table
- Swatch component already built and can be reused

---

## Technical Approach

### Files to Create

```
components/
├── products/
│   ├── related-products.tsx      # Related products section
│   ├── quick-add-modal.tsx       # Variant selection modal
│   └── recently-viewed.tsx       # Recently viewed section
hooks/
└── use-recently-viewed.ts        # localStorage hook
app/
└── api/
    └── products/
        └── [slug]/
            └── related/
                └── route.ts      # Related products API
```

### Files to Modify

```
lib/db/schema.ts                  # Add colorHex column
app/admin/products/product-form.tsx  # Color picker input
components/products/variant-selector.tsx  # Swatch UI
components/products/product-card.tsx  # Quick-add button
app/products/[slug]/page.tsx      # Add related & recently viewed
```

### Schema Change

```typescript
// lib/db/schema.ts
export const productVariants = sqliteTable('product_variants', {
  // ... existing columns
  colorHex: text('color_hex'),  // New column, e.g., "#8B4513"
});
```

### Color Swatch Component

```typescript
// In variant-selector.tsx
interface SwatchProps {
  variant: ProductVariant;
  selected: boolean;
  onSelect: () => void;
}

function ColorSwatch({ variant, selected, onSelect }: SwatchProps) {
  const hasColor = variant.colorHex;
  const hasImage = variant.images?.[0];

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-8 h-8 rounded-full border-2 transition-all',
        selected ? 'ring-2 ring-offset-2 ring-primary' : 'ring-0'
      )}
      style={hasColor ? { backgroundColor: variant.colorHex } : undefined}
      aria-label={variant.name}
      title={variant.name}
    >
      {!hasColor && hasImage && (
        <Image
          src={hasImage.url}
          alt={variant.name}
          className="w-full h-full rounded-full object-cover"
        />
      )}
    </button>
  );
}
```

### Related Products API

```typescript
// app/api/products/[slug]/related/route.ts
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const product = await getProductBySlug(params.slug);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Priority: same category, then same weight, then newest
  const related = await db.query.products.findMany({
    where: and(
      ne(products.id, product.id),
      eq(products.status, 'active'),
      or(
        eq(products.categoryId, product.categoryId),
        eq(products.weight, product.weight)
      )
    ),
    with: { variants: true, images: true },
    orderBy: [desc(products.isFeatured), desc(products.createdAt)],
    limit: 4,
  });

  return NextResponse.json(related);
}
```

### Recently Viewed Hook

```typescript
// hooks/use-recently-viewed.ts
const STORAGE_KEY = 'recently-viewed';
const MAX_ITEMS = 10;
const EXPIRY_DAYS = 30;

interface ViewedProduct {
  slug: string;
  name: string;
  image: string;
  price: number;
  timestamp: number;
}

export function useRecentlyViewed() {
  const [items, setItems] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Filter out expired items
      const fresh = parsed.filter(
        (item: ViewedProduct) =>
          Date.now() - item.timestamp < EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );
      setItems(fresh);
    }
  }, []);

  const addProduct = useCallback((product: Omit<ViewedProduct, 'timestamp'>) => {
    setItems((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.slug !== product.slug);
      // Add to front with timestamp
      const updated = [{ ...product, timestamp: Date.now() }, ...filtered];
      // Trim to max
      const trimmed = updated.slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      return trimmed;
    });
  }, []);

  return { items, addProduct };
}
```

### Quick-Add Button on Product Card

```typescript
// In product-card.tsx
function QuickAddButton({ product }: { product: ProductWithRelations }) {
  const { addItem } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const hasMultipleVariants = product.variants.length > 1;

  if (hasMultipleVariants) {
    return (
      <QuickViewModal product={product}>
        <Button size="sm" variant="secondary">
          <Plus className="w-4 h-4 mr-1" />
          Add
        </Button>
      </QuickViewModal>
    );
  }

  const handleQuickAdd = async () => {
    setIsLoading(true);
    await addItem(product.variants[0].id, 1);
    setIsLoading(false);
  };

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={handleQuickAdd}
      disabled={isLoading || product.variants[0].stock === 0}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
    </Button>
  );
}
```

## Testing Strategy

### Unit Tests
- Color swatch rendering with/without hex
- Recently viewed localStorage operations
- Related products sorting algorithm

### Integration Tests
- Related products API returns correct products
- Quick-add triggers cart API correctly

### E2E Tests
- Select color swatch -> variant changes
- Quick-add single variant product -> toast appears
- Quick-add multi-variant -> modal opens
- Recently viewed populates after visiting products

## Performance Considerations

- Lazy load related products section (below fold)
- Lazy load quick-view modal component
- Preload product images on hover for quick-view
- Debounce recently viewed localStorage writes

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Color swatches render correctly for all variants
- [ ] Related products display relevant suggestions
- [ ] Quick-add works for single and multi-variant products
- [ ] Recently viewed persists across sessions
- [ ] Mobile responsive
- [ ] Accessible (keyboard navigation, screen readers)
- [ ] Code reviewed and merged
