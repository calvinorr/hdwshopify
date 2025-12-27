# Customer Journey Improvements

Pre-checkout improvements identified for Herbarium Dyeworks.

## Priority 1 - Critical (Blocking Conversion)

- [ ] **Fix cart functionality** - state management, persistence, full cart page UI
- [ ] **Add-to-cart toast notifications** - feedback when items added

## Priority 2 - High (Friction Points)

- [ ] **Colorway swatch images** - show actual color swatches, not just text
- [ ] **Related products section** - "You may also like" on product detail
- [ ] **Quick-add-to-cart** - hover add button on product cards
- [ ] **Recently viewed products** - section on homepage or product pages

## Priority 3 - Medium (Engagement)

- [ ] **Product reviews system** - ratings and customer reviews
- [ ] **Wishlist/favorites** - save items for later
- [ ] **Search autocomplete** - suggestions as user types
- [ ] **Price range filter** - on products/collections pages

## Priority 4 - Polish

- [ ] **Yarn weight guide** - explainer for new knitters
- [ ] **Back in stock notifications** - email signup for sold out items

---

## Notes

- Cart can be implemented without Stripe (just state + UI)
- Stripe only needed at final checkout step
- Cart approach: React context + localStorage (guest) or database (logged in)
