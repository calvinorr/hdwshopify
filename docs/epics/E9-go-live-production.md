# E9: Go Live (Production)

> **Status**: TODO
> **Goal**: Safely switch the real domain to the new site
> **Sessions**: 1
> **Depends on**: E1-E8 complete

---

## Overview

This is the big moment - pointing `herbariumdyeworks.com` to the new site. We do this carefully with a rollback plan.

**IMPORTANT**: The domain is currently managed by Shopify. This is a live store. Do not proceed without explicit confirmation from the user.

---

## Pre-Launch Checklist

Before starting this epic, confirm ALL of the following:

- [ ] E1-E8 are complete
- [ ] All critical issues from testing are fixed
- [ ] Email notifications working
- [ ] Stripe is in LIVE mode (not test mode)
- [ ] Client (wife) has seen and approved the test site
- [ ] Client knows the switch is happening
- [ ] You have access to Shopify domain settings
- [ ] You know how to rollback if needed

---

## Stories

### S9.1: Prepare for Cutover
**Goal**: Everything ready before touching the domain

- [ ] Switch Stripe to live mode
  - [ ] Update `STRIPE_SECRET_KEY` to `sk_live_...`
  - [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `pk_live_...`
  - [ ] Update `STRIPE_WEBHOOK_SECRET` for production endpoint
- [ ] Verify all environment variables are production-ready
- [ ] Do one final test order on test URL
- [ ] Backup current Shopify domain DNS settings (screenshot)
- [ ] Choose a quiet time for cutover (not during a shop update)

**Done when**: Everything is ready, just waiting to flip the switch.

---

### S9.2: Domain Transfer
**Goal**: Point herbariumdyeworks.com to the new site

**Option A - Transfer domain out of Shopify:**
- [ ] Initiate domain transfer from Shopify
- [ ] Update nameservers/DNS to point to Vercel
- [ ] Wait for DNS propagation (can take up to 48 hours)

**Option B - Keep domain at Shopify, update DNS:**
- [ ] In Shopify domain settings, update A/CNAME records
- [ ] Point to Vercel's DNS (cname.vercel-dns.com or IP)
- [ ] Wait for DNS propagation

**Vercel domain setup:**
- [ ] Add `herbariumdyeworks.com` to Vercel project
- [ ] Add `www.herbariumdyeworks.com` (redirect to main)
- [ ] Verify SSL certificate is issued

**Done when**: Domain resolves to the new site.

---

### S9.3: Post-Launch Verification
**Goal**: Confirm everything works on the real domain

- [ ] Homepage loads on `herbariumdyeworks.com`
- [ ] Products display correctly
- [ ] Can add to cart
- [ ] Can complete checkout (do a real £1 test order if possible)
- [ ] Email confirmation received
- [ ] Admin dashboard accessible
- [ ] No mixed content warnings (HTTP vs HTTPS)

**Done when**: Site is fully functional on production domain.

---

### S9.4: Rollback Plan (If Needed)
**Goal**: Know how to undo if something goes wrong

If critical issues after launch:
1. Point domain back to Shopify (reverse DNS changes)
2. Shopify store becomes live again
3. Diagnose and fix issues on test URL
4. Retry cutover when ready

**Done when**: You know the rollback steps (hopefully not needed).

---

### S9.5: Post-Launch Tasks
**Goal**: Wrap up loose ends

- [ ] Disable/pause Shopify subscription (don't delete yet - keep as backup)
- [ ] Monitor for any issues over next 24-48 hours
- [ ] Check order notifications are working
- [ ] Inform client launch is complete
- [ ] Celebrate!

**Done when**: Site is stable and client is happy.

---

## DNS Reference

**To point to Vercel:**

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

Or use Vercel's nameservers if transferring fully.

---

## Rollback Reference

**To revert to Shopify:**

Restore the DNS settings you backed up in S9.1. Shopify's default:
- A record pointing to Shopify's servers
- Or CNAME to shops.myshopify.com

---

## Issues Found

_Log any issues here during the epic._

---

## Completion

- [ ] Domain pointing to new site
- [ ] Site verified working
- [ ] Client notified
- [ ] PROJECT_PLAN.md updated to show COMPLETE
- [ ] Celebrate!
