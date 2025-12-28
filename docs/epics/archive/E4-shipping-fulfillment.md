# E4: Shipping & Fulfillment ✅ COMPLETE

> **Status**: COMPLETE
> **Completed**: All core shipping and fulfillment functionality implemented
> **Implementation Date**: December 2024

### What Was Built
- Shipping zones & rates schema with admin configuration UI
- Checkout integration with weight-based shipping calculation
- Free shipping threshold (£50 UK) with progress bar in cart
- Customs/DDU messaging for international orders
- Order fulfillment workflow with status transitions
- Shipping confirmation emails with tracking info
- Packing slip printing
- Bulk order status updates

**Priority**: P0
**Complexity**: Medium
**Dependencies**: E3 (Checkout & Payments)

## Overview

Implement shipping rate calculation based on weight and destination zones, order fulfillment workflow, and tracking integration. Herbarium Dyeworks ships from Northern Ireland with specific considerations for UK, Ireland, EU, and international destinations.

## Business Value

- Accurate shipping costs prevent losses
- Weight-based rates match actual courier costs
- Zone-based pricing supports international expansion
- Tracking reduces customer support queries

## Business Context

### Shipping Zones & Rates

| Zone | Countries | Carrier | Rates |
|------|-----------|---------|-------|
| UK | GB | Royal Mail / Evri | £1.95 - £8.25 |
| Ireland | IE | An Post | £3.25 - £15.00 |
| Europe | EU (excl. DE) | Royal Mail Int | £4.95 - £15.00 |
| International | ROW | Royal Mail Int | £22.00 - £28.00 |

### Customs Considerations

| Destination | Duties | Approach |
|-------------|--------|----------|
| EU | None | NI Windsor Framework - treat as EU origin |
| US | Pre-paid | DDP (Delivered Duty Paid) - include in price |
| ROW | Customer pays | DDU (Delivered Duty Unpaid) - clear on checkout |

### Weight Categories

Typical product weights:
- Single skein: 100-115g
- Mini skein set: 200-250g
- Yarn kit: 400-600g

## User Stories

### US4.1: Calculate Shipping at Checkout
**As a** customer
**I want to** see shipping options and costs
**So that** I know the total before paying

**Acceptance Criteria:**
- [x] Shipping options shown in Stripe Checkout
- [x] Rate calculated based on cart weight
- [x] Multiple options where available (standard/tracked)
- [x] Free shipping threshold applied (UK: £50+)
- [x] Clear delivery time estimates

### US4.2: Weight-Based Rate Calculation ✅
**As a** store owner
**I want to** rates calculated by total weight
**So that** shipping costs match actual courier charges

**Acceptance Criteria:**
- [x] Sum product weights from cart items
- [x] Match weight to rate tier (e.g., 0-100g, 101-250g)
- [x] Select appropriate zone by destination country
- [x] Handle edge cases (just over threshold)

### US4.3: Free Shipping Promotion ✅
**As a** customer
**I want to** get free shipping on large orders
**So that** I'm incentivized to buy more

**Acceptance Criteria:**
- [x] Free UK shipping on orders £50+
- [x] Show "£X away from free shipping" in cart (with progress bar)
- [x] Clear messaging about free shipping threshold
- [x] Only applies to standard shipping

### US4.4: Customs Messaging ✅
**As a** customer outside UK/EU
**I want to** understand potential customs charges
**So that** I'm not surprised by fees on delivery

**Acceptance Criteria:**
- [x] DDU warning for ROW destinations
- [x] Clear at checkout (before Stripe redirect)
- [x] DDP confirmation for US (no additional fees)
- [x] No warning for UK/EU orders

### US4.5: Order Fulfillment Workflow ✅
**As a** store owner
**I want to** manage order fulfillment
**So that** I can ship orders efficiently

**Acceptance Criteria:**
- [x] Orders list in admin (pending → processing → shipped)
- [x] Print packing slip
- [x] Add tracking number
- [x] Mark as shipped (triggers email)
- [x] Bulk fulfillment for multiple orders

### US4.6: Tracking Updates ✅
**As a** customer
**I want to** track my order
**So that** I know when it will arrive

**Acceptance Criteria:**
- [x] Tracking number in shipping confirmation email
- [x] Tracking link to carrier website
- [ ] Order status page shows tracking (deferred to E5: Customer Accounts)
- [x] Status: Processing → Shipped → Delivered

## Technical Approach

### Shipping Rate Calculation

```typescript
interface ShippingRate {
  id: number;
  name: string;
  price: number;
  estimatedDays: string;
  tracked: boolean;
}

async function calculateShippingRates(
  countryCode: string,
  totalWeightGrams: number,
  subtotal: number
): Promise<ShippingRate[]> {
  // Find applicable zone
  const zone = await db.query.shippingZones.findFirst({
    where: sql`JSON_EXTRACT(countries, '$') LIKE ${'%' + countryCode + '%'}`,
    with: { rates: true },
  });

  if (!zone) {
    throw new Error(`No shipping available to ${countryCode}`);
  }

  // Filter rates by weight
  const applicableRates = zone.rates.filter(rate =>
    totalWeightGrams >= (rate.minWeightGrams ?? 0) &&
    (!rate.maxWeightGrams || totalWeightGrams <= rate.maxWeightGrams)
  );

  // Check for free shipping (UK only, £50+)
  if (countryCode === 'GB' && subtotal >= 50) {
    const standardRate = applicableRates.find(r => !r.tracked);
    if (standardRate) {
      return [{
        ...standardRate,
        price: 0,
        name: `${standardRate.name} (Free over £50)`,
      }];
    }
  }

  return applicableRates;
}
```

### Cart Weight Calculation

```typescript
async function calculateCartWeight(items: CartItem[]): Promise<number> {
  let totalWeight = 0;

  for (const item of items) {
    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, item.variantId),
    });

    // Default to 100g if not set
    const weight = variant?.weightGrams ?? 100;
    totalWeight += weight * item.quantity;
  }

  return totalWeight;
}
```

### Stripe Shipping Options

```typescript
async function getStripeShippingOptions(
  cart: Cart,
  subtotal: number
): Promise<Stripe.Checkout.SessionCreateParams.ShippingOption[]> {
  const cartItems = JSON.parse(cart.items);
  const weight = await calculateCartWeight(cartItems);

  // Get rates for all zones (Stripe will filter by entered address)
  const allZones = await db.query.shippingZones.findMany({
    with: { rates: true },
  });

  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];

  for (const zone of allZones) {
    const countries = JSON.parse(zone.countries);
    const rates = zone.rates.filter(r =>
      weight >= (r.minWeightGrams ?? 0) &&
      (!r.maxWeightGrams || weight <= r.maxWeightGrams)
    );

    for (const rate of rates) {
      // Check for free shipping (UK only)
      const isFree = countries.includes('GB') && subtotal >= 50 && !rate.tracked;

      shippingOptions.push({
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: isFree ? 0 : Math.round(rate.price * 100),
            currency: 'gbp',
          },
          display_name: isFree
            ? `${rate.name} (Free over £50)`
            : rate.name,
          delivery_estimate: {
            minimum: { unit: 'business_day', value: parseInt(rate.estimatedDays?.split('-')[0] ?? '3') },
            maximum: { unit: 'business_day', value: parseInt(rate.estimatedDays?.split('-')[1] ?? '7') },
          },
          metadata: {
            zone_id: zone.id.toString(),
            rate_id: rate.id.toString(),
          },
        },
      });
    }
  }

  return shippingOptions;
}
```

### Database Seed Data

```typescript
// Seed shipping zones and rates
const ukZone = await db.insert(shippingZones).values({
  name: 'United Kingdom',
  countries: JSON.stringify(['GB']),
}).returning();

await db.insert(shippingRates).values([
  { zoneId: ukZone[0].id, name: 'Royal Mail Large Letter', minWeightGrams: 0, maxWeightGrams: 100, price: 1.95, estimatedDays: '2-3', tracked: false },
  { zoneId: ukZone[0].id, name: 'Royal Mail Small Parcel', minWeightGrams: 101, maxWeightGrams: 500, price: 3.95, estimatedDays: '2-3', tracked: false },
  { zoneId: ukZone[0].id, name: 'Royal Mail Tracked 24', minWeightGrams: 0, maxWeightGrams: 2000, price: 5.95, estimatedDays: '1-2', tracked: true },
  { zoneId: ukZone[0].id, name: 'Evri Standard', minWeightGrams: 501, maxWeightGrams: 2000, price: 4.25, estimatedDays: '3-5', tracked: true },
]);

// Similar for IE, EU, International zones...
```

### API Routes

```
GET /api/shipping/rates
  Query: ?country=GB&weight=250
  Response: { rates: ShippingRate[] }

POST /api/orders/[id]/fulfill
  Body: { trackingNumber?: string, carrier?: string }
  Response: { order: Order }

POST /api/orders/[id]/tracking
  Body: { trackingNumber: string, trackingUrl: string }
  Response: { order: Order }
```

### Components

```
components/
├── shipping/
│   ├── free-shipping-bar.tsx   # "£X away from free shipping"
│   └── customs-notice.tsx      # DDU/DDP messaging
├── orders/
│   ├── order-status.tsx        # Status badge
│   └── tracking-info.tsx       # Tracking display
```

## Fulfillment Workflow

### Order States

```
pending → processing → shipped → delivered
    │         │           │
    └─────────┴───────────┴──→ cancelled/refunded
```

### Admin Actions

1. **Mark Processing**: Order acknowledged, preparing to ship
2. **Add Tracking**: Enter tracking number and carrier
3. **Mark Shipped**: Triggers shipping confirmation email
4. **Mark Delivered**: Manual or auto (future: carrier webhook)

### Email Templates

- **Order Confirmed**: Order details, estimated shipping
- **Order Shipped**: Tracking number, link, estimated delivery
- **Delivered**: (Optional) Review request

## Testing Strategy

### Unit Tests
- Weight calculation from cart
- Rate tier matching
- Free shipping threshold logic
- Zone detection from country code

### Integration Tests
- Shipping rate API endpoint
- Fulfillment status transitions
- Email sending on status change

### E2E Tests
- Checkout with different destinations
- Verify correct rate applied
- Admin fulfillment workflow

## Data Migration

Seed production database with current shipping rates:

```bash
npm run db:seed:shipping
```

## Rollout Plan

1. **Dev**: Implement rate calculation, test with mock data
2. **Staging**: Verify rates match actual courier pricing
3. **Production**: Enable with checkout

## Open Questions

- [ ] Carrier integrations: Manual tracking entry or API?
- [ ] Local pickup option for Belfast area?
- [ ] Signature required for high-value orders?

## Definition of Done

- [x] All user stories complete with acceptance criteria met
- [x] Shipping rates match actual courier pricing
- [x] Free shipping applied correctly
- [x] Customs messaging clear for international
- [x] Fulfillment workflow tested
- [x] Code reviewed and merged

## Files Created/Modified

### New Files
- `lib/email/shipping-confirmation.tsx` - Shipping confirmation email template
- `lib/email/send-shipping-confirmation.ts` - Email sending function
- `app/admin/orders/[id]/packing-slip/page.tsx` - Packing slip page
- `app/admin/orders/[id]/packing-slip/packing-slip.tsx` - Printable packing slip component
- `app/admin/orders/orders-list.tsx` - Orders list with bulk actions
- `app/api/admin/orders/bulk/route.ts` - Bulk order update API

### Modified Files
- `app/api/admin/orders/[id]/route.ts` - Added shipping email trigger
- `app/admin/orders/[id]/order-detail.tsx` - Added packing slip button
- `app/admin/orders/page.tsx` - Integrated bulk actions component
- `components/cart/cart-summary.tsx` - Added free shipping progress bar
- `components/cart/cart-drawer.tsx` - Added compact free shipping bar
- `app/checkout/page.tsx` - Added customs/DDU messaging
