# Test Progress

Last run: 2025-12-29 12:30 GMT
Total: 2 tests | Passed: 2 | Failed: 0

---

## 2025-12-29 12:30

### Homepage Vibe Check
- **File:** tests/vibe-check.md
- **Status:** PASS
- **Steps:** 3/3 completed

Verified:
- [x] Heading "Herbarium Dyeworks" visible
- [x] Navigation menu exists (Shop, Collections, About)
- [x] No console errors

---

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

**Note:** Database was seeded with test products after E16 schema migration. Added `picsum.photos` to next.config.ts image domains for placeholder images.

---

## Summary

| Test | Status | Notes |
|------|--------|-------|
| vibe-check.md | PASS | Homepage loads correctly |
| checkout-shipping-country.md | PASS | Country selector and button states work |
