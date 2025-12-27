# Admin Experience Improvement Plan

## Current State Summary

The admin interface at `/admin` is functional with:
- Dashboard with basic stats (product/variant counts, low stock)
- Product CRUD with variants and images
- Orders list with filtering
- Inventory management
- Settings (homepage, shipping, legal pages)

**What's Missing:** Revenue metrics, order fulfillment workflow, bulk operations, activity tracking, notifications.

---

## Phase 1: Dashboard Enhancements

### 1.1 Sales & Revenue Stats

**Current:** Shows product counts only
**Improvement:** Add revenue-focused metrics

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Today's Revenue │ This Week       │ This Month      │ Pending Orders  │
│ £127.50         │ £892.00         │ £3,241.00       │ 5 orders        │
│ ↑12% vs yest    │ ↑8% vs last wk  │ 23 orders       │ £456.00 value   │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

**Implementation:**
- Add aggregate queries to `getStats()` in `app/admin/page.tsx`
- Sum `orders.total` where `paymentStatus = 'paid'`
- Calculate period comparisons

### 1.2 Recent Activity Feed

**Current:** Shows recent products only
**Improvement:** Show recent orders and activity

```
Recent Activity
───────────────────────────────────────
🛒 Order #HD-1047 placed           2m ago
   Jane Smith · £45.00 · 2 items

📦 Order #HD-1045 shipped          1h ago
   Sent via Royal Mail

⚠️ Low stock alert                 3h ago
   Madder Red DK - 2 remaining

✏️ Product updated                 5h ago
   Weld Yellow 4ply - price changed
```

**Implementation:**
- Create `activityLog` table or derive from existing data
- Query recent orders, stock changes, product updates
- Display chronologically with icons

### 1.3 Quick Stats Sparklines

Add mini trend charts showing 7-day patterns for:
- Orders per day
- Revenue per day
- Pageviews (if analytics added)

---

## Phase 2: Order Fulfillment Workflow

### 2.1 Order Status Actions

**Current:** View-only order details
**Improvement:** Inline status updates with fulfillment actions

```
Order #HD-1047  ────────────────────────────────────
Status: Processing

[Mark as Shipped ▾]  [Print Packing Slip]  [Cancel Order]

Shipping Details:
┌─────────────────────────────────────────────────┐
│ Carrier:    [Royal Mail ▾]                      │
│ Tracking:   [________________________]          │
│ Notes:      [________________________]          │
│                                                 │
│              [Update & Notify Customer]         │
└─────────────────────────────────────────────────┘
```

**Implementation:**
- Add `PUT /api/admin/orders/[id]` for status updates
- Add `trackingNumber`, `carrier`, `shippedAt` to orders schema
- Trigger email notification on status change (via Resend)

### 2.2 Order Detail Improvements

Add to order detail page (`app/admin/orders/[id]/page.tsx`):
- Customer order history (repeat customer indicator)
- Shipping address with map link
- Order timeline (placed → paid → shipped → delivered)
- Refund/cancel actions with reason tracking

### 2.3 Bulk Order Actions

On orders list page, add:
- Checkbox selection column
- "Mark Selected as Shipped" bulk action
- "Export Selected (CSV)" for accounting
- "Print All Packing Slips" batch print

---

## Phase 3: Product Management

### 3.1 Bulk Actions on Product Table

**Current:** Individual actions via dropdown only
**Improvement:** Multi-select with bulk operations

```
┌──┬────────────────────────────────────────────────
│☑ │ Select All (15 products)
├──┼────────────────────────────────────────────────
│  │ [Set Status ▾] [Set Category ▾] [Delete] [Export]
├──┼────────────────────────────────────────────────
│☑ │ Madder Red DK        Active    12 in stock  £28.00
│☑ │ Weld Yellow 4ply     Active     8 in stock  £24.00
│☐ │ Indigo Blues Aran    Draft      0 in stock  £32.00
```

**Implementation:**
- Add selection state to `ProductsTable`
- Create `PATCH /api/admin/products/bulk` endpoint
- Handle status changes, category assignment, deletion

### 3.2 Product Form Improvements

- **Image reordering:** Drag-and-drop to set display order
- **Variant templates:** Save/load common variant structures
- **Preview button:** Open product page in new tab
- **Duplicate variant:** Copy existing variant as starting point
- **SEO preview:** Show Google search result preview

### 3.3 Product Import Enhancements

Current Shopify import exists. Add:
- **CSV import:** Upload spreadsheet for bulk product creation
- **Validation preview:** Show what will be created before committing
- **Error handling:** Display specific row errors

---

## Phase 4: Inventory Management

### 4.1 Bulk Stock Updates

**Current:** Edit stock one variant at a time
**Improvement:** Spreadsheet-style inline editing

```
Inventory  ─────────────────────────────────────────────
           [Save All Changes]  Last saved: 2 min ago

Product          Variant         SKU          Stock  ▾
──────────────────────────────────────────────────────
Madder Red DK    Natural White   MR-DK-NW     [12]  ±
                 Warm Grey       MR-DK-WG     [ 8]  ±
                 Charcoal        MR-DK-CH     [ 3]  ⚠
Weld Yellow      Natural White   WY-4P-NW     [15]  ±
```

**Implementation:**
- Convert table to form with input fields
- Debounce saves (auto-save after 2 seconds idle)
- Highlight unsaved changes
- Batch update API endpoint

### 4.2 Stock Adjustment Log

Track all stock changes with reason:
- Sale (automatic deduction)
- Manual adjustment (with note)
- Return (restock)
- Damaged/written off

### 4.3 Low Stock Alerts

- Email notification when variant drops below threshold
- Configurable threshold per product (default: 5)
- Dashboard widget showing items needing reorder

---

## Phase 5: Settings & Configuration

### 5.1 Settings Reorganization

**Current structure:**
```
Settings → Homepage | About | Shipping | Taxonomies | Legal
```

**Improved structure:**
```
Settings
├── Store
│   ├── General (store name, email, timezone)
│   ├── Checkout (guest checkout, terms acceptance)
│   └── Notifications (order emails, low stock alerts)
├── Content
│   ├── Homepage
│   ├── About Page
│   └── Legal Policies
├── Shipping
│   ├── Zones & Rates
│   └── Carriers
└── Catalog
    ├── Taxonomies
    └── Product Defaults
```

### 5.2 Store Configuration

Add missing settings:
- **Store name & details** (used in emails, receipts)
- **Contact email** (for order notifications)
- **Currency settings** (display format)
- **Tax configuration** (if needed)

### 5.3 Email Templates

- Preview order confirmation email
- Preview shipping notification email
- Basic template customization (logo, colors)

---

## Phase 6: UX Improvements

### 6.1 Global Search (Cmd+K)

Quick search across all admin sections:
```
┌─────────────────────────────────────────────────┐
│ 🔍 Search orders, products, customers...        │
├─────────────────────────────────────────────────┤
│ Orders                                          │
│   #HD-1047 · Jane Smith · £45.00                │
│   #HD-1046 · Bob Wilson · £28.00                │
│ Products                                        │
│   Madder Red DK                                 │
│ Pages                                           │
│   → Settings > Shipping                         │
└─────────────────────────────────────────────────┘
```

### 6.2 Toast Notifications

Consistent feedback for actions:
- "Product saved successfully"
- "Order marked as shipped"
- "3 products archived"

Already using shadcn toast - ensure consistent usage.

### 6.3 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+K` | Global search |
| `Cmd+N` | New product (on products page) |
| `Cmd+S` | Save current form |
| `Esc` | Close modal/dialog |
| `?` | Show shortcuts help |

### 6.4 Mobile Admin Improvements

Current sidebar collapses - additional improvements:
- Bottom navigation bar on mobile
- Swipe gestures for common actions
- Optimized table views (card layout on mobile)

### 6.5 Loading States

Add skeleton loaders for:
- Dashboard stats
- Product/order tables
- Form submissions

---

## Phase 7: Analytics & Reporting

### 7.1 Sales Reports

```
Sales Report ─────────────────────────────────────
Period: [This Month ▾]  Compare: [Last Month ▾]

Revenue        £3,241.00  ↑ 12%
Orders              23    ↑ 8%
Avg Order       £140.91   ↑ 4%
Conversion         2.3%   → 0%

[Download CSV]  [Download PDF]
```

### 7.2 Product Performance

- Best sellers (by units and revenue)
- Slow movers (no sales in 30 days)
- Stock turnover rate

### 7.3 Customer Insights

- New vs returning customers
- Geographic breakdown
- Average order value by customer

---

## Implementation Priority

### High Priority (Do First)
1. **Dashboard revenue stats** - Immediate business value
2. **Order fulfillment actions** - Core operational need
3. **Bulk stock updates** - Time saver for admin

### Medium Priority
4. Product bulk actions
5. Global search (Cmd+K)
6. Order timeline & status emails
7. Settings reorganization

### Lower Priority (Nice to Have)
8. Analytics/reporting
9. Keyboard shortcuts
10. Email template customization
11. Stock adjustment logging

---

## Database Changes Required

```sql
-- Orders: add fulfillment fields
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
ALTER TABLE orders ADD COLUMN carrier TEXT;
ALTER TABLE orders ADD COLUMN shipped_at TEXT;
ALTER TABLE orders ADD COLUMN notes TEXT;

-- Activity log (optional)
CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL,  -- 'order', 'product', 'stock', 'setting'
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  entity_id INTEGER,
  entity_name TEXT,
  details TEXT,  -- JSON with change details
  user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Stock adjustments
CREATE TABLE stock_adjustments (
  id INTEGER PRIMARY KEY,
  variant_id INTEGER NOT NULL,
  quantity_change INTEGER NOT NULL,
  reason TEXT NOT NULL,  -- 'sale', 'manual', 'return', 'damaged'
  note TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);
```

---

## Files to Create/Modify

### New Files
- `app/admin/orders/[id]/fulfillment-form.tsx`
- `app/admin/components/global-search.tsx`
- `app/admin/components/activity-feed.tsx`
- `app/admin/analytics/page.tsx`
- `app/api/admin/orders/[id]/fulfill/route.ts`
- `app/api/admin/products/bulk/route.ts`
- `app/api/admin/inventory/bulk/route.ts`

### Modified Files
- `app/admin/page.tsx` - Dashboard enhancements
- `app/admin/layout.tsx` - Add global search trigger
- `app/admin/orders/[id]/page.tsx` - Fulfillment actions
- `app/admin/products/products-table.tsx` - Bulk selection
- `app/admin/inventory/inventory-table.tsx` - Inline editing
- `lib/db/schema.ts` - New tables/columns

---

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Dashboard | 1-2 days | None |
| Phase 2: Order Fulfillment | 2-3 days | Email setup (Resend) |
| Phase 3: Product Bulk Actions | 1-2 days | None |
| Phase 4: Inventory | 1-2 days | Schema changes |
| Phase 5: Settings | 1 day | None |
| Phase 6: UX | 2-3 days | None |
| Phase 7: Analytics | 2-3 days | Sufficient order data |

**Total: 10-16 days of development**

---

## Next Steps

1. Review and prioritize phases
2. Add schema changes for order fulfillment
3. Start with dashboard revenue stats
4. Implement order status update flow
5. Add bulk inventory editing
