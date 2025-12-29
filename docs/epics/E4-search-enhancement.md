# E4: Search Enhancement

> **Status**: ✅ COMPLETE
> **Goal**: Make search actually useful for finding yarn
> **Sessions**: 1
> **Depends on**: E2 (tested current search, logged issues)

---

## Overview

Currently search only looks at product name, description, and SKU. Customers want to search for "merino" (fiber) or "DK" (weight) and find relevant products.

---

## Stories

### S4.1: Expand Search Fields ✅
**Goal**: Search includes fiber and weight

- [x] Update `/api/search/route.ts` to include:
  - `fiberContent` field
  - `weight` field
- [x] Test search for "merino" returns silk/merino blends
- [x] Test search for "DK" returns DK weight yarns
- [x] Test search for "laceweight" returns laceweight yarns

**Done when**: Fiber and weight searches return relevant results.

---

### S4.2: Search Results Display ✅
**Goal**: Results show why they matched

- [x] Show fiber content in search results (if matched)
- [x] Show weight in search results (if matched)
- [x] Results are clearly formatted
- [x] "No results" message is helpful

**Note**: ProductCard already displays fiberContent and weight badges. No changes needed.

**Done when**: Search results are informative.

---

### S4.3: Search UX Polish ✅
**Goal**: Search feels good to use

- [x] Search input in header works
- [ ] Search suggestions as you type (stretch goal - skipped)
- [ ] Recent searches shown (stretch goal - skipped)
- [x] Mobile search experience is good

**Note**: Header has expandable search. Search page is responsive. Stretch goals deferred.

**Done when**: Search is pleasant to use.

---

## Technical Notes

Current search query (in `/api/search/route.ts`):
```typescript
or(
  like(products.name, searchTerm),
  like(products.description, searchTerm),
  like(products.sku, searchTerm)
)
```

Need to add:
```typescript
like(products.fiberContent, searchTerm),
like(products.weight, searchTerm)
```

---

## Issues Found

_Log any issues here during the epic._

---

## Completion

- [x] All stories complete
- [x] Search tested with real queries
- [x] PROJECT_PLAN.md updated
