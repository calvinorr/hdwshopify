# Customer Experience Improvement Plan

## Current State Summary

The storefront has strong visual design and solid foundations:
- Beautiful homepage with hero carousel and trust signals
- Product filtering and sorting works well
- Cart with optimistic updates and session persistence
- Responsive design throughout

**Critical Blocker:** Checkout is incomplete - customers cannot purchase.

---

## Phase 1: Complete Checkout (CRITICAL)

### 1.1 Customer Information Form

```
Checkout ─────────────────────────────────────────────────

Contact
┌─────────────────────────────────────────────────────────┐
│ Email *            [________________________]           │
│ ☑ Email me with news and offers                        │
└─────────────────────────────────────────────────────────┘

Shipping Address
┌─────────────────────────────────────────────────────────┐
│ First Name *       [____________] Last Name [________]  │
│ Address *          [____________________________________]│
│ Apartment, etc.    [____________________________________]│
│ City *             [____________] Postcode [___________]│
│ Country *          [United Kingdom ▾]                   │
│ Phone              [____________________________________]│
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Create `app/checkout/page.tsx` with multi-step form
- Use React Hook Form + Zod validation
- Save address to `addresses` table if logged in
- Guest checkout with email only

### 1.2 Shipping Method Selection

```
Shipping Method
┌─────────────────────────────────────────────────────────┐
│ ◉ Royal Mail Tracked (2-3 days)              £3.95     │
│ ○ Royal Mail 1st Class (1-2 days)            £5.95     │
│ ○ DPD Next Day                               £8.25     │
└─────────────────────────────────────────────────────────┘
│ 🎉 Spend £12.05 more for FREE shipping!                │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Query shipping rates based on address country + cart weight
- Show free shipping progress bar
- Calculate from `shippingZones` and `shippingRates` tables

### 1.3 Stripe Payment Integration

```
Payment
┌─────────────────────────────────────────────────────────┐
│ Card Number        [4242 4242 4242 4242]               │
│ Expiry             [12/26]    CVC [123]                │
│                                                         │
│ 🔒 Secure payment powered by Stripe                    │
└─────────────────────────────────────────────────────────┘

         [Complete Order · £47.95]
```

**Implementation:**
- Stripe Elements for PCI compliance
- Create Payment Intent on server
- Handle 3D Secure authentication
- Process payment and create order

### 1.4 Order Confirmation

```
✓ Order Confirmed!
──────────────────────────────────────────────────────────

Order #HD-1048
Thank you, Jane! We've received your order.

A confirmation email has been sent to jane@example.com

┌─────────────────────────────────────────────────────────┐
│ Order Summary                                           │
│ Madder Red DK - Natural White    x2        £56.00      │
│ Weld Yellow 4ply - Charcoal      x1        £24.00      │
│ ─────────────────────────────────────────────          │
│ Subtotal                                    £80.00      │
│ Shipping (Royal Mail Tracked)                £3.95      │
│ Total                                       £83.95      │
└─────────────────────────────────────────────────────────┘

Shipping to:
Jane Smith
123 High Street
Edinburgh EH1 1AA
United Kingdom

[Continue Shopping]    [Track Your Order]
```

**Implementation:**
- Create order in database with items
- Send confirmation email via Resend
- Clear cart after successful payment
- Generate order number (HD-XXXX format)

### 1.5 Discount Codes

```
┌─────────────────────────────────────────────────────────┐
│ Discount Code      [WELCOME10    ] [Apply]             │
│ ✓ WELCOME10 applied: 10% off                           │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Validate against `discountCodes` table
- Apply percentage or fixed discount
- Check usage limits and expiry
- Show discount in order summary

---

## Phase 2: Customer Accounts

### 2.1 Account Dashboard

```
/account
──────────────────────────────────────────────────────────

Welcome back, Jane!

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ 📦 Orders    │ 📍 Addresses │ ❤️ Wishlist  │ ⚙️ Settings  │
│ View history │ Manage       │ 3 items      │ Preferences  │
└──────────────┴──────────────┴──────────────┴──────────────┘

Recent Orders
──────────────────────────────────────────────────────────
#HD-1048  ·  Dec 20, 2025  ·  £83.95  ·  Shipped
#HD-1032  ·  Nov 15, 2025  ·  £45.00  ·  Delivered
                                        [View All Orders →]
```

### 2.2 Order History & Tracking

```
/account/orders/HD-1048
──────────────────────────────────────────────────────────

Order #HD-1048
Placed December 20, 2025

Status: Shipped 📦
────●────────●────────●────────○────────
   Placed    Paid    Shipped  Delivered

Tracking: RM123456789GB
[Track on Royal Mail →]

Items
┌─────────────────────────────────────────────────────────┐
│ [img] Madder Red DK - Natural White   x2      £56.00   │
│ [img] Weld Yellow 4ply - Charcoal     x1      £24.00   │
└─────────────────────────────────────────────────────────┘

Shipping Address              Payment
Jane Smith                    Visa ending 4242
123 High Street               £83.95
Edinburgh EH1 1AA

[Reorder These Items]   [Need Help?]
```

### 2.3 Saved Addresses

```
/account/addresses
──────────────────────────────────────────────────────────

Your Addresses                          [+ Add New Address]

┌─────────────────────────┐  ┌─────────────────────────┐
│ Home ★ (Default)        │  │ Work                    │
│ Jane Smith              │  │ Jane Smith              │
│ 123 High Street         │  │ Acme Corp               │
│ Edinburgh EH1 1AA       │  │ 456 Business Park       │
│ United Kingdom          │  │ Glasgow G1 1AA          │
│                         │  │ United Kingdom          │
│ [Edit] [Delete]         │  │ [Edit] [Set Default]    │
└─────────────────────────┘  └─────────────────────────┘
```

### 2.4 Wishlist

```
/account/wishlist
──────────────────────────────────────────────────────────

Your Wishlist (3 items)

┌───────────────────────────────────────────────────────┐
│ [img] Madder Red DK           £28.00    [Add to Cart] │
│       4 variants available              [Remove]      │
├───────────────────────────────────────────────────────┤
│ [img] Indigo Blues Aran       £32.00    Out of Stock  │
│       Added Nov 12            [Notify When Available] │
├───────────────────────────────────────────────────────┤
│ [img] Weld Yellow 4ply        £24.00    [Add to Cart] │
│       6 in stock                        [Remove]      │
└───────────────────────────────────────────────────────┘
```

---

## Phase 3: Product Experience

### 3.1 Product Image Gallery

**Current:** Single image display
**Improvement:** Full gallery with zoom

```
┌─────────────────────────────────────────┐
│                                         │
│           [Main Product Image]          │
│              🔍 Click to zoom           │
│                                         │
└─────────────────────────────────────────┘
  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
  │ 1  │ │ 2  │ │ 3  │ │ 4  │ │ 5  │  ← Thumbnails
  └────┘ └────┘ └────┘ └────┘ └────┘
```

**Implementation:**
- Image thumbnails below main image
- Lightbox/zoom on click
- Swipe gestures on mobile
- Keyboard navigation (← →)

### 3.2 Variant Color Swatches

**Current:** Dropdown or text buttons
**Improvement:** Visual color swatches

```
Colorway
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ ███ │ │ ███ │ │ ███ │ │ ███ │ │ ░░░ │
│ Nat │ │ Grey│ │ Char│ │ Rose│ │ Sold│
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘
  ✓ Selected: Natural White · £28.00 · 12 in stock
```

**Implementation:**
- Add `colorHex` field to variants
- Render actual color swatches
- Grey out sold-out variants
- Update price/stock on selection

### 3.3 Product Reviews

```
Customer Reviews ★★★★☆ (4.2 average · 23 reviews)
──────────────────────────────────────────────────────────

[Write a Review]

★★★★★  Beautiful yarn!                    Jane S. · Dec 15
The color is even more vibrant in person. Lovely to work
with and the natural dye smell is wonderful.
                                          [Helpful (3)]

★★★★☆  Great quality, slow shipping      Bob W. · Dec 10
The yarn itself is gorgeous but took 2 weeks to arrive.
                                          [Helpful (1)]

[Load More Reviews]
```

**Implementation:**
- Create `reviews` table (productId, customerId, rating, title, body, verified)
- Email customers post-delivery asking for review
- Moderation queue in admin
- Aggregate rating display

### 3.4 Related Products

```
You Might Also Like
──────────────────────────────────────────────────────────
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│  [img]  │ │  [img]  │ │  [img]  │ │  [img]  │
│ Weld    │ │ Indigo  │ │ Madder  │ │ Woad    │
│ Yellow  │ │ Blues   │ │ Pink    │ │ Blue    │
│ £24.00  │ │ £28.00  │ │ £28.00  │ │ £26.00  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

Same weight: DK                    [View All DK Yarns →]
```

**Implementation:**
- Query products with same weight/category
- Exclude current product
- Limit to 4 items
- Optional: ML-based recommendations later

### 3.5 Stock Notifications

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Sold Out                                             │
│                                                         │
│ Get notified when this variant is back in stock:       │
│ Email: [________________________] [Notify Me]          │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Create `stockNotifications` table
- Collect email for out-of-stock variants
- Trigger email when restocked (via admin or API hook)

---

## Phase 4: Discovery & Search

### 4.1 Search Autocomplete

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 madd                                                 │
├─────────────────────────────────────────────────────────┤
│ Products                                                │
│   [img] Madder Red DK                    £28.00        │
│   [img] Madder Pink 4ply                 £24.00        │
│                                                         │
│ Collections                                             │
│   🏷️ Natural Reds                                       │
│                                                         │
│ 🔍 Search for "madd"                     [Enter]       │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Debounced API call on keypress
- Search products, collections, pages
- Show top 5 results per category
- Keyboard navigation (↑↓ Enter)

### 4.2 Quick View Modal

**Current:** Button exists but non-functional
**Improvement:** Full quick view implementation

```
┌─────────────────────────────────────────────────────────┐
│                                              [X Close]  │
│  ┌────────────┐  Madder Red DK                         │
│  │            │  ★★★★☆ (4.2) · 23 reviews              │
│  │   [img]    │                                         │
│  │            │  £28.00                                 │
│  └────────────┘                                         │
│                 Colorway: [Natural ▾]                   │
│                 Quantity: [1] [−] [+]                   │
│                                                         │
│                 [Add to Cart]                           │
│                 [View Full Details →]                   │
└─────────────────────────────────────────────────────────┘
```

### 4.3 Filter Improvements

Add to product listing:
- **Result count per filter:** "DK (12)" "4ply (8)"
- **Price range slider**
- **Color filter** (when swatches implemented)
- **"New Arrivals" filter** (added in last 30 days)
- **Persistent filter state** in URL

### 4.4 Breadcrumb Navigation

```
Home > Collections > DK Weight > Madder Red DK
```

Add breadcrumbs to:
- Product detail pages ✓ (already exists)
- Collection pages
- Information pages

---

## Phase 5: Cart & Conversion

### 5.1 Mini Cart Drawer

**Current:** Navigate to /cart page
**Improvement:** Slide-out cart preview

```
                              ┌───────────────────────────┐
                              │ Your Cart (2 items)    X │
                              ├───────────────────────────┤
                              │ [img] Madder Red DK      │
                              │       Natural · £28.00   │
                              │       Qty: [−] 2 [+]     │
                              │                          │
                              │ [img] Weld Yellow        │
                              │       Charcoal · £24.00  │
                              │       Qty: [−] 1 [+]     │
                              ├───────────────────────────┤
                              │ Subtotal         £80.00  │
                              │ 🎉 FREE shipping!        │
                              │                          │
                              │ [View Cart]              │
                              │ [Checkout →]             │
                              └───────────────────────────┘
```

**Implementation:**
- Sheet component triggered by cart icon
- Show last 3 items (scrollable if more)
- Quick quantity adjustment
- Direct checkout link

### 5.2 Cart Upsells

```
You're £12.05 away from FREE shipping!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 76%

Add a mini skein to qualify:
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Mini    │ │ Mini    │ │ Mini    │
│ Madder  │ │ Weld    │ │ Indigo  │
│ £8.00   │ │ £8.00   │ │ £8.00   │
│[+ Add]  │ │[+ Add]  │ │[+ Add]  │
└─────────┘ └─────────┘ └─────────┘
```

### 5.3 Abandoned Cart Recovery

**Implementation:**
- Store cart with customer email (if provided)
- Send reminder email after 24 hours
- Include cart contents and return link
- Offer small discount on second email (optional)

---

## Phase 6: Communication

### 6.1 Transactional Emails

| Trigger | Email |
|---------|-------|
| Order placed | Order confirmation |
| Payment received | Payment receipt |
| Order shipped | Shipping notification with tracking |
| Order delivered | Delivery confirmation + review request |
| Password reset | Reset link |
| Account created | Welcome email |

**Implementation:**
- Resend integration (already in env vars)
- React Email templates for consistency
- Branded header/footer

### 6.2 Newsletter Signup

**Current:** Form exists but doesn't work
**Fix:** Connect to email service

```
┌─────────────────────────────────────────────────────────┐
│ 📬 Join Our Flock                                       │
│                                                         │
│ Get early access to new colorways and natural dye tips │
│                                                         │
│ Email: [________________________] [Subscribe]          │
│                                                         │
│ ✓ Subscribed! Check your inbox for a welcome gift.    │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**
- Create `newsletterSubscribers` table or use Resend audiences
- Double opt-in confirmation email
- Unsubscribe link in all emails
- GDPR compliant

### 6.3 Contact Form

```
/contact
──────────────────────────────────────────────────────────

Get in Touch

We'd love to hear from you! Fill out the form below and
we'll get back to you within 24 hours.

Name *          [________________________]
Email *         [________________________]
Subject         [Order inquiry ▾]
Message *       [________________________]
                [________________________]
                [________________________]

                [Send Message]

Or email us directly: hello@herbarium-dyeworks.com
```

**Implementation:**
- Server action to send email via Resend
- Auto-reply confirmation to customer
- Forward to admin email

---

## Phase 7: Trust & Conversion

### 7.1 Trust Badges

Add throughout checkout:
```
🔒 Secure Checkout    💳 Visa/MC/Amex    📦 Free UK Shipping £50+
```

Footer trust section:
```
───────────────────────────────────────────────────────────
  [Stripe]  [Visa]  [MC]  [Amex]  [PayPal?]  [Apple Pay?]
───────────────────────────────────────────────────────────
```

### 7.2 Social Proof

Homepage additions:
- Customer testimonial carousel
- Instagram feed integration (real posts)
- "As seen in" press mentions
- Order counter ("500+ happy customers")

### 7.3 Urgency & Scarcity

Subtle, honest indicators:
```
⚡ Only 3 left in stock
🔥 Popular choice - 12 sold this week
```

---

## Phase 8: Polish & Performance

### 8.1 Loading States

Add skeleton loaders for:
- Product grid while filtering
- Cart updates
- Checkout form submissions

### 8.2 Error Handling

- Friendly error pages (404, 500)
- Form validation with inline messages
- Payment failure recovery
- Stock changed during checkout handling

### 8.3 Accessibility

- Keyboard navigation for all interactions
- Screen reader labels
- Color contrast compliance
- Focus states visible

### 8.4 Performance

- Lazy load below-fold images
- Prefetch likely navigation targets
- Optimize largest contentful paint
- Add web vitals monitoring

---

## Database Changes Required

```sql
-- Reviews
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL,
  customer_id INTEGER,
  order_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  verified_purchase INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Wishlist
CREATE TABLE wishlist_items (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  variant_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  UNIQUE(customer_id, product_id, variant_id)
);

-- Stock notifications
CREATE TABLE stock_notifications (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  variant_id INTEGER NOT NULL,
  notified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
);

-- Newsletter subscribers
CREATE TABLE newsletter_subscribers (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  confirmed INTEGER DEFAULT 0,
  subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TEXT
);

-- Variants: add color hex
ALTER TABLE product_variants ADD COLUMN color_hex TEXT;
```

---

## Implementation Priority

### CRITICAL (Cannot Sell Without)
1. **Complete checkout flow** - Stripe integration, order creation
2. **Order confirmation emails** - Via Resend
3. **Fix newsletter signup** - Currently broken

### HIGH (Major UX Impact)
4. Customer account pages (order history)
5. Product image gallery with zoom
6. Mini cart drawer
7. Search autocomplete
8. Contact form

### MEDIUM (Conversion Optimization)
9. Product reviews
10. Wishlist functionality
11. Related products
12. Variant color swatches
13. Cart upsells
14. Abandoned cart emails

### LOWER (Polish)
15. Quick view modal
16. Stock notifications
17. Trust badges
18. Loading skeletons
19. Accessibility audit

---

## Files to Create/Modify

### New Files
```
app/checkout/page.tsx              # Full checkout form
app/checkout/confirmation/page.tsx # Order confirmation
app/account/page.tsx               # Account dashboard
app/account/orders/page.tsx        # Order history
app/account/orders/[id]/page.tsx   # Order detail
app/account/addresses/page.tsx     # Address book
app/account/wishlist/page.tsx      # Wishlist
app/api/checkout/route.ts          # Create payment intent
app/api/orders/route.ts            # Create order
app/api/newsletter/route.ts        # Newsletter signup
app/api/contact/route.ts           # Contact form
app/api/reviews/route.ts           # Submit review
components/shop/mini-cart.tsx      # Slide-out cart
components/shop/search-autocomplete.tsx
components/shop/quick-view.tsx
components/shop/product-gallery.tsx
components/shop/reviews.tsx
lib/email/templates/              # React Email templates
```

### Modified Files
```
app/products/[slug]/page.tsx      # Gallery, reviews, related
components/shop/header.tsx        # Mini cart trigger, search
components/shop/footer.tsx        # Working newsletter
components/products/product-info.tsx  # Color swatches
lib/db/schema.ts                  # New tables
```

---

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Checkout | 4-5 days | Stripe account, Resend |
| Phase 2: Accounts | 3-4 days | Phase 1 (orders exist) |
| Phase 3: Products | 2-3 days | None |
| Phase 4: Discovery | 2 days | None |
| Phase 5: Cart | 1-2 days | None |
| Phase 6: Emails | 2 days | Resend setup |
| Phase 7: Trust | 1 day | None |
| Phase 8: Polish | 2-3 days | All above |

**Total: 17-22 days of development**

---

## Next Steps

1. **Immediate:** Complete checkout with Stripe
2. Set up Resend for transactional emails
3. Add order confirmation flow
4. Implement customer account pages
5. Fix newsletter signup
6. Add product gallery improvements
