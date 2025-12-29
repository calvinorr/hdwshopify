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

_None yet_

### High

#### Account features return "Unauthorized" for new users
**Severity**: High
**Found in**: E2 (S2.3 Customer Account)
**Steps to reproduce**:
1. Sign up with a new Clerk account
2. Go to /account/addresses
3. Try to add an address
4. See "Unauthorized" error

**Expected**: Address should save successfully
**Actual**: API returns 401 Unauthorized

**Root cause**: `app/api/account/addresses/route.ts` looks up customer by `clerkId`, but no customer record exists for new Clerk users. The `customers` table only gets populated during checkout, not on Clerk signup.

**Fix needed**: Auto-create customer record when:
- User first accesses account features, OR
- Via Clerk webhook on signup

### Medium

_None yet_

### Low

_None yet_

---

## Resolved Issues

| Issue | Severity | Found In | Fixed In | Notes |
|-------|----------|----------|----------|-------|
| Collections show 0 products | High | E2 | E2 | Products had NULL categoryId - fixed via script |

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
