# Herbarium Dyeworks - Comprehensive Fix Plan

Generated from Senior Engineering Review on 2025-12-25

## Priority Legend
- 🔴 **P0**: Critical - Must fix before production
- 🟠 **P1**: High - Fix within first sprint
- 🟡 **P2**: Medium - Fix within first month
- 🟢 **P3**: Low - Nice to have

---

## Phase 1: Security Hardening (P0)

### 1.1 Add Authentication to Admin API Routes

**Problem**: All `/api/admin/*` routes have no server-side auth checks.

**Files to modify**:
- `app/api/admin/products/route.ts`
- `app/api/admin/products/[id]/route.ts`
- `app/api/admin/collections/route.ts`
- `app/api/admin/collections/[id]/route.ts`
- `app/api/admin/orders/route.ts`
- `app/api/admin/orders/[id]/route.ts`
- `app/api/admin/customers/route.ts`
- `app/api/admin/customers/[id]/route.ts`
- `app/api/admin/inventory/route.ts`
- `app/api/admin/discounts/route.ts`
- `app/api/admin/discounts/[id]/route.ts`
- `app/api/admin/settings/homepage/route.ts`
- `app/api/admin/settings/shipping/route.ts`
- `app/api/admin/settings/shipping/seed/route.ts`

**Solution**: Create auth helper and apply to all routes:

```typescript
// lib/auth/admin.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  // Bypass for development
  if (process.env.BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production") {
    return { authorized: true, userId: "dev-user" };
  }

  const { userId } = await auth();

  if (!userId) {
    return { authorized: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const adminUserIds = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);

  if (adminUserIds.length > 0 && !adminUserIds.includes(userId)) {
    return { authorized: false, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { authorized: true, userId };
}
```

Then in each route:
```typescript
export async function GET(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  // ... rest of handler
}
```

### 1.2 Add Production Safeguard for BYPASS_AUTH

**Problem**: `BYPASS_AUTH=true` could accidentally be set in production.

**File**: `middleware.ts`

**Solution**:
```typescript
const isBypassEnabled =
  process.env.BYPASS_AUTH === "true" &&
  process.env.NODE_ENV !== "production";

if (process.env.NODE_ENV === "production" && process.env.BYPASS_AUTH === "true") {
  console.error("CRITICAL: BYPASS_AUTH is enabled in production! Ignoring.");
}
```

### 1.3 Add Input Validation with Zod

**Problem**: No input validation on any API route.

**New files to create**:
- `lib/validations/product.ts`
- `lib/validations/collection.ts`
- `lib/validations/order.ts`
- `lib/validations/discount.ts`
- `lib/validations/shipping.ts`

**Install**: `npm install zod`

**Example schema**:
```typescript
// lib/validations/product.ts
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  compareAtPrice: z.number().positive().optional().nullable(),
  status: z.enum(["active", "draft", "archived"]).default("draft"),
  featured: z.boolean().default(false),
  categoryId: z.number().int().positive().optional().nullable(),
  fiberContent: z.string().optional(),
  weight: z.string().optional(),
  yardage: z.string().optional(),
  careInstructions: z.string().optional(),
  variants: z.array(z.object({
    name: z.string().min(1),
    sku: z.string().optional().nullable(),
    price: z.number().positive(),
    stock: z.number().int().min(0).default(0),
    weightGrams: z.number().int().positive().default(100),
  })).optional(),
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
  })).optional(),
});

export const updateProductSchema = createProductSchema.partial();
```

---

## Phase 2: Database Improvements (P1)

### 2.1 Add Database Indexes

**File**: `lib/db/schema.ts`

**Add indexes**:
```typescript
import { index } from "drizzle-orm/sqlite-core";

// Add to products table definition or create separate index definitions
export const productsSlugIdx = index("products_slug_idx").on(products.slug);
export const productsStatusIdx = index("products_status_idx").on(products.status);
export const productsCategoryIdx = index("products_category_idx").on(products.categoryId);

export const ordersEmailIdx = index("orders_email_idx").on(orders.email);
export const ordersStatusIdx = index("orders_status_idx").on(orders.status);
export const ordersCreatedAtIdx = index("orders_created_at_idx").on(orders.createdAt);

export const variantsProductIdx = index("variants_product_idx").on(productVariants.productId);
export const customersClerkIdx = index("customers_clerk_idx").on(customers.clerkId);
```

Then run: `npm run db:push`

### 2.2 Fix Timestamp Handling

**Problem**: Timestamps stored as text with incorrect default.

**Solution**: Create migration to fix existing data, update insert operations:

```typescript
// In all insert operations, use:
createdAt: new Date().toISOString(),
updatedAt: new Date().toISOString(),
```

### 2.3 Add JSON Schema Validation

**Files to modify**: All API routes that handle JSON fields (addresses, cart items, countries)

**Solution**: Add Zod schemas for JSON fields:
```typescript
const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string().optional(),
  postalCode: z.string(),
  country: z.string().length(2),
});
```

---

## Phase 3: Performance Fixes (P1)

### 3.1 Fix N+1 Query in Customers API

**File**: `app/api/admin/customers/route.ts`

**Problem**: Loading all orders just to count them.

**Solution**: Use SQL aggregation:
```typescript
const customersWithStats = await db
  .select({
    ...customers,
    orderCount: sql<number>`count(${orders.id})`,
    totalSpent: sql<number>`coalesce(sum(${orders.total}), 0)`,
  })
  .from(customers)
  .leftJoin(orders, eq(customers.id, orders.customerId))
  .groupBy(customers.id)
  .limit(limit)
  .offset(offset);
```

### 3.2 Fix In-Memory Search Filtering

**File**: `app/api/admin/products/route.ts`

**Problem**: Fetches all products then filters in JavaScript.

**Solution**: Use database LIKE queries:
```typescript
import { like, or } from "drizzle-orm";

const conditions = [];

if (search) {
  conditions.push(
    or(
      like(products.name, `%${search}%`),
      like(products.slug, `%${search}%`)
    )
  );
}

if (status && status !== "all") {
  conditions.push(eq(products.status, status));
}

const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

// Use whereClause in both the query and count
```

### 3.3 Fix Pagination Count Query

**File**: `app/api/admin/products/route.ts`

**Problem**: Count ignores filters.

**Solution**: Apply same where clause to count:
```typescript
const [{ count }] = await db
  .select({ count: sql<number>`count(*)` })
  .from(products)
  .where(whereClause);
```

---

## Phase 4: Data Integrity (P1)

### 4.1 Add Database Transactions

**Files**: All multi-table API operations

**Solution**: Wrap in transactions:
```typescript
import { db } from "@/lib/db";

// In route handler:
const result = await db.transaction(async (tx) => {
  const [product] = await tx.insert(products).values({...}).returning();

  if (variants?.length) {
    await tx.insert(productVariants).values(
      variants.map(v => ({ ...v, productId: product.id }))
    );
  }

  if (images?.length) {
    await tx.insert(productImages).values(
      images.map(img => ({ ...img, productId: product.id }))
    );
  }

  return product;
});
```

### 4.2 Fix Variant Update Logic

**File**: `app/api/admin/products/[id]/route.ts`

**Problem**: Delete-and-recreate loses variant IDs.

**Solution**: Implement proper upsert:
```typescript
// Compare existing variants with incoming
// Update existing by ID
// Insert new ones (no ID)
// Delete removed ones
// Never delete variants that have order references
```

### 4.3 Add onDelete Cascade/Restrict

**File**: `lib/db/schema.ts`

**Add to orderItems**:
```typescript
variantId: integer("variant_id")
  .references(() => productVariants.id, { onDelete: "restrict" }),
```

---

## Phase 5: Code Quality (P2)

### 5.1 Replace useState Explosion with React Hook Form

**File**: `app/admin/products/product-form.tsx`

**Install**: `npm install react-hook-form @hookform/resolvers`

**Solution**: Refactor to use form library:
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProductSchema } from "@/lib/validations/product";

const form = useForm({
  resolver: zodResolver(createProductSchema),
  defaultValues: {
    name: product?.name || "",
    // ... all fields
  },
});
```

### 5.2 Implement Delete Product Functionality

**File**: `app/admin/products/product-form.tsx:624-631`

**Solution**: Add onClick handler with confirmation:
```typescript
const handleDelete = async () => {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const response = await fetch(`/api/admin/products/${product.id}`, {
    method: "DELETE",
  });

  if (response.ok) {
    router.push("/admin/products");
  }
};
```

### 5.3 Dynamic Collection Loading in Header

**File**: `components/shop/header.tsx`

**Solution**: Fetch collections from API or pass as props from layout.

### 5.4 Implement Cart State

**Files**:
- Create `lib/hooks/use-cart.ts`
- Update `components/shop/header.tsx`

---

## Phase 6: Error Handling & Logging (P2)

### 6.1 Add Structured Error Logging

**Install**: Consider `pino` or use Vercel's built-in logging

**Create**: `lib/logger.ts`
```typescript
export function logError(context: string, error: unknown, metadata?: Record<string, unknown>) {
  console.error(JSON.stringify({
    level: "error",
    context,
    message: error instanceof Error ? error.message : "Unknown error",
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
    timestamp: new Date().toISOString(),
  }));
}
```

### 6.2 Sanitize Error Responses

**All API routes**: Don't expose internal error messages
```typescript
catch (error) {
  logError("createProduct", error, { userId });
  return NextResponse.json(
    { error: "Failed to create product" },
    { status: 500 }
  );
}
```

---

## Phase 7: Testing Improvements (P2)

### 7.1 Add Test Cleanup

**File**: `tests/setup.ts`

```typescript
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { like } from "drizzle-orm";

afterAll(async () => {
  // Clean up test data
  await db.delete(products).where(like(products.slug, "test-product-%"));
});
```

### 7.2 Add Unit Tests

**Create**: `tests/unit/` directory with mocked tests for:
- Validation schemas
- Utility functions
- Component logic

### 7.3 Add Database Mocking

**Install**: `npm install -D vitest-mock-extended`

---

## Implementation Order

### Sprint 1 (Week 1-2): Security
- [ ] 1.1 Add auth to all admin API routes
- [ ] 1.2 Add production safeguard for BYPASS_AUTH
- [ ] 1.3 Install Zod and add validation schemas
- [ ] 4.1 Add database transactions

### Sprint 2 (Week 3-4): Performance & Data
- [ ] 2.1 Add database indexes
- [ ] 3.1 Fix N+1 in customers API
- [ ] 3.2 Fix in-memory search filtering
- [ ] 3.3 Fix pagination count
- [ ] 4.2 Fix variant update logic

### Sprint 3 (Week 5-6): Code Quality
- [ ] 5.1 Refactor product form with React Hook Form
- [ ] 5.2 Implement delete product
- [ ] 6.1 Add structured logging
- [ ] 6.2 Sanitize error responses

### Sprint 4 (Week 7-8): Polish
- [ ] 5.3 Dynamic collection loading
- [ ] 5.4 Implement cart state
- [ ] 7.1 Add test cleanup
- [ ] 7.2 Add unit tests
- [ ] 2.2 Fix timestamp handling
- [ ] 2.3 Add JSON schema validation

---

## Quick Wins (Can Do Immediately)

1. Install Zod: `npm install zod`
2. Add production safeguard to middleware (5 min)
3. Create `lib/auth/admin.ts` helper (10 min)
4. Add auth check to one route as template (5 min)

---

## Files to Create

```
lib/
├── auth/
│   └── admin.ts          # Admin auth helper
├── validations/
│   ├── product.ts        # Product schemas
│   ├── collection.ts     # Collection schemas
│   ├── order.ts          # Order schemas
│   ├── discount.ts       # Discount schemas
│   └── shipping.ts       # Shipping schemas
├── logger.ts             # Structured logging
└── hooks/
    └── use-cart.ts       # Cart state management
```

---

## Commands to Run

```bash
# Install dependencies
npm install zod react-hook-form @hookform/resolvers

# After schema changes
npm run db:generate
npm run db:push

# Run tests after each change
npm test
```
