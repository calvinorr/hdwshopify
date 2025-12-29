# E7: Security & GDPR

> **Status**: TODO
> **Goal**: Make sure the site is compliant and secure
> **Sessions**: 1-2

---

## Overview

The site handles customer data (emails, addresses, orders) and payments. We need to ensure GDPR compliance and basic security measures are in place.

---

## Stories

### S7.1: Cookie Consent
**Goal**: Comply with cookie laws

- [ ] Add cookie consent banner
- [ ] Banner appears on first visit
- [ ] User can accept or reject non-essential cookies
- [ ] Choice is remembered
- [ ] Only essential cookies set before consent
- [ ] Link to privacy policy from banner

**Done when**: Cookie consent is implemented and functional.

---

### S7.2: Privacy Policy Review
**Goal**: Privacy policy is accurate

- [ ] Review current privacy policy (`/privacy`)
- [ ] Ensure it covers:
  - What data we collect
  - Why we collect it
  - How long we keep it
  - Third parties we share with (Stripe, Clerk, analytics)
  - User rights (access, deletion, correction)
  - Contact information
- [ ] Update any inaccurate information
- [ ] Add last updated date

**Done when**: Privacy policy accurately describes our data practices.

---

### S7.3: Data Handling Review
**Goal**: We handle data responsibly

- [ ] Customer data encrypted in transit (HTTPS) ✓ (Vercel default)
- [ ] Database access is authenticated ✓ (Turso tokens)
- [ ] No sensitive data in URL parameters
- [ ] No sensitive data in client-side logs
- [ ] Stripe handles payment data (we never see card numbers) ✓
- [ ] Order data includes only what's needed
- [ ] Customer can delete their account? (check if implemented)

**Done when**: Data handling is reviewed and any issues logged.

---

### S7.4: Admin Access Review
**Goal**: Only authorized people can access admin

- [ ] Admin routes are protected
- [ ] Check who has admin access
- [ ] Ensure Clerk is properly configured for admin
- [ ] Test that non-admin users can't access `/admin`
- [ ] Consider adding admin email allowlist

**Done when**: Admin access is properly restricted.

---

### S7.5: Security Headers
**Goal**: Basic security headers are set

- [ ] Check for security headers (CSP, X-Frame-Options, etc.)
- [ ] Add any missing headers via `next.config.js` or Vercel
- [ ] Test with securityheaders.com

**Done when**: Security headers score is acceptable.

---

## GDPR Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Lawful basis for processing | TODO | Consent or legitimate interest |
| Privacy policy | TODO | Must be clear and accessible |
| Cookie consent | TODO | Must be implemented |
| Right to access | TODO | Can user see their data? |
| Right to deletion | TODO | Can user delete account? |
| Data breach procedure | TODO | What do we do if breached? |
| Data retention policy | TODO | How long do we keep data? |

---

## Third-Party Data Sharing

| Service | Data Shared | Purpose |
|---------|-------------|---------|
| Stripe | Email, address, payment | Process payments |
| Clerk | Email, name | Authentication |
| Vercel | IP, usage | Hosting |
| Turso | All app data | Database |

Ensure all are mentioned in privacy policy.

---

## Issues Found

_Log any issues here during the epic._

---

## Completion

- [ ] All stories complete
- [ ] GDPR checklist reviewed
- [ ] Privacy policy updated
- [ ] PROJECT_PLAN.md updated
