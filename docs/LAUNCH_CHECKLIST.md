# Launch Checklist

> **Status**: PRE-LAUNCH
> **Goal**: Everything needed to go live with the store

## Overview

This checklist consolidates all remaining tasks needed before launching the Herbarium Dyeworks store. The core platform is complete - this is about production configuration and final polish.

---

## 1. Stripe Production Setup

### 1.1 Stripe Dashboard Configuration
- [ ] Create/verify Stripe account is in live mode
- [ ] Add business details (address, support email)
- [ ] Configure branding (logo, colors, statement descriptor)
- [ ] Set up payout schedule

### 1.2 Environment Variables
- [ ] Add `STRIPE_SECRET_KEY` (live key, starts with `sk_live_`)
- [ ] Add `STRIPE_PUBLISHABLE_KEY` (live key, starts with `pk_live_`)
- [ ] Add `STRIPE_WEBHOOK_SECRET` (from webhook endpoint)

### 1.3 Webhook Configuration
- [ ] Create webhook endpoint in Stripe Dashboard
- [ ] URL: `https://herbarium-dyeworks.warmwetcircles.com/api/webhooks/stripe`
- [ ] Events to listen for:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- [ ] Test webhook with Stripe CLI or test event

### 1.4 Checkout Testing
- [ ] Complete a test purchase with a real card (can refund immediately)
- [ ] Verify order appears in admin dashboard
- [ ] Verify order confirmation email sends
- [ ] Verify inventory decrements correctly

---

## 2. Email (Resend) Setup

### 2.1 Domain Verification
- [ ] Add domain to Resend dashboard
- [ ] Add DNS records (SPF, DKIM, DMARC)
- [ ] Verify domain is authenticated
- [ ] Update `from` address in email templates

### 2.2 Environment Variables
- [ ] Add `RESEND_API_KEY` (production key)

### 2.3 Email Testing
- [ ] Send test order confirmation
- [ ] Send test shipping notification
- [ ] Check emails don't land in spam

---

## 3. Domain & DNS

### 3.1 Current Setup
- Production URL: `herbarium-dyeworks.warmwetcircles.com`
- Hosted on: Vercel

### 3.2 Custom Domain (if needed)
- [ ] Purchase/configure custom domain
- [ ] Add to Vercel project
- [ ] Update DNS records
- [ ] Verify SSL certificate

---

## 4. Final Testing

### 4.1 Customer Journey
- [ ] Browse products and collections
- [ ] Add items to cart
- [ ] Apply discount code
- [ ] Complete checkout (guest)
- [ ] Complete checkout (logged in)
- [ ] View order confirmation
- [ ] Track order status

### 4.2 Admin Journey
- [ ] Add new product with images
- [ ] Edit product details
- [ ] Fulfill an order
- [ ] Add tracking number
- [ ] View dashboard stats

### 4.3 Edge Cases
- [ ] Out of stock handling
- [ ] Invalid discount code
- [ ] Shipping to different zones (UK, Ireland, EU, US)

---

## 5. Optional Polish (Non-Blocking)

These are nice-to-have but don't block launch:

### From E1: Product Catalog
- [ ] Accessibility audit (WCAG compliance check)

### From E6: Admin Dashboard
- [ ] Bulk actions (archive/activate multiple products)

---

## 6. Go-Live Steps

1. [ ] Final backup of Turso database
2. [ ] Deploy latest code to production
3. [ ] Switch Stripe to live mode (if using test keys)
4. [ ] Verify webhook is receiving events
5. [ ] Place test order and refund
6. [ ] Announce launch!

---

## Environment Variables Summary

```bash
# Production (.env.local or Vercel dashboard)

# Database (already configured)
DATABASE_URL=libsql://...
DATABASE_AUTH_TOKEN=...

# Stripe (LIVE keys)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...

# Auth (optional - already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# App
NEXT_PUBLIC_BASE_URL=https://herbarium-dyeworks.warmwetcircles.com
```

---

## Support Contacts

- **Stripe**: dashboard.stripe.com/support
- **Resend**: resend.com/docs
- **Vercel**: vercel.com/support
- **Turso**: turso.tech/docs

---

## Post-Launch Monitoring

First week after launch:
- [ ] Monitor Stripe dashboard for failed payments
- [ ] Check Resend for bounced emails
- [ ] Review Vercel logs for errors
- [ ] Check order fulfillment queue daily
