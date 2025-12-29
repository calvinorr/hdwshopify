# E16: Remove Product Variants - Simplify to Single Product Model

> **Status**: ✅ COMPLETE
> **Priority**: HIGH - Blocking checkout testing
> **Completed**: 2025-12-29
> **Goal**: Remove the productVariants table and simplify to a single-product model where all inventory data lives directly on the product

## Overview

The current architecture separates products from variants (colorways), but this adds complexity without benefit for a small yarn shop. This epic removes the variant layer entirely, moving price, stock, and weight data directly onto products.

**Why this matters**: Variant complexity was causing stock reservation issues during checkout testing. Simplifying to a direct product model makes the system more maintainable and easier to test.

---

## Summary of Changes

### Schema Changes
- Removed `productVariants` table entirely
- Added fields to `products`: `price`, `compareAtPrice`, `stock`, `weightGrams`, `sku`, `colorHex`
- Removed `variantId` from `productImages` table
- Updated `stockReservations` to use `productId` instead of `variantId`
- Updated `orderItems` to use `productId` and `colorway` instead of `variantId` and `variantName`

### Files Deleted
- `components/products/variant-selector.tsx`
- `lib/shopify/migrate.ts`

### Major Refactors
- `contexts/cart-context.tsx` - CartItem now uses productId instead of variantId
- `components/products/add-to-cart.tsx` - Works with product directly
- `components/products/product-card.tsx` - Uses product.stock and product.price
- `app/admin/products/product-form.tsx` - Direct product fields instead of variant array
- `app/admin/inventory/inventory-table.tsx` - Products instead of variants

---

## Implementation History

### US16.1: Database Schema Migration ✅
**Completed**: 2025-12-29

- [x] Added new columns to `products` table (price, stock, weightGrams, sku, colorHex)
- [x] Removed `variantId` from `productImages` table
- [x] Updated `orderItems` to use `productId` and `colorway`
- [x] Updated `stockReservations` to use `productId`
- [x] Removed `productVariants` table entirely

---

### US16.2: Update Stock Management Functions ✅
**Completed**: 2025-12-29

- [x] Updated `getAvailableStock(productId)` in `lib/db/stock.ts`
- [x] Updated `getAvailableStockBatch(productIds)`
- [x] Updated stock reservation functions to use productId

---

### US16.3: Update Cart API ✅
**Completed**: 2025-12-29

- [x] Updated `POST /api/cart` to accept productId
- [x] Updated cart population logic
- [x] Updated `PATCH/DELETE /api/cart/[itemId]`

---

### US16.4: Update Checkout Flow ✅
**Completed**: 2025-12-29

- [x] Updated `POST /api/checkout/session`
- [x] Updated webhook order creation

---

### US16.5: Update Admin Product Management ✅
**Completed**: 2025-12-29

- [x] Updated `ProductForm` component with direct inventory fields
- [x] Updated product API routes
- [x] Updated product listing page

---

### US16.6: Update Inventory Management ✅
**Completed**: 2025-12-29

- [x] Updated `GET /api/admin/inventory`
- [x] Updated inventory table component
- [x] Updated bulk operations

---

### US16.7: Update Frontend Product Pages ✅
**Completed**: 2025-12-29

- [x] Deleted `components/products/variant-selector.tsx`
- [x] Updated `ProductClient` component
- [x] Updated `AddToCart` component
- [x] Updated product page server component
- [x] Updated product cards

---

### US16.8: Update Cart Frontend ✅
**Completed**: 2025-12-29

- [x] Updated `CartItem` interface to use productId and colorway
- [x] Updated `addItem` to use productId
- [x] Updated cart components
- [x] Updated checkout page

---

### US16.9-10: Additional Updates ✅
**Completed**: 2025-12-29

- [x] Updated Shopify migration scripts
- [x] Updated validation scripts
- [x] Updated export/backup scripts
- [x] Removed unused files
- [x] Build passes

---

## Verification Checklist

- [x] No references to `variantId` in active code
- [x] No references to `productVariants` table
- [x] `variant-selector.tsx` deleted
- [x] Build passes without errors
- [x] All variant references changed to product or colorway

---

## Next Steps

1. Test full purchase flow end-to-end
2. Run E2E tests with `/test` command
3. Deploy and verify on staging
