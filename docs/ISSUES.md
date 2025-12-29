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

_None currently_

### High

_None yet_

### Medium

### Weight dropdown has no options configured
**Severity**: Medium
**Found in**: E3 S3.2
**Steps to reproduce**:
1. Go to Admin > Products > Add Product
2. Scroll to "Yarn Details" section
3. Click "Weight" dropdown

**Expected**: Should show options like Laceweight, 4ply, DK, Aran
**Actual**: Dropdown opens but has no options to select

**Note**: Message says "Add weight types in Settings → Taxonomies" - needs taxonomies configured.

### Low

_None yet_

---

## Resolved Issues

| Issue | Severity | Found In | Fixed In | Notes |
|-------|----------|----------|----------|-------|
| Product detail page crashes for products without images | Critical | E3 | E3 | Added defensive null checks for product.images across gallery, card, client, and page components. |
| Cart session mismatch blocks checkout | Critical | E2 | E2 | Checkout API only looked by sessionId, which was NULL for logged-in users. Fixed to check customerId first. |
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
