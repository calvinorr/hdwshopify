# E15: Stripe Test Mode Validation

> **Status**: 📋 TODO
> **Priority**: CRITICAL - Client Demo Readiness
> **Goal**: Demonstrate complete payment flow using Stripe test mode before going live

## Overview

This epic validates the entire checkout and payment flow using Stripe's test mode. All scenarios use **test API keys** (starting with `sk_test_` and `pk_test_`) - no real money is involved.

**Why this matters**: This is the most critical validation before launch. Your client needs to see orders flow through from cart → checkout → payment → admin dashboard → fulfillment.

---

## Test Card Reference

### Successful Payments
| Card Number | Brand | Use Case |
|-------------|-------|----------|
| `4242 4242 4242 4242` | Visa | Standard success |
| `5555 5555 5555 4444` | Mastercard | Standard success |
| `3782 822463 10005` | Amex | 4-digit CVC (1234) |

### Declined Payments
| Card Number | Decline Reason |
|-------------|----------------|
| `4000 0000 0000 0002` | Generic decline |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 9987` | Lost card |
| `4000 0000 0000 9979` | Stolen card |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0101` | Incorrect CVC |

### 3D Secure (SCA) Testing
| Card Number | Behavior |
|-------------|----------|
| `4000 0027 6000 3184` | Requires authentication (will show 3DS modal) |
| `4000 0000 0000 3220` | 3DS required, authentication succeeds |
| `4000 0000 0000 3063` | 3DS required, authentication fails |

### Test Card Details
- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (4 digits for Amex)
- **Postcode**: Any valid format

---

## US15.1: Happy Path - Complete Purchase Flow

**Goal**: Demonstrate a successful end-to-end purchase

### Prerequisites
- [ ] Confirm test API keys are configured in `.env.local`
- [ ] Dev server running (`npm run dev`)
- [ ] At least one product with stock > 0

### Test Steps

#### Customer Journey
- [ ] Browse to shop, select a product
- [ ] Add to cart (verify cart badge updates)
- [ ] Go to cart, verify item and price
- [ ] Click checkout
- [ ] Select shipping country (UK)
- [ ] Verify shipping rate displays correctly
- [ ] Click "Proceed to Payment"
- [ ] In Stripe Checkout:
  - [ ] Enter email: `test@example.com`
  - [ ] Enter shipping address (any UK address)
  - [ ] Enter card: `4242 4242 4242 4242`
  - [ ] Expiry: `12/34`, CVC: `123`
  - [ ] Click Pay
- [ ] Verify redirect to success page
- [ ] Verify order confirmation displays
- [ ] Check email received (if Resend configured)

#### Admin Verification
- [ ] Go to admin dashboard (`/admin`)
- [ ] Verify new order appears in "Recent Orders"
- [ ] Click into order detail
- [ ] Verify:
  - [ ] Order number generated (HD-YYYYMMDD-XXX format)
  - [ ] Customer email correct
  - [ ] Shipping address captured
  - [ ] Line items match cart
  - [ ] Payment status shows "Paid"
  - [ ] Order status shows "Pending"

#### Stock Verification
- [ ] Check product variant stock decreased by quantity ordered

---

## US15.2: Payment Declines

**Goal**: Verify graceful handling of declined payments

### Generic Decline
- [ ] Add product to cart, proceed to checkout
- [ ] Use card: `4000 0000 0000 0002`
- [ ] Verify Stripe shows decline message
- [ ] Verify NO order created in admin
- [ ] Verify stock NOT decremented
- [ ] Verify cart still intact (can retry)

### Insufficient Funds
- [ ] Use card: `4000 0000 0000 9995`
- [ ] Verify "insufficient funds" message shown
- [ ] Verify customer can update card and retry

### Expired Card
- [ ] Use card: `4000 0000 0000 0069`
- [ ] Verify "expired card" error
- [ ] Verify graceful UX (not a crash)

---

## US15.3: 3D Secure Authentication

**Goal**: Verify 3DS/SCA flow works correctly

### Successful 3DS
- [ ] Add product to cart, proceed to checkout
- [ ] Use card: `4000 0027 6000 3184`
- [ ] Verify 3DS authentication modal appears
- [ ] Click "Complete authentication" in test modal
- [ ] Verify payment succeeds
- [ ] Verify order created in admin

### Failed 3DS
- [ ] Use card: `4000 0000 0000 3063`
- [ ] Verify 3DS modal appears
- [ ] Click "Fail authentication" in test modal
- [ ] Verify payment fails gracefully
- [ ] Verify NO order created

---

## US15.4: Webhook Validation

**Goal**: Verify webhooks fire and process correctly

### Using Stripe CLI (Recommended)
```bash
# Install Stripe CLI (if not installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Note the webhook signing secret (whsec_...) and add to .env.local
```

### Test Steps
- [ ] Start webhook forwarding
- [ ] Complete a test purchase
- [ ] Verify CLI shows: `checkout.session.completed` received
- [ ] Verify order created (webhook processed successfully)

### Simulate Webhook Events
```bash
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed

# Trigger payment failure
stripe trigger payment_intent.payment_failed
```

- [ ] Verify events logged in terminal
- [ ] Verify appropriate handling (order created vs logged)

---

## US15.5: Discount Codes

**Goal**: Verify discount codes apply correctly through checkout

### Percentage Discount
- [ ] Create a test discount code in admin (e.g., TEST20 for 20% off)
- [ ] Add product to cart
- [ ] Apply discount code
- [ ] Verify discount appears in cart total
- [ ] Complete checkout with test card
- [ ] Verify Stripe shows discounted amount
- [ ] Verify order total in admin reflects discount
- [ ] Verify discount code usage count incremented

### Fixed Amount Discount
- [ ] Create fixed discount (e.g., SAVE5 for £5 off)
- [ ] Repeat test, verify £5 deducted

### Minimum Order Value
- [ ] Create discount with minimum order value
- [ ] Test with order below minimum (should reject)
- [ ] Test with order above minimum (should apply)

---

## US15.6: Shipping Zones

**Goal**: Verify correct shipping rates for different countries

### UK Shipping
- [ ] Checkout with UK address
- [ ] Verify UK shipping rates shown
- [ ] Complete purchase, verify shipping cost correct

### Ireland
- [ ] Checkout with IE address
- [ ] Verify Ireland shipping rates shown

### EU (e.g., France, Germany)
- [ ] Checkout with EU address
- [ ] Verify Europe shipping rates shown

### International (e.g., US, Australia)
- [ ] Checkout with international address
- [ ] Verify international shipping rates shown

---

## US15.7: Edge Cases

### Empty Cart
- [ ] Try to access `/checkout` with empty cart
- [ ] Verify redirect or appropriate message

### Session Expiry
- [ ] Start checkout, don't complete payment
- [ ] Wait for session to expire (or trigger via Stripe dashboard)
- [ ] Verify stock reservations released
- [ ] Verify no orphan order created

### Out of Stock During Checkout
- [ ] Add product with stock = 1
- [ ] Start checkout
- [ ] In another tab, manually set stock to 0
- [ ] Complete payment
- [ ] Verify order created with "on-hold" status
- [ ] Verify internal notes mention stock issue

---

## US15.8: Client Demo Script

**Goal**: A repeatable demo flow to show your client

### Demo Preparation
1. Ensure test mode is active
2. Have admin dashboard open in one browser
3. Have shop open in another browser/incognito
4. Clear any previous test orders if desired

### Demo Flow (5 minutes)

**Part 1: Customer Experience (2 min)**
1. "Let me show you the customer journey..."
2. Browse shop, pick a product
3. Add to cart, show cart updates
4. Checkout - show country selection
5. Enter test card: `4242 4242 4242 4242`
6. Complete payment
7. Show success page

**Part 2: Admin Experience (2 min)**
1. "Now let's see it from your perspective..."
2. Switch to admin dashboard
3. Show new order appeared immediately
4. Click into order - show all details captured
5. Show order timeline/events
6. Demonstrate marking as fulfilled
7. Show tracking number entry

**Part 3: Edge Case (1 min)**
1. "The system handles errors gracefully..."
2. Try a declined card: `4000 0000 0000 0002`
3. Show friendly error message
4. "No order created, no stock affected"

---

## Verification Checklist

Before marking epic complete:

### Technical
- [ ] All test cards produce expected results
- [ ] Webhooks fire and process correctly
- [ ] Stock decrements on successful purchase
- [ ] Discount codes apply and track usage
- [ ] Shipping rates correct for all zones
- [ ] Order events logged for audit trail

### Business
- [ ] Client has witnessed successful demo
- [ ] Client understands test vs live mode
- [ ] Client knows how to switch to live keys
- [ ] Confidence level: Ready for launch

---

## Notes

### Test Mode vs Live Mode

| Aspect | Test Mode | Live Mode |
|--------|-----------|-----------|
| API Keys | `sk_test_...`, `pk_test_...` | `sk_live_...`, `pk_live_...` |
| Cards | Test cards only | Real cards only |
| Money | No real charges | Real money moves |
| Webhooks | Need forwarding (local) | Production URL |

### Transitioning to Live
1. Get live API keys from Stripe Dashboard
2. Add to Vercel environment variables
3. Set up production webhook endpoint
4. Remove test webhook secret
5. Deploy
6. Do one real test purchase (can refund immediately)

---

## Resources

- [Stripe Test Cards](https://docs.stripe.com/testing)
- [Testing Use Cases](https://docs.stripe.com/testing-use-cases)
- [Stripe CLI](https://docs.stripe.com/stripe-cli)
- [Webhook Testing](https://docs.stripe.com/webhooks/test)
