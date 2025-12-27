# E5: Customer Accounts 🚧 IN PROGRESS

> **Status**: IN PROGRESS - Address management complete
> **Completed**: Clerk integration, sign-in/sign-up pages, graceful degradation, account dashboard, order history, order detail, guest order tracking, address management (CRUD + default)
> **Remaining**: Profile editing, cart sync across devices

**Priority**: P1
**Complexity**: Medium
**Dependencies**: E3 (Checkout & Payments)

## Overview

Implement customer accounts using Clerk for authentication. Customers can create accounts to view order history, manage saved addresses, and streamline checkout. Auth is optional - guest checkout remains available.

## Business Value

- Repeat customers have faster checkout
- Order history reduces support queries
- Marketing consent for newsletters
- Customer lifetime value visibility

## Design Principle

**Auth is optional and gracefully degrades.** The store must work fully without Clerk configured. Account features are progressive enhancements.

## User Stories

### US5.1: Create Account
**As a** customer
**I want to** create an account
**So that** I can track orders and save my details

**Acceptance Criteria:**
- [ ] Sign up with email/password or social (Google)
- [ ] Email verification required
- [ ] Optional during checkout (can create after)
- [ ] Link to privacy policy
- [ ] Newsletter opt-in checkbox

### US5.2: Sign In
**As a** returning customer
**I want to** sign into my account
**So that** I can access my order history

**Acceptance Criteria:**
- [ ] Sign in with email/password or social
- [ ] "Forgot password" flow
- [ ] Redirect to intended page after sign in
- [ ] Session persists across browser sessions

### US5.3: View Order History ✅
**As a** customer
**I want to** see my past orders
**So that** I can track deliveries and reorder

**Acceptance Criteria:**
- [x] List of orders with status, date, total
- [x] Order detail view with items
- [x] Tracking information for shipped orders
- [x] Most recent orders first

### US5.4: Manage Addresses ✅
**As a** customer
**I want to** save shipping addresses
**So that** checkout is faster

**Acceptance Criteria:**
- [x] Add new address
- [x] Edit existing address
- [x] Delete address
- [x] Set default address
- [ ] Auto-fill in checkout

### US5.5: Update Profile
**As a** customer
**I want to** update my details
**So that** my information stays current

**Acceptance Criteria:**
- [ ] Edit name, email, phone
- [ ] Change password
- [ ] Manage newsletter subscription
- [ ] Delete account (with confirmation)

### US5.6: Cart Persistence Across Devices
**As a** logged-in customer
**I want to** my cart synced across devices
**So that** I can continue shopping anywhere

**Acceptance Criteria:**
- [ ] Cart stored in database linked to account
- [ ] Syncs on login
- [ ] Merge with guest cart on login

### US5.7: Passwordless Checkout Link ✅
**As a** customer who placed an order as guest
**I want to** access my order without an account
**So that** I can track my purchase

**Acceptance Criteria:**
- [x] Order confirmation email includes secure link (token generation ready)
- [x] Link shows order status and tracking
- [x] Token expires after 30 days
- [ ] Can create account from this page (deferred)

## Technical Approach

### Clerk Integration

```typescript
// components/providers.tsx (existing)
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

const isClerkConfigured =
  clerkPubKey &&
  clerkPubKey.startsWith("pk_") &&
  !clerkPubKey.includes("placeholder");

export function Providers({ children }: { children: ReactNode }) {
  if (isClerkConfigured) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }
  return <>{children}</>;
}
```

### Syncing Clerk User to Database

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET!);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    }) as WebhookEvent;
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  if (evt.type === 'user.created') {
    await db.insert(customers).values({
      clerkId: evt.data.id,
      email: evt.data.email_addresses[0].email_address,
      firstName: evt.data.first_name,
      lastName: evt.data.last_name,
    });
  }

  if (evt.type === 'user.updated') {
    await db.update(customers)
      .set({
        email: evt.data.email_addresses[0].email_address,
        firstName: evt.data.first_name,
        lastName: evt.data.last_name,
      })
      .where(eq(customers.clerkId, evt.data.id));
  }

  if (evt.type === 'user.deleted') {
    // Soft delete or anonymize
    await db.update(customers)
      .set({ email: `deleted_${evt.data.id}@example.com` })
      .where(eq(customers.clerkId, evt.data.id));
  }

  return new Response('OK', { status: 200 });
}
```

### Getting Current Customer

```typescript
// lib/auth.ts
import { auth, currentUser } from '@clerk/nextjs/server';

export async function getCurrentCustomer() {
  try {
    const { userId } = auth();
    if (!userId) return null;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.clerkId, userId),
      with: { addresses: true },
    });

    return customer;
  } catch {
    // Clerk not configured
    return null;
  }
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    redirect('/sign-in');
  }
  return customer;
}
```

### API Routes

```
GET /api/account
  Response: { customer: Customer }

PATCH /api/account
  Body: { firstName?, lastName?, phone?, acceptsMarketing? }
  Response: { customer: Customer }

GET /api/account/orders
  Response: { orders: Order[] }

GET /api/account/orders/[id]
  Response: { order: Order }

GET /api/account/addresses
  Response: { addresses: Address[] }

POST /api/account/addresses
  Body: { address: NewAddress }
  Response: { address: Address }

PATCH /api/account/addresses/[id]
  Body: { address: Partial<Address> }
  Response: { address: Address }

DELETE /api/account/addresses/[id]
  Response: { success: true }

// Guest order access
GET /api/orders/[orderNumber]?token=xxx
  Response: { order: Order }
```

### Page Routes

```
app/
├── (auth)/
│   ├── sign-in/
│   │   └── [[...sign-in]]/
│   │       └── page.tsx
│   └── sign-up/
│       └── [[...sign-up]]/
│           └── page.tsx
├── account/
│   ├── page.tsx              # Dashboard
│   ├── orders/
│   │   ├── page.tsx          # Order list
│   │   └── [id]/
│   │       └── page.tsx      # Order detail
│   └── addresses/
│       └── page.tsx          # Address management
└── order/
    └── [orderNumber]/
        └── page.tsx          # Guest order view
```

### Components

```
components/
├── account/
│   ├── account-nav.tsx       # Sidebar navigation
│   ├── order-list.tsx        # Order history
│   ├── order-detail.tsx      # Single order view
│   ├── address-form.tsx      # Add/edit address
│   ├── address-list.tsx      # Address cards
│   └── profile-form.tsx      # Profile settings
├── auth/
│   ├── sign-in-button.tsx    # Header sign in
│   ├── user-button.tsx       # Header user menu
│   └── auth-guard.tsx        # Protect routes
```

### Graceful Degradation

```typescript
// components/auth/user-button.tsx
'use client';

import { useUser, UserButton as ClerkUserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { User } from 'lucide-react';

export function UserButton() {
  // Check if Clerk is available
  try {
    const { isLoaded, isSignedIn } = useUser();

    if (!isLoaded) return null;

    if (isSignedIn) {
      return <ClerkUserButton afterSignOutUrl="/" />;
    }

    return (
      <Link href="/sign-in">
        <User className="h-5 w-5" />
      </Link>
    );
  } catch {
    // Clerk not configured - just show account link
    return (
      <Link href="/account">
        <User className="h-5 w-5" />
      </Link>
    );
  }
}
```

### Order Access Token

```typescript
// For guest order tracking
import crypto from 'crypto';

function generateOrderToken(orderId: number, email: string): string {
  const payload = `${orderId}:${email}:${Date.now()}`;
  const secret = process.env.ORDER_TOKEN_SECRET!;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
    .substring(0, 32);

  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

function verifyOrderToken(token: string): { orderId: number; email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [orderId, email, timestamp, signature] = decoded.split(':');

    // Check expiry (30 days)
    const age = Date.now() - parseInt(timestamp);
    if (age > 30 * 24 * 60 * 60 * 1000) return null;

    // Verify signature
    const payload = `${orderId}:${email}:${timestamp}`;
    const expectedSig = crypto
      .createHmac('sha256', process.env.ORDER_TOKEN_SECRET!)
      .update(payload)
      .digest('hex')
      .substring(0, 32);

    if (signature !== expectedSig) return null;

    return { orderId: parseInt(orderId), email };
  } catch {
    return null;
  }
}
```

## Testing Strategy

### Unit Tests
- Token generation/verification
- Customer data sync logic

### Integration Tests
- Clerk webhook handling
- API route authentication
- Order access with token

### E2E Tests
- Sign up → verify email → access account
- View order history
- Add/edit addresses
- Guest order tracking link

## Environment Variables

```bash
# Clerk (optional - store works without)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Order tokens
ORDER_TOKEN_SECRET=random-32-char-string
```

## Rollout Plan

1. **Dev**: Implement with Clerk test mode
2. **Staging**: Full auth flows tested
3. **Production**: Enable Clerk in live mode

## Open Questions

- [ ] Social login providers: just Google or also Apple?
- [ ] GDPR data export functionality?
- [ ] Wishlist feature in accounts?

## Definition of Done

- [ ] All user stories complete with acceptance criteria met
- [ ] Works without Clerk configured (graceful degradation)
- [ ] Clerk webhooks syncing correctly
- [ ] Guest order tracking working
- [ ] Mobile responsive account pages
- [ ] Code reviewed and merged
