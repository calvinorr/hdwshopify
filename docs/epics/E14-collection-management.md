# E14: Collection Management System 📋 TODO

> **Status**: TODO
> **Priority**: P0 (High - Core Admin Feature)
> **Features**: Collection status, image upload, drag-drop ordering, SEO, stock filtering, tagging

**Priority**: P0 (High - Essential for store management)
**Complexity**: Medium
**Dependencies**: E1 (Product Catalog), E6 (Admin Dashboard)

## Overview

Professional-grade collection management for the admin dashboard. Makes it easy to create, organize, and manage collections with proper status controls, visual ordering, and smart filtering options. Designed for a business selling unique hand-dyed products where collections are the primary way customers browse.

## Business Value

- **Efficiency**: Quickly create and manage collections without developer help
- **Flexibility**: Hide collections temporarily (seasonal, out-of-stock) without deleting
- **SEO**: Proper meta tags for collection pages to improve search visibility
- **Customer Experience**: Stock-aware collections show customers what's available

## User Stories

### US14.1: Collection Status & Visibility ✅ P0
**As an** admin
**I want to** set collection status (draft/active/hidden)
**So that** I can prepare collections before publishing and hide them when needed

**Acceptance Criteria:**
- [ ] Add `status` field to collections schema (draft/active/archived)
- [ ] Status selector in collection form (dropdown)
- [ ] Draft collections not visible on storefront
- [ ] Archived/hidden collections not visible on storefront
- [ ] Status badge shown in admin collection list
- [ ] Filter collections by status in admin
- [ ] Bulk status change (select multiple → change status)

**Technical Notes:**
- Add `status` column to `categories` table
- Update collection queries to filter by status on storefront
- Admin sees all, storefront sees only `active`

---

### US14.2: Collection Image Upload ✅ P0
**As an** admin
**I want to** upload collection images directly
**So that** I don't have to manually host images elsewhere

**Acceptance Criteria:**
- [ ] Drag-and-drop image upload zone
- [ ] Click to browse file picker
- [ ] Image preview after upload
- [ ] Remove/replace image button
- [ ] Loading state during upload
- [ ] Error handling for failed uploads
- [ ] Accepts common formats (jpg, png, webp)

**Technical Notes:**
- Use existing Vercel Blob upload infrastructure
- Reuse image upload patterns from product form
- Max file size: 5MB

---

### US14.3: Drag-Drop Collection Ordering ✅ P1
**As an** admin
**I want to** drag collections to reorder them
**So that** I can quickly arrange the display order visually

**Acceptance Criteria:**
- [ ] Drag handle on each collection card/row
- [ ] Visual feedback during drag (ghost, drop indicator)
- [ ] Position saved immediately on drop
- [ ] Works on desktop (mouse)
- [ ] Works on tablet (touch)
- [ ] Keyboard accessible (move up/down buttons)
- [ ] Order reflected on storefront navigation

**Technical Notes:**
- Use `@dnd-kit/core` or similar
- Optimistic UI update, sync to server
- Update `position` column on reorder

---

### US14.4: Collection SEO Fields ✅ P1
**As an** admin
**I want to** set SEO meta tags for collections
**So that** collection pages rank well in search engines

**Acceptance Criteria:**
- [ ] Meta title field (with character count)
- [ ] Meta description field (with character count)
- [ ] Preview of how it appears in Google
- [ ] Auto-generate from collection name/description if empty
- [ ] OG image uses collection image by default

**Technical Notes:**
- Add `metaTitle`, `metaDescription` columns to categories
- Update collection page metadata generation
- Character limits: title ~60, description ~160

---

### US14.5: Collection Stock Filtering ✅ P1
**As an** admin
**I want to** configure how collections handle out-of-stock products
**So that** I can show/hide sold-out items per collection

**Acceptance Criteria:**
- [ ] Collection setting: "Show out-of-stock products" (yes/no)
- [ ] When "no": only in-stock products appear in collection
- [ ] When "yes": all products appear, out-of-stock shown with badge
- [ ] Default: show all (existing behavior)
- [ ] Stock status updates in real-time (no cache issues)

**Technical Notes:**
- Add `hideOutOfStock` boolean to categories
- Filter products in collection queries when enabled
- Consider: could also be a storefront filter toggle

---

### US14.6: Featured Collections ✅ P2
**As an** admin
**I want to** mark collections as featured
**So that** they appear prominently on the homepage and navigation

**Acceptance Criteria:**
- [ ] "Featured" toggle on collection form
- [ ] Featured collections shown on homepage
- [ ] Featured collections prioritized in navigation
- [ ] Limit featured count (e.g., max 6)
- [ ] Visual indicator in admin list

**Technical Notes:**
- Add `featured` boolean to categories
- Update homepage to query featured collections
- Update nav component to show featured first

---

### US14.7: Product Tag Management ✅ P2
**As an** admin
**I want to** create and assign tags to products
**So that** I can group products flexibly beyond collections

**Acceptance Criteria:**
- [ ] Tag management page in admin
- [ ] Create new tags with name and optional color
- [ ] Assign tags to products (multi-select)
- [ ] Filter products by tag in admin
- [ ] Tags visible on product cards (optional)
- [ ] Delete tags (with confirmation)

**Technical Notes:**
- Schema already exists: `productTags`, `productTagAssignments`
- Build admin UI for tag CRUD
- Add tag selector to product form

---

### US14.8: Smart Collections (Auto-Rules) 📋 FUTURE
**As an** admin
**I want to** create collections with automatic rules
**So that** products are added automatically based on criteria

**Possible Rules:**
- Products with specific tag
- Products in price range
- Products with specific yarn weight
- Products added in last N days
- Combination of above (AND/OR)

**Acceptance Criteria (TBD):**
- [ ] Rule builder UI
- [ ] Multiple conditions with AND/OR
- [ ] Preview matching products
- [ ] Auto-sync when products change

**Technical Notes:**
- More complex feature, mark as future
- Would need rule storage and evaluation engine

---

## Technical Approach

### Schema Changes

```sql
-- Add to categories table
ALTER TABLE categories ADD COLUMN status TEXT DEFAULT 'active';
ALTER TABLE categories ADD COLUMN meta_title TEXT;
ALTER TABLE categories ADD COLUMN meta_description TEXT;
ALTER TABLE categories ADD COLUMN featured INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN hide_out_of_stock INTEGER DEFAULT 0;
```

### Files to Modify

```
lib/db/schema.ts                    # Add new columns
app/admin/collections/page.tsx      # Status badges, filtering, drag-drop
app/admin/collections/collection-form.tsx  # New fields
app/collections/[slug]/page.tsx     # SEO metadata, stock filtering
components/shop/header.tsx          # Featured collections in nav
```

### Files to Create

```
app/admin/tags/page.tsx             # Tag management
app/admin/tags/[id]/page.tsx        # Edit tag
components/admin/collection-list.tsx # Drag-drop sortable list
lib/actions/collections.ts          # Server actions for reordering
```

## Testing Strategy

### Manual Testing
- Create collection in draft → verify not on storefront
- Upload image → verify displays correctly
- Drag to reorder → verify order persists
- Set SEO fields → verify in page source
- Toggle stock filter → verify products shown/hidden

### Edge Cases
- Collection with 0 products
- Collection with all out-of-stock products + hide enabled = empty
- Very long collection names (truncation)
- Deleting collection with products (reassign?)

## Definition of Done

- [ ] All P0 and P1 stories complete
- [ ] Admin can create/edit collections with full control
- [ ] Status system working (draft/active/archived)
- [ ] Image upload working
- [ ] Drag-drop reordering working
- [ ] SEO fields populated on collection pages
- [ ] Stock filtering working per-collection
- [ ] Mobile-responsive admin UI
- [ ] No regressions in existing functionality
