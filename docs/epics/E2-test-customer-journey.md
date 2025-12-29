# E2: Test Customer Journey

> **Status**: TODO
> **Goal**: Walk through everything a customer would do. Document what breaks.
> **Sessions**: 1-2
> **Depends on**: E1 (deployed to test URL)

---

## Overview

Pretend you're a customer visiting the shop for the first time. Try to buy something. Try to find something specific. Create an account. This will reveal any bugs or UX issues before your wife sees them.

**Test on**: `herbarium-dyeworks.warmwetcircles.com`

---

## Stories

### S2.1: Browsing & Discovery
**Goal**: Can a customer find what they want?

- [ ] Visit homepage - does it look right? Hero carousel working?
- [ ] Click through to a collection (e.g., "DK" or "In Stock")
- [ ] Use filters (by weight, by fiber, by availability)
- [ ] Use sorting (price low-high, newest)
- [ ] Try the search - search for "merino", "blue", a product name
- [ ] View a product detail page - images, description, price visible?
- [ ] Image zoom works?
- [ ] Related products showing?

**Log issues to**: `docs/ISSUES.md`

**Done when**: Can browse the full shop without errors.

---

### S2.2: Cart & Checkout
**Goal**: Can a customer buy something?

- [ ] Add a product to cart
- [ ] Cart badge updates
- [ ] Open cart drawer - item shows correctly
- [ ] Change quantity in cart
- [ ] Remove item from cart
- [ ] Add item back, proceed to checkout
- [ ] Select shipping country (try UK, Ireland, US)
- [ ] Shipping rate displays correctly
- [ ] Apply a discount code (create one first if needed)
- [ ] Proceed to Stripe checkout
- [ ] Use test card `4242 4242 4242 4242`
- [ ] Complete payment
- [ ] Redirected to success page
- [ ] Order confirmation displays

**Log issues to**: `docs/ISSUES.md`

**Done when**: Can complete a full purchase with test card.

---

### S2.3: Customer Account
**Goal**: Can a customer manage their account?

- [ ] Create a new account (sign up)
- [ ] Log in with the account
- [ ] View account dashboard - shows recent orders?
- [ ] View order history - shows the test order?
- [ ] Click into order detail - shows items, status, tracking?
- [ ] Add a saved address
- [ ] Edit the address
- [ ] Delete the address
- [ ] Update profile settings
- [ ] Log out

**Log issues to**: `docs/ISSUES.md`

**Done when**: Account features work as expected.

---

### S2.4: Edge Cases
**Goal**: What happens when things go wrong?

- [ ] Try to checkout with empty cart
- [ ] Try to add out-of-stock item (if any exist)
- [ ] Try invalid discount code
- [ ] Try expired discount code
- [ ] Use declined card `4000 0000 0000 0002`
- [ ] Abandon checkout halfway - does cart persist?
- [ ] Visit a non-existent product URL - 404 page?
- [ ] Visit a non-existent collection URL - 404 page?

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
