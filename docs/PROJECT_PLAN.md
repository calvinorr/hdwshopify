# Herbarium Dyeworks - Project Plan

> **Goal**: Low-cost Shopify replacement for a small yarn business
> **Savings**: ~£280/year (from £300 Shopify → ~£20 domain only)
> **User**: Artist who wants simplicity - easy workflows, beautiful photos, no tech headaches

---

## Guiding Principles

1. **Keep it simple** - She should be able to add a product in 5 minutes
2. **Photos sell** - The site showcases her photography, doesn't fight it
3. **SEO just works** - She doesn't think about meta descriptions
4. **Clear daily actions** - Admin shows what needs doing today
5. **Costs almost nothing** - No monthly fee anxiety

---

## Current Status

**What's Built**: Full e-commerce platform with 198 products imported
- Shop: Browse, search, cart, checkout with Stripe
- Customer accounts: Login, order history, addresses
- Admin: Products, collections, orders, inventory, discounts
- Content pages: About, shipping, returns, etc.

**What's Not Deployed**: Code is on a feature branch, needs merging

**Test URL**: `herbarium-dyeworks.warmwetcircles.com` (after E1)
**Production URL**: `herbariumdyeworks.com` (after E9 - DO NOT TOUCH until then)

---

## Epic Overview

| Epic | Name | Status | Sessions |
|------|------|--------|----------|
| E1 | Go Live (Test) | TODO | 1 |
| E2 | Test Customer Journey | TODO | 1-2 |
| E3 | Test Admin Journey | TODO | 1-2 |
| E4 | Search Enhancement | TODO | 1 |
| E5 | Email Notifications | TODO | 1 |
| E6 | Customer Import | TODO | 1 |
| E7 | Security & GDPR | TODO | 1-2 |
| E8 | Polish & Social | TODO | 1 |
| E9 | Go Live (Production) | TODO | 1 |

**Total**: ~10-12 sessions of focused work

---

## Epic Summaries

### E1: Go Live (Test)
Get the app running on the test URL so we can see it working.
- Merge feature branch to main
- Deploy to Vercel
- Verify it loads with real data

### E2: Test Customer Journey
Walk through everything a customer would do. Document what breaks.
- Browse and search for products
- Add to cart, apply discount, checkout
- Create account, view order history
- Track an order

### E3: Test Admin Journey
Walk through everything your wife would do. Document what breaks.
- Add a new product with photos
- Edit a collection
- Process an order (fulfill, add tracking)
- Check inventory and stock levels

### E4: Search Enhancement
Make search actually useful for finding yarn.
- Search by fiber content (merino, silk, etc.)
- Search by weight (DK, 4ply, laceweight)
- Better results display

### E5: Email Notifications
Get order confirmation and shipping emails working.
- Fix Resend setup OR switch to Gmail SMTP
- Test order confirmation email
- Test shipping notification email

### E6: Customer Import
Bring existing customers from Shopify.
- Update Shopify API access for customer data
- Import customer emails and names
- Handle GDPR consent properly

### E7: Security & GDPR
Make sure the site is compliant and secure.
- Cookie consent banner
- Privacy policy accuracy
- Secure data handling
- Admin access review

### E8: Polish & Social
Final touches before going live.
- Add social media links to footer
- Fix any issues found during testing
- Review mobile experience

### E9: Go Live (Production)
Safely switch the real domain.
- Final checklist review
- Point herbariumdyeworks.com to new site
- Monitor for issues
- Celebrate!

---

## Definition of Done (Per Epic)

Each epic is complete when:
- [ ] All stories are done
- [ ] Issues found are logged (either fixed or added to backlog)
- [ ] Epic doc is updated with completion status
- [ ] Jarvis state is updated

---

## Files

| File | Purpose |
|------|---------|
| `docs/PROJECT_PLAN.md` | This file - overview |
| `docs/CODEBASE.md` | What's built, tech details |
| `docs/epics/E1-*.md` through `E9-*.md` | Individual epic details |
| `docs/epics/archive/` | Old completed/abandoned epics |
| `docs/ISSUES.md` | Issues found during testing |

---

## Session Workflow

1. **Start**: Run `/jarvis` → option 1 (Starting session)
2. **Work**: Focus on current epic's next story
3. **Issues**: Log any bugs/problems found to `docs/ISSUES.md`
4. **End**: Run `/jarvis` → option 2 (Ending session)
5. **Stuck**: Run `/jarvis` → option 4 (Senior engineer consult)

---

## Future Enhancements (Post-Launch)

Not for now, but ideas for later:
- AI-assisted SEO (auto-generate meta descriptions)
- Themes (let her change colors/fonts)
- Customer reviews
- Wishlist
- Newsletter integration
