# E3: Checkout & Payments 🚨 TODO - CRITICAL

> **Status**: NOT STARTED - BLOCKS ALL SALES
> **Blocker**: Cannot process orders without this epic
> **Next Steps**: Implement Stripe Checkout integration, order creation, confirmation emails

**Priority**: P0
**Complexity**: High
**Dependencies**: E2 (Shopping Cart), Stripe account setup

## Overview

Implement secure checkout flow using Stripe Checkout Sessions. Customers complete payment on Stripe's hosted page, then return to order confirmation. This approach offloads PCI compliance and handles 3D Secure automatically.

## Business Value

- Accept payments and complete sales
- PCI compliance without infrastructure burden
- Support for all major payment methods (cards, Apple Pay, Google Pay)
- Automatic fraud protection via Stripe Radar
- Multi-currency support via Adaptive Pricing (17.8% avg uplift in cross-border revenue)
- Local payment methods unlocked (iDEAL, Bancontact, SEPA, Alipay)

## User Stories

### US3.1: Initiate Checkout
**As a** customer
**I want to** proceed to checkout from my cart
**So that** I can complete my purchase

**Acceptance Criteria:**
- [ ] "Checkout" button validates cart before proceeding
- [ ] Show error if cart is empty or has stock issues
- [ ] Collect email if guest (for order updates)
- [ ] Redirect to Stripe Checkout

### US3.2: Complete Payment
**As a** customer
**I want to** pay securely
**So that** I can complete my order

**Acceptance Criteria:**
- [ ] Stripe Checkout with cart line items
- [ ] Support card payments
- [ ] Support Apple Pay / Google Pay where available
- [ ] 3D Secure handled automatically
- [ ] Clear pricing with shipping and tax

### US3.3: Order Confirmation
**As a** customer
**I want to** see my order confirmation
**So that** I know my purchase was successful

**Acceptance Criteria:**
- [ ] Confirmation page with order number
- [ ] Order summary (items, shipping, total)
- [ ] Shipping address and estimated delivery
- [ ] Email confirmation sent
- [ ] Clear cart after successful order
- [ ] Link to track order (if account exists)

### US3.4: Payment Failure Handling
**As a** customer
**I want to** know if my payment failed
**So that** I can try again or use a different method

**Acceptance Criteria:**
- [ ] Clear error message on failure
- [ ] Return to checkout with cart intact
- [ ] Suggest trying different payment method
- [ ] No order created for failed payments

### US3.5: Apply Discount Code
**As a** customer
**I want to** apply a discount code
**So that** I can receive promotional pricing

**Acceptance Criteria:**
- [ ] Discount code input field
- [ ] Validate code before checkout
- [ ] Show discount amount
- [ ] Support percentage and fixed discounts
- [ ] Error for invalid/expired codes

### US3.6: Collect Shipping Address
**As a** customer
**I want to** enter my shipping address
**So that** I can receive my order

**Acceptance Criteria:**
- [ ] Stripe Checkout collects shipping address
- [ ] Validate against allowed shipping countries
- [ ] Calculate shipping cost based on zone
- [ ] Store address for future orders (if logged in)

### US3.7: Multi-Currency Support (Adaptive Pricing)
**As an** international customer
**I want to** see prices in my local currency
**So that** I understand what I'm paying without mental conversion

**Acceptance Criteria:**
- [ ] Enable Stripe Adaptive Pricing in Dashboard
- [ ] Customers see prices converted to their local currency at checkout
- [ ] 150+ currencies supported automatically
- [ ] Settlement always in GBP (no FX risk for merchant)
- [ ] Refunds handled automatically in customer's currency

**Implementation Notes:**
- Zero code changes required - Stripe handles conversion automatically
- Customer pays 2-4% conversion fee (built into exchange rate)
- Exchange rate guaranteed for 24 hours
- Unlocks local payment methods (iDEAL, Bancontact, SEPA, Alipay, etc.)
- Can be enabled per-session via `adaptive_pricing: { enabled: true }` parameter

**References:**
- [Stripe Adaptive Pricing Docs](https://docs.stripe.com/payments/checkout/adaptive-pricing)
- [Stripe Adaptive Pricing Support](https://support.stripe.com/questions/adaptive-pricing)

## Technical Approach

### Stripe Integration Strategy

**Stripe Checkout** (Hosted Payment Page) rather than Stripe Elements because:
- PCI compliance offloaded entirely
- 3D Secure handled automatically
- Apple Pay/Google Pay work out of the box
- Minimal frontend complexity

### Checkout Flow

```
[Cart Page]
    │
    ▼
[POST /api/checkout/session] ──→ Creates Stripe Checkout Session
    │                              - Line items from cart
    │                              - Shipping zones config
    │                              - Discount if applied
    ▼
[Redirect to Stripe Checkout]
    │
    ▼
[Customer completes payment on Stripe]
    │
    ├─── Success ──→ [/checkout/success?session_id=xxx]
    │                    │
    │                    ▼
    │                [GET /api/checkout/verify]
    │                    │
    │                    ▼
    │                [Create Order in DB]
    │                    │
    │                    ▼
    │                [Clear Cart]
    │                    │
    │                    ▼
    │                [Order Confirmation Page]
    │
    └─── Cancel ───→ [/cart] (cart preserved)
```

### Webhook Flow

```
[Stripe Webhook: checkout.session.completed]
    │
    ▼
[POST /api/webhooks/stripe]
    │
    ▼
[Verify webhook signature]
    │
    ▼
[Create/update order in DB]
    │
    ▼
[Send confirmation email]
    │
    ▼
[Update inventory]
```

### API Routes

```
POST /api/checkout/session
  Body: { discountCode?: string }
  Response: { sessionUrl: string }

GET /api/checkout/verify?session_id=xxx
  Response: { order: Order }

POST /api/webhooks/stripe
  Headers: stripe-signature
  Body: Stripe Event
  Response: { received: true }

POST /api/discount/validate
  Body: { code: string, subtotal: number }
  Response: { valid: boolean, discount?: DiscountInfo }
```

### Stripe Checkout Session Creation

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createCheckoutSession(cart: Cart, discountCode?: string) {
  // Build line items from cart
  const lineItems = cart.items.map(item => ({
    price_data: {
      currency: 'gbp',
      product_data: {
        name: `${item.productName} - ${item.variantName}`,
        images: item.image ? [item.image] : [],
      },
      unit_amount: Math.round(item.price * 100), // Stripe uses cents
    },
    quantity: item.quantity,
  }));

  // Shipping options based on zone detection
  const shippingOptions = await getShippingOptions(cart);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    shipping_address_collection: {
      allowed_countries: ALLOWED_SHIPPING_COUNTRIES,
    },
    shipping_options: shippingOptions,
    // Multi-currency: Adaptive Pricing shows local currency to customers
    // Enable in Dashboard or per-session here (customer pays 2-4% conversion fee)
    adaptive_pricing: { enabled: true },
    success_url: `${process.env.NEXT_PUBLIC_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cart`,
    metadata: {
      cartId: cart.id.toString(),
    },
  };

  // Apply discount if valid
  if (discountCode) {
    const coupon = await getOrCreateStripeCoupon(discountCode);
    if (coupon) {
      sessionParams.discounts = [{ coupon: coupon.id }];
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session;
}
```

### Webhook Handler

```typescript
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleSuccessfulPayment(session);
  }

  return Response.json({ received: true });
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  // Check if order already exists (idempotency)
  const existingOrder = await db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, session.id),
  });

  if (existingOrder) return; // Already processed

  // Get cart and create order
  const cartId = parseInt(session.metadata!.cartId);
  const cart = await db.query.carts.findFirst({
    where: eq(carts.id, cartId),
  });

  const orderNumber = generateOrderNumber(); // e.g., "HD-20240115-001"

  // Create order
  const [order] = await db.insert(orders).values({
    orderNumber,
    email: session.customer_details!.email!,
    status: 'pending',
    paymentStatus: 'paid',
    subtotal: session.amount_subtotal! / 100,
    shippingCost: session.shipping_cost?.amount_total! / 100 || 0,
    total: session.amount_total! / 100,
    shippingAddress: JSON.stringify(session.shipping_details?.address),
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent as string,
  }).returning();

  // Create order items
  const cartItems = JSON.parse(cart.items);
  await db.insert(orderItems).values(
    cartItems.map(item => ({
      orderId: order.id,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      price: item.price,
    }))
  );

  // Update inventory
  for (const item of cartItems) {
    await db.update(productVariants)
      .set({ stock: sql`stock - ${item.quantity}` })
      .where(eq(productVariants.id, item.variantId));
  }

  // Clear cart
  await db.delete(carts).where(eq(carts.id, cartId));

  // Send confirmation email
  await sendOrderConfirmation(order, cartItems);
}
```

### Order Number Generation

```typescript
async function generateOrderNumber(): Promise<string> {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

  // Get today's order count
  const todayStart = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const count = await db.select({ count: sql`count(*)` })
    .from(orders)
    .where(gte(orders.createdAt, todayStart));

  const sequence = (count[0].count as number) + 1;
  return `HD-${dateStr}-${sequence.toString().padStart(3, '0')}`;
}
```

### Components

```
components/
├── checkout/
│   ├── checkout-button.tsx     # Initiates checkout
│   ├── discount-input.tsx      # Discount code field
│   └── order-summary.tsx       # Order confirmation display
```

### Page Routes

```
app/
├── checkout/
│   └── success/
│       └── page.tsx            # Order confirmation
```

## Discount Code Handling

### Validation

```typescript
async function validateDiscountCode(code: string, subtotal: number) {
  const discount = await db.query.discountCodes.findFirst({
    where: and(
      eq(discountCodes.code, code.toUpperCase()),
      eq(discountCodes.active, true),
    ),
  });

  if (!discount) {
    return { valid: false, error: 'Invalid discount code' };
  }

  // Check expiry
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
    return { valid: false, error: 'This code has expired' };
  }

  // Check minimum order
  if (discount.minOrderValue && subtotal < discount.minOrderValue) {
    return {
      valid: false,
      error: `Minimum order of £${discount.minOrderValue} required`
    };
  }

  // Check usage limit
  if (discount.maxUses && discount.usesCount >= discount.maxUses) {
    return { valid: false, error: 'This code has reached its usage limit' };
  }

  return {
    valid: true,
    discount: {
      type: discount.type,
      value: discount.value,
      amount: discount.type === 'percentage'
        ? subtotal * (discount.value / 100)
        : discount.value,
    },
  };
}
```

## Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_URL=https://herbarium-dyeworks.com
```

## Testing Strategy

### Unit Tests
- Order number generation
- Discount calculation
- Shipping rate selection

### Integration Tests
- Checkout session creation
- Webhook signature verification
- Order creation from webhook

### E2E Tests (Stripe Test Mode)
- Complete checkout flow with test card
- Failed payment handling
- Discount code application
- Various shipping addresses

### Stripe Test Cards
- `4242424242424242` - Success
- `4000000000000002` - Decline
- `4000002500003155` - 3D Secure required

## Security Considerations

- Never log full card details (handled by Stripe)
- Webhook signature verification mandatory
- Idempotency in webhook handler (check existing order)
- Rate limiting on checkout session creation
- HTTPS only in production

## Rollout Plan

1. **Dev**: Test mode integration
2. **Staging**: End-to-end with test payments
3. **Production**:
   - Enable live mode
   - Verify webhook endpoint
   - Place test order with real card (refund)

## Open Questions

- [ ] Tax handling: Inclusive in price or calculate?
- [ ] Guest checkout email: require before or collect in Stripe?
- [ ] Order confirmation email template design?

## Resolved Decisions

- [x] **Multi-currency**: Use Stripe Adaptive Pricing (zero code, customer pays conversion fee, we settle in GBP)

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Stripe test mode working end-to-end
- [ ] Webhook reliability tested
- [ ] Error handling comprehensive
- [ ] Order confirmation emails sending
- [ ] Inventory updates correctly
- [ ] Security review passed
- [ ] Code reviewed and merged
