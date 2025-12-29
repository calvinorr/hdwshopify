# E4: Search Enhancement

> **Status**: TODO
> **Goal**: Make search actually useful for finding yarn
> **Sessions**: 1
> **Depends on**: E2 (tested current search, logged issues)

---

## Overview

Currently search only looks at product name, description, and SKU. Customers want to search for "merino" (fiber) or "DK" (weight) and find relevant products.

---

## Stories

### S4.1: Expand Search Fields
**Goal**: Search includes fiber and weight

- [ ] Update `/api/search/route.ts` to include:
  - `fiberContent` field
  - `weight` field
- [ ] Test search for "merino" returns silk/merino blends
- [ ] Test search for "DK" returns DK weight yarns
- [ ] Test search for "laceweight" returns laceweight yarns

**Done when**: Fiber and weight searches return relevant results.

---

### S4.2: Search Results Display
**Goal**: Results show why they matched

- [ ] Show fiber content in search results (if matched)
- [ ] Show weight in search results (if matched)
- [ ] Results are clearly formatted
- [ ] "No results" message is helpful

**Done when**: Search results are informative.

---

### S4.3: Search UX Polish
**Goal**: Search feels good to use

- [ ] Search input in header works
- [ ] Search suggestions as you type (stretch goal)
- [ ] Recent searches shown (stretch goal)
- [ ] Mobile search experience is good

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

- [ ] All stories complete
- [ ] Search tested with real queries
- [ ] PROJECT_PLAN.md updated
