# Admin Improvements Plan

## Overview
Make the admin simpler than Shopify by focusing on:
1. Homepage redesign with editable background + centered carousel
2. Image upload functionality
3. Editable product taxonomies (weight types, tags)
4. Clear admin pages for managing these areas

---

## Phase 1: Image Upload Infrastructure

Before we can edit homepage backgrounds or product images, we need upload capability.

### 1.1 Install Vercel Blob
```bash
npm install @vercel/blob
```

### 1.2 Create Upload API Route
**File**: `app/api/upload/route.ts`
- Accept multipart form data
- Upload to Vercel Blob storage
- Return public URL
- Support image types: jpg, png, webp, gif
- Max file size: 5MB

### 1.3 Create Reusable Upload Component
**File**: `components/admin/image-upload.tsx`
- Drag-and-drop zone
- Click to browse
- Preview before upload
- Progress indicator
- Delete button for existing images

---

## Phase 2: Homepage Redesign

### Current State
- Full-viewport HeroCarousel with slides from `heroSlides` table
- Each slide has: title, subtitle, buttonText, buttonLink, imageUrl, position, active

### New Design: Editable Background + Centered Carousel

#### 2.1 Database Changes
**Add to `siteSettings` table** (key-value pairs):
- `homepage_background_image` - URL of background image
- `homepage_background_overlay` - Overlay color/opacity (e.g., "rgba(0,0,0,0.3)")
- `homepage_background_blur` - Blur amount in px

**Modify `heroSlides` table** - already supports what we need:
- `title` - Main text
- `subtitle` - Supporting text
- `imageUrl` - Product/collection image for slide
- `buttonText` / `buttonLink` - CTA

#### 2.2 New Homepage Layout
```
┌─────────────────────────────────────────────┐
│  [Editable Background Image + Overlay]      │
│                                             │
│     ┌─────────────────────────────────┐     │
│     │                                 │     │
│     │   [Centered Carousel]           │     │
│     │   - Product images              │     │
│     │   - Title text overlay          │     │
│     │   - CTA button                  │     │
│     │                                 │     │
│     └─────────────────────────────────┘     │
│                                             │
│            • • • (indicators)               │
│                                             │
└─────────────────────────────────────────────┘
```

#### 2.3 Component Changes
**File**: `components/home/hero-carousel.tsx`
- Separate background layer (fixed, full-viewport)
- Centered content container (max-width, centered)
- Carousel for featured items
- Text overlays with configurable positioning
- Smooth transitions between slides

#### 2.4 Admin Settings Page Enhancement
**File**: `app/admin/settings/homepage/page.tsx`
- Background image upload with live preview
- Overlay color picker
- Carousel slide management (existing, enhance with image upload)
- Drag-and-drop reorder slides
- Preview button to see changes

---

## Phase 3: Product Taxonomies

### Current State
- Weight types hardcoded in product-form.tsx: Laceweight, 4ply, DK, Aran, Chunky, Super Chunky
- No tags system
- Categories managed but underutilized

### 3.1 New Database Tables

**`weightTypes` table**:
```typescript
weightTypes: {
  id: integer PRIMARY KEY,
  name: text NOT NULL,        // "DK", "4ply"
  description: text,          // "Double Knitting weight"
  sortOrder: integer,         // For display ordering
  active: integer DEFAULT 1,
  createdAt: text,
  updatedAt: text
}
```

**`productTags` table**:
```typescript
productTags: {
  id: integer PRIMARY KEY,
  name: text NOT NULL UNIQUE, // "hand-dyed", "limited-edition"
  slug: text NOT NULL UNIQUE,
  color: text,                // Badge color in admin
  createdAt: text
}
```

**`productTagAssignments` table** (many-to-many):
```typescript
productTagAssignments: {
  productId: integer REFERENCES products(id),
  tagId: integer REFERENCES productTags(id),
  PRIMARY KEY (productId, tagId)
}
```

### 3.2 Admin Pages for Taxonomies

**File**: `app/admin/settings/taxonomies/page.tsx`
- Tab-based UI: Weight Types | Tags | Categories
- Each tab shows list with inline editing
- Add/edit/delete functionality
- Drag-and-drop reorder for weight types

**Weight Types Tab**:
- Table: Name, Description, Sort Order, Active toggle
- Add new weight type button
- Edit inline or modal

**Tags Tab**:
- Color-coded tag chips
- Add tag with color picker
- Delete with confirmation (shows affected products count)

### 3.3 Update Product Form
**File**: `app/admin/products/product-form.tsx`
- Fetch weight types from API instead of hardcoded list
- Add multi-select tag picker
- Tags displayed as removable badges

---

## Phase 4: Drag-and-Drop Reordering

### 4.1 Install DnD Library
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

### 4.2 Apply to:
- Homepage carousel slides
- Collection products order
- Weight types sort order
- Product images order

### 4.3 Create Reusable Sortable Component
**File**: `components/admin/sortable-list.tsx`
- Generic wrapper for any sortable list
- Drag handle UI
- Drop animation
- Keyboard accessibility

---

## Implementation Order

1. **Image Upload** (foundation for everything else)
   - Vercel Blob setup
   - Upload API route
   - Reusable upload component

2. **Homepage Background**
   - Add settings to siteSettings
   - Update homepage component
   - Admin settings UI for background

3. **Homepage Carousel Redesign**
   - Centered carousel layout
   - Text overlay positioning
   - Slide management with image upload

4. **Taxonomies**
   - Database migrations
   - Admin taxonomy page
   - Update product form

5. **Drag-and-Drop**
   - Install dnd-kit
   - Create sortable component
   - Apply to slides, products, taxonomies

---

## Files to Create/Modify

### New Files
- `app/api/upload/route.ts`
- `components/admin/image-upload.tsx`
- `components/admin/sortable-list.tsx`
- `app/admin/settings/taxonomies/page.tsx`
- `lib/db/schema.ts` (add weightTypes, productTags tables)

### Modified Files
- `components/home/hero-carousel.tsx`
- `app/admin/settings/homepage/page.tsx`
- `app/admin/products/product-form.tsx`
- `app/page.tsx`

---

## Estimated Scope

| Phase | Components | Complexity |
|-------|------------|------------|
| Image Upload | 3 files | Medium |
| Homepage Background | 4 files | Medium |
| Carousel Redesign | 3 files | Medium-High |
| Taxonomies | 5 files | Medium |
| Drag-and-Drop | 4 files | Medium |

Total: ~15-20 files, focused incremental changes
