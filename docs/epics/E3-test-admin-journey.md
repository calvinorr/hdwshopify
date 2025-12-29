# E3: Test Admin Journey

> **Status**: IN PROGRESS (S3.1-S3.3 tested)
> **Goal**: Walk through everything your wife would do as a shop owner. Document what breaks.
> **Sessions**: 1-2
> **Depends on**: E1 (deployed to test URL)

---

## Overview

Pretend you're your wife running the shop. Add a new product. Edit a collection. Process an order. This tests the workflows she'll use daily.

**Test on**: `herbarium-dyeworks.warmwetcircles.com/admin`

---

## Stories

### S3.1: Dashboard Review ✅
**Goal**: Does the admin dashboard give a clear picture?

- [x] Admin dashboard loads
- [x] Shows today's stats (orders, revenue)
- [x] Shows pending orders that need attention
- [x] Shows low stock alerts
- [x] Can click through to orders from dashboard
- [x] Navigation sidebar works

**Log issues to**: `docs/ISSUES.md`

**Done when**: Dashboard gives clear "what needs doing today" view.

---

### S3.2: Product Management (partial)
**Goal**: Can she add and edit products easily?

**Create a new product:**
- [x] Go to Products → New
- [x] Fill in name, slug auto-generates?
- [x] Add description
- [x] Set price, stock, weight
- [x] Select fiber content, yarn weight (⚠️ weight dropdown empty - needs taxonomies)
- [ ] Upload images (test with 2-3 images) - skipped (requires file picker)
- [ ] Reorder images by dragging - skipped
- [ ] Delete an image - skipped
- [ ] Add tags - not tested
- [x] Set to "Active" status
- [x] Save product
- [x] Product appears on frontend? (✅ after bug fix for products without images)

**Edit existing product:**
- [ ] Find a product in the list
- [ ] Edit some fields
- [ ] Save changes
- [ ] Changes reflected on frontend?

**Bug Fixed**: Product detail page 500 error for products without images (RESOLVED)

**Time check**: How long did creating a product take? Target is < 5 minutes.

**Log issues to**: `docs/ISSUES.md`

**Done when**: Can create and edit products smoothly.

---

### S3.3: Collection Management (partial)
**Goal**: Can she organize products into collections?

- [x] View collections list
- [ ] Reorder collections by dragging - not tested
- [ ] Edit a collection (name, description, image) - not fully tested
- [x] Add/remove products from a collection
- [x] Create a new collection
- [ ] Changes reflected on frontend? (⚠️ 500 error on new collections - see ISSUES.md)

**Issue Found**: New collections show 500 error on production (works locally) - logged to ISSUES.md

**Log issues to**: `docs/ISSUES.md`

**Done when**: Collections are easy to manage.

---

### S3.4: Order Processing
**Goal**: Can she fulfill orders efficiently?

**Process the test order from E2:**
- [ ] Find the order in Orders list
- [ ] Open order detail
- [ ] View customer info, items, totals
- [ ] Change status to "Processing"
- [ ] Add tracking number
- [ ] Mark as "Shipped"
- [ ] Print packing slip
- [ ] Add an internal note
- [ ] Check order events/timeline shows history

**Log issues to**: `docs/ISSUES.md`

**Done when**: Order fulfillment workflow is clear and works.

---

### S3.5: Inventory Check
**Goal**: Can she see what's in stock?

- [ ] Go to Inventory page
- [ ] See stock levels for all products
- [ ] Find a low stock item
- [ ] Quick-adjust stock level
- [ ] Stock updates correctly

**Log issues to**: `docs/ISSUES.md`

**Done when**: Inventory is visible and adjustable.

---

### S3.6: Discounts & Settings
**Goal**: Can she run promotions and configure the shop?

**Discount codes:**
- [ ] Create a new discount code (percentage)
- [ ] Create a new discount code (fixed amount)
- [ ] Set minimum order value
- [ ] Test the codes work (from frontend)

**Settings:**
- [ ] Edit homepage hero slides
- [ ] Edit shipping rates
- [ ] Edit legal pages (returns, privacy)
- [ ] Edit about page

**Log issues to**: `docs/ISSUES.md`

**Done when**: Discounts and settings are manageable.

---

## Workflow Assessment

After testing, answer these questions:

1. **Product creation**: Easy or confusing? What tripped you up?
2. **Order processing**: Clear what to do? Missing anything?
3. **Finding things**: Can you find products/orders quickly?
4. **Mobile**: Does admin work on a phone? (Quick check)

---

## Issues Found

_Quick notes during testing. Move to `docs/ISSUES.md` for tracking._

---

## Completion

- [ ] All stories complete
- [ ] Issues logged to ISSUES.md
- [ ] Workflow assessment answered
- [ ] PROJECT_PLAN.md updated
