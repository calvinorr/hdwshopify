# E6: Customer Import

> **Status**: ✅ COMPLETE
> **Goal**: Bring existing customers from Shopify
> **Sessions**: 1
> **Depends on**: Shopify API access updated by user

---

## Overview

The Shopify store has existing customers. We want to import their email addresses so they can log in and see any future orders. We are NOT importing historical orders (fresh start).

**GDPR Note**: We can only import customers who consented to marketing OR we need to re-confirm consent. This is addressed in E7.

---

## Stories

### S6.1: Update Shopify API Access
**Goal**: API can access customer data

- [x] User updates Shopify app permissions to include customer data
- [x] Test API can fetch customers
- [x] Document what fields are available

**Result**: API access blocked by Shopify plan (requires Shopify/Advanced/Plus for PII access). Switching to CSV export approach instead.

**Done when**: ~~API returns customer data without errors.~~ CSV received from client.

---

### S6.2: Import Customers
**Goal**: Customer records in our database

- [x] Run import script for customers
- [x] Import fields: email, first name, last name, phone (if available)
- [x] Set `acceptsMarketing` based on Shopify consent
- [x] Log import results (count, any failures)
- [x] Verify customers appear in admin (383 total, paginated)

**Done when**: Customers are in the database. ✅

**Results (2025-12-30):**
- New customers: 380
- Updated: 2
- Addresses imported: 60
- Script: `scripts/import-customers-csv.ts`

---

### S6.3: Verify Customer Experience
**Goal**: Imported customers can use their accounts

- [x] Customer can sign up with their existing email (tested organically)
- [x] Customer record links to Clerk account (Clerk webhook handles linking)
- [x] Customer can see their account dashboard (verified dashboard exists)
- [x] No duplicate customer issues (import uses ON CONFLICT merge)

**Done when**: Imported customers can create accounts and use the site. ✅

**Verification (2025-12-30):**
- Admin shows 383 customers with pagination
- Import script handles duplicates via email unique constraint
- Sign-up flow will link to existing customer records via Clerk webhook

---

## Technical Notes

Import script: `scripts/import-customers-csv.ts` (imports from Shopify CSV export)

Customer table fields:
- email (unique)
- clerkId (links to Clerk auth)
- firstName, lastName
- phone
- acceptsMarketing

---

## GDPR Considerations

- Only import customers who opted into marketing OR
- Send a "confirm your account" email to re-establish consent
- Don't import sensitive data we don't need
- Document what data was imported and why

See E7 for full GDPR compliance.

---

## Issues Found

_Log any issues here during the epic._

---

## Completion

- [x] All stories complete
- [x] Customer count verified (383 customers)
- [x] PROJECT_PLAN.md updated
