# E1: Go Live (Test)

> **Status**: ✅ COMPLETE
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

- [x] Review what's on `feature/e16-remove-variants` vs `main`
- [x] Merge feature branch to main
- [x] Push to origin
- [x] Verify build passes

**Done when**: Main branch has all the latest code and builds successfully.

---

### S1.2: Deploy to Vercel
**Goal**: Get the app live on the test domain

- [x] Verify Vercel project is connected to repo
- [x] Check environment variables are set (DATABASE_URL, STRIPE keys, etc.)
- [x] Deploy to production (push to main triggers this)
- [x] Verify deployment completes without errors

**Done when**: Deployment shows as "Ready" in Vercel dashboard.

---

### S1.3: Smoke Test
**Goal**: Quick check that everything loads

- [x] Homepage loads with products
- [x] A product page loads with images
- [x] A collection page loads
- [x] Admin dashboard loads (may need auth)
- [x] No console errors on any page

**Done when**: All pages load without errors. Real data is visible.

---

## Notes

- Database is already populated (198 products, 17 collections)
- Shipping zones are already seeded
- This is a "test" deployment - real domain comes in E9

---

## Issues Found

- **Cron schedule**: Changed from every 5 mins to daily (Vercel hobby tier limitation)
- **Env var newlines**: Had to use `printf` instead of `echo` when setting Vercel env vars via CLI

---

## Completion

- [x] All stories complete
- [x] Issues logged (none found)
- [x] PROJECT_PLAN.md updated
