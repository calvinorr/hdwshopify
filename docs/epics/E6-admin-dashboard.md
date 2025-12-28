# E6: Admin Dashboard ✅ MOSTLY COMPLETE

> **Status**: MOSTLY COMPLETE
> **Remaining**: Bulk actions

**Priority**: P1
**Complexity**: High
**Dependencies**: E1-E4

## Overview

Build an admin dashboard for store management including product CRUD, order fulfillment, inventory tracking, and basic analytics. This replaces Shopify admin functionality.

## Business Value

- Self-service product management without developer
- Efficient order fulfillment workflow
- Inventory visibility prevents overselling
- Business insights for decision making

## Access Control

Admin access is controlled via Clerk organizations or a simple email allowlist. No public registration for admin accounts.

## User Stories

### US6.1: Dashboard Overview
**As an** admin
**I want to** see a summary dashboard
**So that** I understand store status at a glance

**Acceptance Criteria:**
- [x] Today's orders count and revenue
- [x] Orders pending fulfillment (with urgency indicators)
- [x] Low stock alerts (with specific items)
- [x] Recent orders list (pending orders needing attention)
- [ ] 7-day revenue chart (stretch - deferred)

### US6.2: Product Management
**As an** admin
**I want to** manage products
**So that** I can update the catalog

**Acceptance Criteria:**
- [ ] List all products with search/filter
- [ ] Create new product
- [ ] Edit product details
- [ ] Manage variants (add/edit/remove)
- [ ] Upload/manage images
- [ ] Set product status (draft/active/archived)
- [ ] Bulk actions (archive, activate)

### US6.3: Variant Management
**As an** admin
**I want to** manage product variants
**So that** I can offer different colorways

**Acceptance Criteria:**
- [ ] Add variant to product
- [ ] Set variant name, SKU, price
- [ ] Set variant stock level
- [ ] Set variant weight (for shipping)
- [ ] Reorder variants
- [ ] Delete variant

### US6.4: Image Management
**As an** admin
**I want to** upload product images
**So that** customers can see the products

**Acceptance Criteria:**
- [x] Drag-and-drop image upload
- [x] Multiple images per product
- [ ] Assign images to specific variants
- [x] Reorder images (drag-drop with position indicators)
- [ ] Set alt text
- [x] Delete images
- [ ] Image optimization on upload

### US6.5: Order Management
**As an** admin
**I want to** view and manage orders
**So that** I can fulfill customer purchases

**Acceptance Criteria:**
- [ ] List orders with status filter
- [ ] Search by order number or email
- [ ] View order details
- [ ] Update order status
- [ ] Add tracking number
- [ ] Add internal notes
- [ ] Print packing slip

### US6.6: Inventory Management
**As an** admin
**I want to** track inventory levels
**So that** I don't oversell

**Acceptance Criteria:**
- [ ] View all variants with stock levels
- [ ] Quick stock adjustment (+/-)
- [ ] Low stock threshold alerts
- [ ] Stock history log (stretch)
- [ ] Bulk stock update via CSV

### US6.7: Discount Code Management
**As an** admin
**I want to** create discount codes
**So that** I can run promotions

**Acceptance Criteria:**
- [ ] Create percentage or fixed discount
- [ ] Set minimum order value
- [ ] Set usage limits
- [ ] Set expiry date
- [ ] Activate/deactivate codes
- [ ] View usage statistics

### US6.8: Category Management
**As an** admin
**I want to** manage categories
**So that** products are organized

**Acceptance Criteria:**
- [ ] List categories
- [ ] Create/edit/delete categories
- [ ] Nest categories (parent/child)
- [ ] Reorder categories
- [ ] Assign products to categories

### US6.9: Shipping Configuration
**As an** admin
**I want to** configure shipping rates
**So that** customers see correct costs

**Acceptance Criteria:**
- [ ] Manage shipping zones
- [ ] Add/edit rates per zone
- [ ] Set weight thresholds
- [ ] Configure free shipping threshold

## Technical Approach

### Route Structure

```
app/
├── admin/
│   ├── layout.tsx              # Admin layout with sidebar
│   ├── page.tsx                # Dashboard overview
│   ├── products/
│   │   ├── page.tsx            # Product list
│   │   ├── new/
│   │   │   └── page.tsx        # Create product
│   │   └── [id]/
│   │       └── page.tsx        # Edit product
│   ├── orders/
│   │   ├── page.tsx            # Order list
│   │   └── [id]/
│   │       └── page.tsx        # Order detail
│   ├── inventory/
│   │   └── page.tsx            # Inventory overview
│   ├── discounts/
│   │   ├── page.tsx            # Discount list
│   │   └── new/
│   │       └── page.tsx        # Create discount
│   ├── categories/
│   │   └── page.tsx            # Category management
│   └── settings/
│       ├── page.tsx            # General settings
│       └── shipping/
│           └── page.tsx        # Shipping config
```

### Access Control

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);

const ADMIN_EMAILS = [
  'owner@herbariumdyeworks.com',
  // Add admin emails
];

export default clerkMiddleware(async (auth, req) => {
  if (isAdminRoute(req)) {
    const { userId } = auth();

    if (!userId) {
      return Response.redirect(new URL('/sign-in', req.url));
    }

    // Check if user is admin
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;

    if (!ADMIN_EMAILS.includes(email)) {
      return Response.redirect(new URL('/', req.url));
    }
  }
});
```

### API Routes

```
# Products
GET /api/admin/products
POST /api/admin/products
GET /api/admin/products/[id]
PATCH /api/admin/products/[id]
DELETE /api/admin/products/[id]

# Variants
POST /api/admin/products/[id]/variants
PATCH /api/admin/variants/[id]
DELETE /api/admin/variants/[id]

# Images
POST /api/admin/products/[id]/images (multipart)
PATCH /api/admin/images/[id]
DELETE /api/admin/images/[id]

# Orders
GET /api/admin/orders
GET /api/admin/orders/[id]
PATCH /api/admin/orders/[id]
POST /api/admin/orders/[id]/fulfill

# Inventory
PATCH /api/admin/inventory/[variantId]
POST /api/admin/inventory/bulk

# Discounts
GET /api/admin/discounts
POST /api/admin/discounts
PATCH /api/admin/discounts/[id]
DELETE /api/admin/discounts/[id]

# Categories
GET /api/admin/categories
POST /api/admin/categories
PATCH /api/admin/categories/[id]
DELETE /api/admin/categories/[id]

# Shipping
GET /api/admin/shipping/zones
POST /api/admin/shipping/zones
PATCH /api/admin/shipping/zones/[id]
DELETE /api/admin/shipping/zones/[id]
POST /api/admin/shipping/zones/[id]/rates
```

### Components

```
components/
├── admin/
│   ├── layout/
│   │   ├── admin-sidebar.tsx
│   │   ├── admin-header.tsx
│   │   └── admin-nav.tsx
│   ├── dashboard/
│   │   ├── stats-card.tsx
│   │   ├── recent-orders.tsx
│   │   └── low-stock-alert.tsx
│   ├── products/
│   │   ├── product-form.tsx
│   │   ├── product-list.tsx
│   │   ├── variant-form.tsx
│   │   ├── variant-list.tsx
│   │   ├── image-upload.tsx
│   │   └── image-gallery.tsx
│   ├── orders/
│   │   ├── order-list.tsx
│   │   ├── order-detail.tsx
│   │   ├── order-timeline.tsx
│   │   ├── fulfillment-form.tsx
│   │   └── packing-slip.tsx
│   ├── inventory/
│   │   ├── inventory-table.tsx
│   │   └── stock-adjuster.tsx
│   ├── discounts/
│   │   ├── discount-form.tsx
│   │   └── discount-list.tsx
│   └── settings/
│       ├── shipping-zones.tsx
│       └── shipping-rates.tsx
```

### Image Upload

```typescript
// Using Vercel Blob
import { put, del } from '@vercel/blob';

async function uploadProductImage(file: File, productId: number) {
  // Generate unique filename
  const filename = `products/${productId}/${Date.now()}-${file.name}`;

  const blob = await put(filename, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  // Save to database
  const [image] = await db.insert(productImages).values({
    productId,
    url: blob.url,
    alt: file.name,
    position: await getNextImagePosition(productId),
  }).returning();

  return image;
}

async function deleteProductImage(imageId: number) {
  const image = await db.query.productImages.findFirst({
    where: eq(productImages.id, imageId),
  });

  if (image) {
    // Delete from Vercel Blob
    await del(image.url);
    // Delete from database
    await db.delete(productImages).where(eq(productImages.id, imageId));
  }
}
```

### Product Form Schema

```typescript
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  basePrice: z.number().min(0, 'Price must be positive'),
  compareAtPrice: z.number().optional(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean().default(false),
  fiberContent: z.string().optional(),
  weight: z.string().optional(),
  yardage: z.string().optional(),
  careInstructions: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

const variantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().optional(),
  price: z.number().min(0),
  compareAtPrice: z.number().optional(),
  stock: z.number().int().min(0),
  weightGrams: z.number().int().min(0).default(100),
});
```

### Dashboard Stats

```typescript
async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayOrders, pendingOrders, lowStock, revenue] = await Promise.all([
    // Today's orders
    db.select({ count: sql`count(*)` })
      .from(orders)
      .where(gte(orders.createdAt, today.toISOString())),

    // Pending fulfillment
    db.select({ count: sql`count(*)` })
      .from(orders)
      .where(eq(orders.status, 'pending')),

    // Low stock variants (< 5)
    db.select({ count: sql`count(*)` })
      .from(productVariants)
      .where(lt(productVariants.stock, 5)),

    // Today's revenue
    db.select({ total: sql`sum(total)` })
      .from(orders)
      .where(and(
        gte(orders.createdAt, today.toISOString()),
        eq(orders.paymentStatus, 'paid')
      )),
  ]);

  return {
    todayOrders: todayOrders[0].count,
    pendingOrders: pendingOrders[0].count,
    lowStockCount: lowStock[0].count,
    todayRevenue: revenue[0].total || 0,
  };
}
```

## UI Design Principles

- Clean, functional interface (no unnecessary decoration)
- Data-dense tables for lists
- Quick actions accessible
- Mobile-responsive for order checking on phone
- Keyboard shortcuts for power users (stretch)

## Testing Strategy

### Unit Tests
- Form validation schemas
- Stats calculations
- Slug generation

### Integration Tests
- CRUD operations for all entities
- Image upload/delete
- Access control enforcement

### E2E Tests
- Create product with variants and images
- Fulfill order with tracking
- Adjust inventory
- Create and apply discount

## Environment Variables

```bash
# Vercel Blob (for images)
BLOB_READ_WRITE_TOKEN=vercel_blob_...

# Admin access
ADMIN_EMAILS=owner@herbariumdyeworks.com,admin@herbariumdyeworks.com
```

## Rollout Plan

1. **Dev**: Build all admin functionality
2. **Staging**: Test with real product data
3. **Production**: Enable for admin users only

## Open Questions

- [ ] Image hosting: Vercel Blob or Cloudinary?
- [ ] Bulk operations: import/export via CSV?
- [ ] Analytics depth: basic stats or integrate with Plausible/PostHog?

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Admin access control working
- [ ] All CRUD operations functional
- [ ] Image upload/management working
- [ ] Mobile-responsive admin UI
- [ ] Code reviewed and merged
