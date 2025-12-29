# E16: Remove Product Variants - Simplify to Single Product Model

> **Status**: 📋 READY FOR IMPLEMENTATION
> **Priority**: HIGH - Blocking checkout testing
> **Goal**: Remove the productVariants table and simplify to a single-product model where all inventory data lives directly on the product

## Overview

The current architecture separates products from variants (colorways), but this adds complexity without benefit for a small yarn shop. This epic removes the variant layer entirely, moving price, stock, and weight data directly onto products.

**Why this matters**: Variant complexity is causing stock reservation issues during checkout testing. Simplifying to a direct product model will make the system more maintainable and easier to test.

---

## Current State Analysis

### Database Tables Affected

| Table | Current State | Change Needed |
|-------|---------------|---------------|
| `products` | Base info only (name, description, fiber, etc.) | Add: price, compareAtPrice, stock, weightGrams, sku, colorHex |
| `productVariants` | Stores price, stock, weightGrams, sku, colorHex | **DELETE TABLE** |
| `productImages` | Has optional `variantId` FK | Remove variantId column |
| `orderItems` | Has `variantId` FK | Remove variantId, keep denormalized fields |
| `stockReservations` | References `variantId` | Change to reference `productId` |
| `carts` | JSON items store `variantId` | Change to store `productId` |

### Files to Modify

**Database/Schema:**
- `lib/db/schema.ts` - Main schema changes
- `lib/db/stock.ts` - Stock reservation functions
- `lib/cart.ts` - Cart type definitions

**API Routes:**
- `app/api/admin/products/route.ts` - Product CRUD
- `app/api/admin/products/[id]/route.ts` - Single product CRUD
- `app/api/admin/inventory/route.ts` - Inventory listing
- `app/api/admin/inventory/bulk/route.ts` - Bulk stock updates
- `app/api/cart/route.ts` - Cart operations
- `app/api/cart/[itemId]/route.ts` - Cart item operations
- `app/api/checkout/session/route.ts` - Checkout session creation
- `app/api/webhooks/stripe/route.ts` - Order creation from webhook

**Frontend Components:**
- `app/products/[slug]/page.tsx` - Product detail server component
- `app/products/[slug]/product-client.tsx` - Product detail client component
- `components/products/variant-selector.tsx` - **DELETE FILE**
- `components/products/add-to-cart.tsx` - Simplify props
- `components/cart/cart-item.tsx` - Remove variant references
- `contexts/cart-context.tsx` - Update CartItem interface

**Admin Pages:**
- `app/admin/products/product-form.tsx` - Remove variant fields array
- `app/admin/products/[id]/page.tsx` - Simplify data loading
- `app/admin/products/page.tsx` - Update inventory display
- `app/admin/inventory/page.tsx` - Simplify to product-based
- `app/admin/inventory/inventory-table.tsx` - Remove variant grouping

---

## Implementation Plan

### US16.1: Database Schema Migration

**Goal**: Update schema to put all inventory data on products

#### Tasks

- [ ] Add new columns to `products` table:
  ```typescript
  price: real("price").notNull().default(0),
  compareAtPrice: real("compare_at_price"),
  stock: integer("stock").notNull().default(0),
  weightGrams: integer("weight_grams").notNull().default(100),
  sku: text("sku"),
  colorHex: text("color_hex"),
  ```

- [ ] Update `productImages` table:
  - Remove `variantId` column and foreign key
  - Remove `images_variant_idx` index

- [ ] Update `orderItems` table:
  - Remove `variantId` column (keep denormalized `variantName` as product color info)
  - Rename `variantName` to `colorway` for clarity

- [ ] Update `stockReservations` table:
  - Change `variantId` to `productId`
  - Update foreign key reference
  - Rename index

- [ ] Remove `productVariants` table entirely
  - Remove relations
  - Remove type exports

- [ ] Update `carts.items` JSON structure documentation
  - Change from `{ variantId, quantity }` to `{ productId, quantity }`

- [ ] Run `npm run db:generate` to create migration
- [ ] Run `npm run db:push` to apply changes

**Files**: `lib/db/schema.ts`

---

### US16.2: Update Stock Management Functions

**Goal**: Update stock reservation system to work with products

#### Tasks

- [ ] Update `getAvailableStock(productId)` in `lib/db/stock.ts`
  - Query products table for stock
  - Sum reservations by productId instead of variantId

- [ ] Update `getAvailableStockBatch(productIds)`
  - Similar changes for batch operations

- [ ] Update `createStockReservation()` and `releaseStockReservation()`
  - Use productId parameter

- [ ] Update cart type in `lib/cart.ts`
  - Change `CartItemData` interface from `variantId` to `productId`

**Files**: `lib/db/stock.ts`, `lib/cart.ts`

---

### US16.3: Update Cart API

**Goal**: Cart operations work with productId

#### Tasks

- [ ] Update `POST /api/cart` (`app/api/cart/route.ts`)
  - Accept `productId` instead of `variantId`
  - Validate product exists and is active
  - Check stock on product directly
  - Store `{ productId, quantity }` in cart items JSON

- [ ] Update cart population logic
  - Join to products instead of variants
  - Return product price, stock, weightGrams, image

- [ ] Update `PATCH/DELETE /api/cart/[itemId]` (`app/api/cart/[itemId]/route.ts`)
  - Stock validation against product.stock

- [ ] Update `generateCartItemId()` utility to use productId

**Files**: `app/api/cart/route.ts`, `app/api/cart/[itemId]/route.ts`

---

### US16.4: Update Checkout Flow

**Goal**: Checkout creates orders using product data directly

#### Tasks

- [ ] Update `POST /api/checkout/session` (`app/api/checkout/session/route.ts`)
  - Load products instead of variants
  - Create stock reservations with productId
  - Calculate shipping weight from product.weightGrams
  - Build Stripe line items from product data
  - Remove variant-specific descriptions

- [ ] Update webhook order creation (`app/api/webhooks/stripe/route.ts`)
  - Create orderItems without variantId
  - Store product name as productName, colorHex/description as colorway

- [ ] Test checkout flow end-to-end

**Files**: `app/api/checkout/session/route.ts`, `app/api/webhooks/stripe/route.ts`

---

### US16.5: Update Admin Product Management

**Goal**: Admin can create/edit products with inventory fields directly

#### Tasks

- [ ] Update `ProductForm` component (`app/admin/products/product-form.tsx`)
  - Remove `variants` useFieldArray
  - Add direct fields: price, compareAtPrice, stock, weightGrams, sku, colorHex
  - Remove variant add/remove UI
  - Simplify validation schema

- [ ] Update `POST /api/admin/products`
  - Create product with inventory fields directly
  - No variant creation

- [ ] Update `PATCH /api/admin/products/[id]`
  - Update product fields directly
  - Remove variant sync logic

- [ ] Update product listing page to show product stock directly

**Files**:
- `app/admin/products/product-form.tsx`
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- `app/admin/products/page.tsx`

---

### US16.6: Update Inventory Management

**Goal**: Inventory pages work with products directly

#### Tasks

- [ ] Update `GET /api/admin/inventory`
  - Query products table directly for stock info
  - Remove variant joins

- [ ] Update `PATCH /api/admin/inventory`
  - Update product.stock instead of variant.stock

- [ ] Update `PATCH /api/admin/inventory/bulk`
  - Bulk update product stock

- [ ] Update inventory table component
  - Remove variant grouping
  - Show product name, sku, price, stock directly

- [ ] Update inventory page
  - Simplify stats queries

**Files**:
- `app/api/admin/inventory/route.ts`
- `app/api/admin/inventory/bulk/route.ts`
- `app/admin/inventory/page.tsx`
- `app/admin/inventory/inventory-table.tsx`

---

### US16.7: Update Frontend Product Pages

**Goal**: Product display and add-to-cart work without variant selection

#### Tasks

- [ ] Delete `components/products/variant-selector.tsx`

- [ ] Update `ProductClient` component (`app/products/[slug]/product-client.tsx`)
  - Remove selectedVariantId state
  - Remove handleVariantChange
  - Display product price, stock directly
  - Pass product to AddToCart

- [ ] Update `AddToCart` component (`components/products/add-to-cart.tsx`)
  - Change prop from `variant: ProductVariant` to `product: Product`
  - Use product.price, product.stock, product.weightGrams

- [ ] Update product page server component (`app/products/[slug]/page.tsx`)
  - Remove variant fetching
  - Pass product stock to client
  - Update JSON-LD to use product price

- [ ] Update product cards in listings if they show variant info

**Files**:
- `components/products/variant-selector.tsx` (DELETE)
- `app/products/[slug]/product-client.tsx`
- `app/products/[slug]/page.tsx`
- `components/products/add-to-cart.tsx`

---

### US16.8: Update Cart Frontend

**Goal**: Cart context and display work with products

#### Tasks

- [ ] Update `CartItem` interface in `contexts/cart-context.tsx`
  ```typescript
  interface CartItem {
    id: string;           // Generated from productId
    productId: number;
    productName: string;
    productSlug: string;
    colorway?: string;    // Optional product colorway info
    price: number;
    quantity: number;
    stock: number;
    image?: string;
    weightGrams: number;
  }
  ```

- [ ] Update `addItem` to use productId
- [ ] Update cart refresh/sync logic

- [ ] Update `CartItem` component (`components/cart/cart-item.tsx`)
  - Remove variantName display (or show colorway if present)
  - Use product data directly

- [ ] Update checkout page order summary

**Files**:
- `contexts/cart-context.tsx`
- `components/cart/cart-item.tsx`
- `app/checkout/page.tsx`

---

### US16.9: Data Migration (One-time)

**Goal**: Migrate existing variant data to products

#### Tasks

- [ ] Create migration script to:
  1. For each product with variants:
     - Copy first variant's price, stock, weightGrams, sku, colorHex to product
     - Sum all variant stock into product stock (or use first variant)
  2. Update any existing cart items from variantId to productId
  3. Clear stockReservations table (test mode)
  4. Delete variant data

- [ ] Run migration on local database
- [ ] Verify products have correct data

**Note**: Since we're in test mode, we can safely clear carts and reservations.

---

### US16.10: Testing

**Goal**: Verify all functionality works after migration

#### Test Cases

- [ ] **Product Creation**: Admin can create product with price, stock, weight
- [ ] **Product Edit**: Admin can update product inventory fields
- [ ] **Inventory Page**: Shows products with stock, allows bulk edit
- [ ] **Product Display**: Shop shows product with price, stock status
- [ ] **Add to Cart**: Can add product to cart (no variant selection)
- [ ] **Cart Display**: Shows product name, price, quantity correctly
- [ ] **Checkout Flow**: Can proceed through checkout with product
- [ ] **Stock Reservation**: Stock is reserved during checkout
- [ ] **Order Creation**: Order created with product info after payment
- [ ] **Shipping Zones**: Weight-based shipping still calculates correctly

---

## Verification Checklist

Before marking complete:

- [ ] No references to `variantId` in codebase (except migrations/history)
- [ ] No references to `productVariants` table
- [ ] `variant-selector.tsx` deleted
- [ ] All tests pass
- [ ] Can complete full purchase flow
- [ ] Admin can manage product inventory
- [ ] Shipping calculates correctly by product weight

---

## Rollback Plan

If issues arise:
1. Git revert to pre-migration commit
2. Restore database from backup (or recreate from Shopify import)
3. Variant code will still work

---

## Notes

- This is a breaking change for any existing cart data
- Clear all carts and reservations as part of migration
- Keep `variantName`/`colorway` field on orderItems for future flexibility
- Consider adding `colorway` text field to products for display purposes
