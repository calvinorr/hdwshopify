# Test Progress

Last run: 2025-12-28 21:15 GMT
Total: 2 tests | Passed: 2 | Failed: 0

---

## 2025-12-28 21:15

### Checkout Shipping Country Selector
- **File:** tests/checkout-shipping-country.md
- **Status:** PASS
- **Steps:** 7/7 completed

Verified:
- [x] Country selector dropdown is visible
- [x] Dropdown shows grouped countries (UK, Ireland, Europe, International)
- [x] Button disabled state: "Select shipping destination to continue"
- [x] After selecting country: "Proceed to Payment" button enabled
- [x] No console errors

**Resolution:** Fixed client-side import error by moving `formatPrice` utility to separate `lib/format-price.ts` file (was failing because `lib/stripe.ts` checks for server-only env vars at module load time).

---

## 2025-12-27 20:56

### Homepage Vibe Check
- **File:** tests/vibe-check.md
- **Status:** PASS
- **Steps:** 3/3 completed

Verified:
- [x] Heading "Herbarium Dyeworks" visible
- [x] Navigation menu exists (Shop, Collections, About)
- [x] No console errors

---

## Summary

| Test | Status | Notes |
|------|--------|-------|
| vibe-check.md | PASS | Homepage loads correctly |
| checkout-shipping-country.md | PASS | Country selector and button states work |
