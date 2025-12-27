# E11: Polish Features 📋 TODO

> **Status**: NOT STARTED
> **Features**: Yarn weight guide, back-in-stock notifications

**Priority**: P3 (Low - Polish)
**Complexity**: Low-Medium
**Dependencies**: E1 (Product Catalog)

## Overview

Implement polish features that enhance the customer experience: an educational yarn weight guide for new knitters, and back-in-stock email notifications for sold-out items.

## Business Value

- Yarn weight guide helps newcomers understand yarn types, reducing confusion and support requests
- Back-in-stock notifications capture demand for sold-out items and drive repeat visits
- Both features demonstrate care for customer needs

## User Stories

### US11.1: Yarn Weight Guide Page
**As a** new knitter
**I want to** learn about different yarn weights
**So that** I can choose the right yarn for my project

**Acceptance Criteria:**
- [ ] Page accessible at `/yarn-weight-guide`
- [ ] Explains each yarn weight category:
  - Lace / Laceweight
  - Fingering / 4ply
  - Sport / 5ply
  - DK / Light Worsted
  - Worsted / Aran
  - Bulky / Chunky
- [ ] Each weight includes:
  - Standard names and aliases
  - Typical gauge (stitches per 10cm)
  - Recommended needle sizes (metric and US)
  - Common uses (shawls, sweaters, blankets, etc.)
  - Weight symbol/number (CYC standard)
- [ ] Visual comparison chart or infographic
- [ ] Links to shop products filtered by each weight
- [ ] Mobile responsive layout
- [ ] SEO optimized with meta description

---

### US11.2: Weight Info Tooltip
**As a** customer
**I want to** quickly understand what a yarn weight means
**So that** I don't have to leave the product page

**Acceptance Criteria:**
- [ ] Info icon (?) next to weight badge on product detail
- [ ] Tooltip appears on hover/tap
- [ ] Shows brief description of the weight
- [ ] Shows typical uses
- [ ] "Learn more" link to full guide
- [ ] Accessible (keyboard focusable, ARIA)

---

### US11.3: Stock Notification Database Schema
**As a** developer
**I want to** store notification signups
**So that** we can email customers when items are back in stock

**Acceptance Criteria:**
- [ ] `stockNotifications` table with:
  - id, email (indexed)
  - productId, variantId
  - status (pending, sent, cancelled)
  - createdAt, sentAt (nullable)
- [ ] Unique constraint: one signup per email per variant
- [ ] Foreign keys to products and variants
- [ ] Drizzle migration

---

### US11.4: Notification Signup Form
**As a** customer
**I want to** sign up for back-in-stock notifications
**So that** I don't miss when an item becomes available

**Acceptance Criteria:**
- [ ] Form appears when viewing sold-out variant
- [ ] Email input with validation
- [ ] "Notify Me" button
- [ ] Success message: "We'll email you when this is back!"
- [ ] One signup per email per variant (show already subscribed message)
- [ ] Privacy note: "We'll only email about this item"
- [ ] Works for guests and authenticated users

---

### US11.5: Send Back-in-Stock Emails
**As an** admin
**I want to** notify customers when products are restocked
**So that** they can complete their purchase

**Acceptance Criteria:**
- [ ] Manual trigger in admin when updating stock
- [ ] Or automatic trigger when variant stock goes from 0 to >0
- [ ] Uses Resend API for email delivery
- [ ] Email includes:
  - Product name and variant
  - Product image
  - Current price
  - Direct link to product page
  - Unsubscribe option
- [ ] Marks notification as "sent" after sending
- [ ] Rate limiting: max 100 emails per batch
- [ ] Logs sent notifications for audit

---

### US11.6: Admin Notification Management
**As an** admin
**I want to** view pending notification signups
**So that** I can understand demand for sold-out items

**Acceptance Criteria:**
- [ ] List of all pending notifications in admin
- [ ] Group by product/variant
- [ ] Show count of subscribers per variant
- [ ] Filter by product
- [ ] Manual "Send Now" button per variant
- [ ] View sent notification history

---

## Technical Approach

### Files to Create

```
app/
├── yarn-weight-guide/
│   └── page.tsx                      # Educational content page
├── api/
│   ├── notifications/
│   │   └── stock/
│   │       └── route.ts              # POST (signup)
│   └── admin/
│       └── notifications/
│           ├── route.ts              # GET (list)
│           └── send/
│               └── route.ts          # POST (send batch)
└── admin/
    └── notifications/
        └── page.tsx                  # Admin management page
components/
├── products/
│   ├── stock-notification-form.tsx   # Email signup
│   └── weight-tooltip.tsx            # Info tooltip
lib/
└── email/
    └── stock-notification.ts         # Email template & sending
```

### Files to Modify

```
lib/db/schema.ts                      # Add stockNotifications table
components/products/variant-selector.tsx  # Show form when sold out
components/products/product-info.tsx  # Add weight tooltip
app/admin/products/product-form.tsx   # Trigger notifications on stock update (optional)
```

### Stock Notifications Schema

```typescript
export const stockNotifications = sqliteTable('stock_notifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  variantId: integer('variant_id')
    .notNull()
    .references(() => productVariants.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['pending', 'sent', 'cancelled'] })
    .default('pending')
    .notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  sentAt: text('sent_at'),
}, (table) => ({
  emailVariantIdx: uniqueIndex('email_variant_idx').on(table.email, table.variantId),
  variantIdx: index('variant_idx').on(table.variantId),
}));
```

### Yarn Weight Data

```typescript
// lib/yarn-weights.ts
export const yarnWeights = [
  {
    name: 'Laceweight',
    aliases: ['Lace', '0-Lace', 'Cobweb'],
    cycNumber: 0,
    gauge: '32-40 sts per 10cm',
    needles: '1.5-2.25mm (US 000-1)',
    uses: ['Shawls', 'Delicate garments', 'Lace projects'],
    description: 'The finest yarn weight, perfect for intricate lace patterns and lightweight shawls.',
  },
  {
    name: '4ply / Fingering',
    aliases: ['Fingering', 'Sock', 'Super Fine'],
    cycNumber: 1,
    gauge: '27-32 sts per 10cm',
    needles: '2.25-3.25mm (US 1-3)',
    uses: ['Socks', 'Shawls', 'Lightweight sweaters', 'Baby items'],
    description: 'A versatile fine weight, popular for socks and detailed colorwork.',
  },
  {
    name: 'DK / Light Worsted',
    aliases: ['DK', 'Double Knit', '8ply'],
    cycNumber: 3,
    gauge: '21-24 sts per 10cm',
    needles: '3.75-4.5mm (US 5-7)',
    uses: ['Sweaters', 'Hats', 'Scarves', 'Blankets', 'Most patterns'],
    description: 'The most popular weight worldwide. Great for beginners and versatile projects.',
  },
  {
    name: 'Aran / Worsted',
    aliases: ['Worsted', 'Aran', '10ply'],
    cycNumber: 4,
    gauge: '16-20 sts per 10cm',
    needles: '4.5-5.5mm (US 7-9)',
    uses: ['Warm sweaters', 'Cables', 'Outdoor accessories'],
    description: 'A substantial weight that knits up quickly. Perfect for cables and textured patterns.',
  },
];
```

### Stock Notification Form

```typescript
// components/products/stock-notification-form.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, CheckCircle } from 'lucide-react';

interface Props {
  variantId: number;
  variantName: string;
}

export function StockNotificationForm({ variantId, variantName }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch('/api/notifications/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, variantId }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setMessage("We'll email you when this is back in stock!");
      } else {
        setStatus('error');
        setMessage(data.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="w-4 h-4" />
        {message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Get notified when {variantName} is back in stock
      </p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={status === 'loading'}>
          <Bell className="w-4 h-4 mr-1" />
          Notify Me
        </Button>
      </div>
      {status === 'error' && (
        <p className="text-sm text-red-500">{message}</p>
      )}
      <p className="text-xs text-muted-foreground">
        We'll only email you about this item.
      </p>
    </form>
  );
}
```

### Email Template with Resend

```typescript
// lib/email/stock-notification.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NotificationData {
  email: string;
  productName: string;
  variantName: string;
  productSlug: string;
  productImage: string;
  price: number;
}

export async function sendStockNotification(data: NotificationData) {
  const productUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/products/${data.productSlug}`;

  await resend.emails.send({
    from: 'Herbarium Dyeworks <noreply@herbarium-dyeworks.com>',
    to: data.email,
    subject: `${data.productName} - ${data.variantName} is back in stock!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a;">Good news!</h1>
        <p>The yarn you were waiting for is back in stock.</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <img src="${data.productImage}" alt="${data.productName}"
               style="width: 150px; height: 150px; object-fit: cover; border-radius: 4px;" />
          <h2 style="margin: 10px 0;">${data.productName}</h2>
          <p style="color: #666;">Colorway: ${data.variantName}</p>
          <p style="font-size: 18px; font-weight: bold;">£${data.price.toFixed(2)}</p>
        </div>

        <a href="${productUrl}"
           style="display: inline-block; background: #1a1a1a; color: white;
                  padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Shop Now
        </a>

        <p style="margin-top: 40px; font-size: 12px; color: #999;">
          You received this email because you signed up for back-in-stock notifications.
        </p>
      </div>
    `,
  });
}
```

### Weight Tooltip Component

```typescript
// components/products/weight-tooltip.tsx
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { yarnWeights } from '@/lib/yarn-weights';

interface Props {
  weight: string;
}

export function WeightTooltip({ weight }: Props) {
  const weightData = yarnWeights.find(
    (w) => w.name.toLowerCase().includes(weight.toLowerCase()) ||
           w.aliases.some((a) => a.toLowerCase() === weight.toLowerCase())
  );

  if (!weightData) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <Info className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="font-medium">{weightData.name}</p>
          <p className="text-sm text-muted-foreground">{weightData.description}</p>
          <p className="text-sm mt-1">
            <strong>Gauge:</strong> {weightData.gauge}
          </p>
          <p className="text-sm">
            <strong>Needles:</strong> {weightData.needles}
          </p>
          <Link
            href="/yarn-weight-guide"
            className="text-sm text-primary hover:underline mt-2 block"
          >
            Learn more about yarn weights
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

## Testing Strategy

### Unit Tests
- Yarn weight data lookup
- Email validation in notification form
- Unique constraint handling

### Integration Tests
- Notification signup API
- Send notification batch API
- Email delivery with Resend

### E2E Tests
- Sign up for notification on sold-out item
- Verify success message
- Admin view notification list
- Admin trigger send

## Performance Considerations

- Index notifications by variantId for fast lookups
- Batch email sending (max 100 per batch)
- Cache yarn weight data (static)
- Rate limit notification signup API

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Yarn weight guide is informative and well-designed
- [ ] Weight tooltips provide quick reference
- [ ] Notification signups work correctly
- [ ] Emails send via Resend successfully
- [ ] Admin can manage and trigger notifications
- [ ] Mobile responsive
- [ ] Code reviewed and merged
