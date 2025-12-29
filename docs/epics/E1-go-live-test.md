# E1: Go Live (Test)

> **Status**: TODO
> **Goal**: Get the app running on the test URL so we can see it working
> **Sessions**: 1

---

## Overview

We have a fully built app sitting on a feature branch. This epic merges it to main, deploys to Vercel, and verifies everything loads correctly with real data.

**Test URL**: `herbarium-dyeworks.warmwetcircles.com`

---

## Stories

### S1.1: Merge Feature Branch
**Goal**: Get all the code onto main branch

- [ ] Review what's on `feature/e16-remove-variants` vs `main`
- [ ] Merge feature branch to main
- [ ] Push to origin
- [ ] Verify build passes

**Done when**: Main branch has all the latest code and builds successfully.

---

### S1.2: Deploy to Vercel
**Goal**: Get the app live on the test domain

- [ ] Verify Vercel project is connected to repo
- [ ] Check environment variables are set (DATABASE_URL, STRIPE keys, etc.)
- [ ] Deploy to production (push to main triggers this)
- [ ] Verify deployment completes without errors

**Done when**: Deployment shows as "Ready" in Vercel dashboard.

---

### S1.3: Smoke Test
**Goal**: Quick check that everything loads

- [ ] Homepage loads with products
- [ ] A product page loads with images
- [ ] A collection page loads
- [ ] Admin dashboard loads (may need auth)
- [ ] No console errors on any page

**Done when**: All pages load without errors. Real data is visible.

---

## Notes

- Database is already populated (198 products, 17 collections)
- Shipping zones are already seeded
- This is a "test" deployment - real domain comes in E9

---

## Issues Found

_Log any issues here during the epic. Move to `docs/ISSUES.md` if not fixing immediately._

---

## Completion

- [ ] All stories complete
- [ ] Issues logged
- [ ] PROJECT_PLAN.md updated
