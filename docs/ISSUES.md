# Issues Log

> **Purpose**: Track bugs and problems found during testing
> **Updated**: As issues are found

---

## How to Use This File

When you find an issue during testing:

1. Add it to the appropriate section below
2. Include: what happened, where, and severity
3. If you fix it immediately, move to "Resolved" section
4. If it needs more work, leave in "Open" section

---

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Blocks purchases or crashes site | Fix before launch |
| **High** | Bad user experience, confusing | Fix before launch |
| **Medium** | Annoying but workable | Fix if time allows |
| **Low** | Minor polish | Post-launch backlog |

---

## Open Issues

### Critical

### Cart session mismatch blocks checkout
**Severity**: Critical
**Found in**: E2 S2.4 (Edge Cases)
**Steps to reproduce**:
1. Add item to cart (cart badge shows count)
2. Go to /checkout - order summary shows item
3. Select shipping country (UK)
4. Click "Proceed to Payment"
5. See "Cart is empty" error

**Expected**: Redirect to Stripe checkout
**Actual**: API returns 400 "Cart is empty" despite UI showing cart items

**Technical details**:
- `/api/checkout/session` returns 400
- `getCartSession()` returns a session ID that doesn't match DB cart
- Frontend cart state is cached/stale while backend cart is different
- Reproducible after multiple add-to-cart operations

**Impact**: Blocks ALL customer purchases

**Files to investigate**:
- `lib/cart.ts` - `getCartSession()` function
- `app/api/checkout/session/route.ts` - lines 58-74
- `app/api/cart/route.ts` - cart creation/session handling

### High

_None yet_

### Medium

_None yet_

### Low

_None yet_

---

## Resolved Issues

| Issue | Severity | Found In | Fixed In | Notes |
|-------|----------|----------|----------|-------|
| Collections show 0 products | High | E2 | E2 | Products had NULL categoryId - fixed via script |
| Account features "Unauthorized" for new users | High | E2 | E2 | Auto-create customer record on first account access |

---

## Issue Template

```
### [Short description]
**Severity**: Critical / High / Medium / Low
**Found in**: E2 / E3 / etc.
**Steps to reproduce**:
1. Go to...
2. Click...
3. See error...

**Expected**: What should happen
**Actual**: What actually happens
**Screenshot**: (if helpful)
```

---

## Notes

- Issues found during E2 (Customer Journey) and E3 (Admin Journey) go here
- E8 (Polish) is specifically for fixing issues from this log
- Critical issues should be fixed immediately, not logged
