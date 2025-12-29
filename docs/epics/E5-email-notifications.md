# E5: Email Notifications

> **Status**: ✅ COMPLETE
> **Goal**: Get order confirmation and shipping emails working
> **Sessions**: 1
> **Depends on**: E2 (can place test orders)

---

## Overview

Customers need to receive emails when they place an order and when it ships. Currently Resend is configured but had setup issues previously. We'll fix it or switch to Gmail SMTP.

---

## Stories

### S5.1: Diagnose Email Setup ✅
**Goal**: Understand what's broken

- [x] Check current Resend configuration
- [x] Check `RESEND_API_KEY` is set in Vercel
- [x] Check `EMAIL_FROM` address is configured
- [x] Try sending a test email
- [x] Check Resend dashboard for delivery status
- [x] Document what's wrong

**Decision**: Stick with Resend - already integrated, 3k emails/month free, professional.
Using `onboarding@resend.dev` for testing until production domain verified.

**Done when**: We know what's broken and have a plan. ✅

---

### S5.2: Fix or Replace Email Provider ✅
**Goal**: Emails actually send

**Option A - Fix Resend:** ✅
- [x] Verify domain in Resend (using onboarding@resend.dev for test phase)
- [x] API key configured in .env.local and Vercel
- [x] Test sending works

**Option B - Gmail SMTP:** (Not needed)
- [ ] Set up Gmail App Password
- [ ] Configure nodemailer with Gmail SMTP
- [ ] Update email sending code
- [ ] Test sending works

**Done when**: Can successfully send a test email. ✅

---

### S5.3: Test Order Confirmation ✅
**Goal**: Customers get email after purchase

- [x] Place a test order (from E2) - tested via script
- [x] Check email arrives
- [x] Email contains: order number, items, totals, shipping address
- [x] Email looks professional (not broken formatting)
- [ ] Links in email work (will verify with real order)

**Done when**: Order confirmation email works end-to-end. ✅

---

### S5.4: Test Shipping Notification ✅
**Goal**: Customers get email when order ships

- [x] Mark a test order as "Shipped" with tracking number - tested via script
- [x] Check email arrives
- [x] Email contains: order number, tracking number, tracking link
- [x] Email looks professional

**Done when**: Shipping notification email works end-to-end. ✅

---

## Email Templates

Location: `lib/email/`
- `send-order-confirmation.ts`
- `send-shipping-confirmation.ts`

---

## Environment Variables

```bash
# Resend
RESEND_API_KEY=re_...
EMAIL_FROM=Herbarium Dyeworks <orders@herbariumdyeworks.com>

# OR Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=app-specific-password
```

---

## Issues Found

_Log any issues here during the epic._

---

## Completion

- [x] All stories complete
- [x] Both email types tested
- [x] PROJECT_PLAN.md updated
