# E2: Test Customer Journey

> **Status**: IN_PROGRESS
> **Goal**: Walk through everything a customer would do. Document what breaks.
> **Sessions**: 1-2
> **Depends on**: E1 (deployed to test URL)

---

## Overview

Pretend you're a customer visiting the shop for the first time. Try to buy something. Try to find something specific. Create an account. This will reveal any bugs or UX issues before your wife sees them.

**Test on**: `herbarium-dyeworks.warmwetcircles.com`

---

## Stories

### S2.1: Browsing & Discovery ✅
**Goal**: Can a customer find what they want?

- [x] Visit homepage - does it look right? Hero carousel working?
- [x] Click through to a collection (e.g., "DK" or "In Stock")
- [x] Use filters (by weight, by fiber, by availability)
- [x] Use sorting (price low-high, newest)
- [x] Try the search - search for "merino", "blue", a product name
- [x] View a product detail page - images, description, price visible?
- [x] Image zoom works?
- [x] Related products showing?

**Verified**: 2025-12-29 | Bug found & fixed: collections showing 0 products (categoryId was NULL)

**Log issues to**: `docs/ISSUES.md`

**Done when**: Can browse the full shop without errors.

---

### S2.2: Cart & Checkout ✅
**Goal**: Can a customer buy something?

- [x] Add a product to cart
- [x] Cart badge updates
- [x] Open cart drawer - item shows correctly
- [x] Change quantity in cart
- [x] Remove item from cart
- [x] Add item back, proceed to checkout
- [x] Select shipping country (try UK, Ireland, US)
- [x] Shipping rate displays correctly
- [x] Apply a discount code (create one first if needed)
- [x] Proceed to Stripe checkout
- [x] Use test card `4242 4242 4242 4242`
- [x] Complete payment
- [x] Redirected to success page
- [x] Order confirmation displays

**Verified**: 2025-12-29 | Bug fixed: Production 500 error caused by trailing newline in NEXT_PUBLIC_URL env var. Added `.trim()` to URL handling.

**Log issues to**: `docs/ISSUES.md`

**Done when**: Can complete a full purchase with test card.

---

### S2.3: Customer Account ✅
**Goal**: Can a customer manage their account?

- [x] Create a new account (sign up)
- [x] Log in with the account
- [x] View account dashboard - shows recent orders?
- [x] View order history - shows the test order?
- [x] Click into order detail - shows items, status, tracking?
- [x] Add a saved address
- [x] Edit the address
- [x] Delete the address
- [x] Update profile settings
- [x] Log out

**Verified**: 2025-12-29 | Bug found & fixed: New Clerk users had no customer record, causing 401 on account APIs. Fixed with auto-create on first access.

**Log issues to**: `docs/ISSUES.md`

**Done when**: Account features work as expected.

---

### S2.4: Edge Cases
**Goal**: What happens when things go wrong?

- [x] Try to checkout with empty cart
- [x] Try to add out-of-stock item (if any exist)
- [x] Try invalid discount code
- [x] Try expired discount code (code verified)
- [ ] Use declined card `4000 0000 0000 0002` - BLOCKED by cart bug
- [x] Abandon checkout halfway - does cart persist? - **BUG FOUND**
- [x] Visit a non-existent product URL - 404 page?
- [x] Visit a non-existent collection URL - 404 page?

**Verified**: 2025-12-29 (partial) | **BLOCKED**: Cart session mismatch bug prevents Stripe testing

**Bug logged**: `docs/ISSUES.md` - Critical: Cart session mismatch blocks checkout

**Log issues to**: `docs/ISSUES.md`

**Done when**: Edge cases handled gracefully (no crashes, friendly messages).

---

## Testing Notes

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3DS: `4000 0027 6000 3184`

Any expiry date in future, any CVC.

---

## Issues Found

_Quick notes during testing. Move to `docs/ISSUES.md` for tracking._

---

## Completion

- [ ] All stories complete
- [ ] Issues logged to ISSUES.md
- [ ] PROJECT_PLAN.md updated
