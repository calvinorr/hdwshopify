# E7: Data Migration 📋 TODO - PARTIAL

> **Status**: PARTIAL - Basic import exists, full migration scripts incomplete
> **Completed**: Admin Shopify import UI, basic product import
> **Remaining**: Full migration scripts, customer/order import, validation, URL redirects

**Priority**: P0 (Parallel with development)
**Complexity**: Medium
**Dependencies**: E1 (Product Catalog), Shopify export access

## Overview

Migrate all product data, customer records, and historical orders from Shopify to the new platform. This ensures business continuity and preserves customer relationships.

## Business Value

- Zero data loss during platform transition
- Preserve customer order history for support
- Maintain SEO through URL redirects
- Continue marketing to existing customers

## Migration Scope

| Data Type | Records (Est.) | Priority |
|-----------|----------------|----------|
| Products | ~50 | P0 |
| Product Variants | ~200 | P0 |
| Product Images | ~400 | P0 |
| Categories | ~15 | P0 |
| Customers | ~500 | P1 |
| Orders | ~1000 | P1 |
| Order Items | ~2500 | P1 |

## User Stories

### US7.1: Export from Shopify
**As an** admin
**I want to** export all data from Shopify
**So that** I have source data for migration

**Acceptance Criteria:**
- [ ] Products exported as CSV
- [ ] Customers exported as CSV
- [ ] Orders exported as CSV
- [ ] Product images URLs captured
- [ ] All data validated for completeness

### US7.2: Import Products
**As an** admin
**I want to** import products into new platform
**So that** the catalog is ready

**Acceptance Criteria:**
- [ ] All products imported with correct data
- [ ] Variants created with pricing and stock
- [ ] Images downloaded and re-hosted
- [ ] Categories/collections mapped
- [ ] URL slugs preserved
- [ ] Validation report generated

### US7.3: Import Customers
**As an** admin
**I want to** import customer records
**So that** customers can access their history

**Acceptance Criteria:**
- [ ] Customer emails imported (primary identifier)
- [ ] Names and addresses preserved
- [ ] Marketing consent flags preserved
- [ ] Duplicate handling (merge by email)
- [ ] Password reset required (can't migrate passwords)

### US7.4: Import Orders
**As an** admin
**I want to** import historical orders
**So that** customers see their purchase history

**Acceptance Criteria:**
- [ ] Order numbers preserved
- [ ] Order items linked to products
- [ ] Status preserved (fulfilled, cancelled, etc.)
- [ ] Dates preserved
- [ ] Payment info NOT imported (already processed)

### US7.5: URL Redirects
**As an** admin
**I want to** redirect old Shopify URLs
**So that** SEO is preserved

**Acceptance Criteria:**
- [ ] `/products/*` redirects configured
- [ ] `/collections/*` redirects configured
- [ ] 301 permanent redirects
- [ ] Redirect map for changed slugs
- [ ] 404 handling for removed products

### US7.6: Validation & Rollback
**As an** admin
**I want to** validate migration and rollback if needed
**So that** I can ensure data integrity

**Acceptance Criteria:**
- [ ] Record counts match source
- [ ] Sample validation of random records
- [ ] Image integrity check
- [ ] Clear rollback procedure
- [ ] Migration audit log

## Technical Approach

### Migration Scripts Location

```
scripts/
├── migration/
│   ├── export-shopify.ts       # Generate exports via Shopify API
│   ├── import-products.ts      # Import products, variants, images
│   ├── import-customers.ts     # Import customer records
│   ├── import-orders.ts        # Import historical orders
│   ├── validate-migration.ts   # Validation checks
│   └── utils/
│       ├── shopify-client.ts   # Shopify API client
│       ├── image-downloader.ts # Download and rehost images
│       └── transform.ts        # Data transformation helpers
```

### Shopify Export via API

```typescript
// scripts/migration/export-shopify.ts
import Shopify from '@shopify/shopify-api';

const client = new Shopify.Clients.Rest(
  process.env.SHOPIFY_SHOP_DOMAIN!,
  process.env.SHOPIFY_ACCESS_TOKEN!
);

async function exportProducts() {
  const products: ShopifyProduct[] = [];
  let pageInfo: string | undefined;

  do {
    const response = await client.get({
      path: 'products',
      query: {
        limit: 250,
        ...(pageInfo && { page_info: pageInfo }),
      },
    });

    products.push(...response.body.products);
    pageInfo = response.pageInfo?.nextPage;
  } while (pageInfo);

  // Write to JSON file for inspection
  await fs.writeFile(
    'data/shopify-products.json',
    JSON.stringify(products, null, 2)
  );

  console.log(`Exported ${products.length} products`);
  return products;
}
```

### Product Import

```typescript
// scripts/migration/import-products.ts
import { db } from '@/lib/db';
import { products, productVariants, productImages, categories } from '@/lib/db/schema';

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: 'active' | 'draft' | 'archived';
  variants: ShopifyVariant[];
  images: ShopifyImage[];
}

async function importProducts(shopifyProducts: ShopifyProduct[]) {
  const results = {
    imported: 0,
    skipped: 0,
    errors: [] as string[],
  };

  for (const sp of shopifyProducts) {
    try {
      // Check if already exists
      const existing = await db.query.products.findFirst({
        where: eq(products.slug, sp.handle),
      });

      if (existing) {
        results.skipped++;
        continue;
      }

      // Map category
      const categoryId = await mapCategory(sp.product_type);

      // Insert product
      const [product] = await db.insert(products).values({
        name: sp.title,
        slug: sp.handle,
        description: htmlToPlainText(sp.body_html),
        categoryId,
        basePrice: parseFloat(sp.variants[0].price),
        status: sp.status,
        featured: sp.tags.includes('featured'),
        // Yarn-specific: parse from tags or metafields
        fiberContent: extractTag(sp.tags, 'fiber:'),
        weight: extractTag(sp.tags, 'weight:'),
        yardage: extractTag(sp.tags, 'yardage:'),
      }).returning();

      // Import variants
      for (const sv of sp.variants) {
        await db.insert(productVariants).values({
          productId: product.id,
          name: sv.title === 'Default Title' ? sp.title : sv.title,
          sku: sv.sku,
          price: parseFloat(sv.price),
          compareAtPrice: sv.compare_at_price
            ? parseFloat(sv.compare_at_price)
            : null,
          stock: sv.inventory_quantity ?? 0,
          weightGrams: sv.grams || 100,
          position: sv.position,
        });
      }

      // Import images
      for (const img of sp.images) {
        const localUrl = await downloadAndUploadImage(img.src, product.id);

        await db.insert(productImages).values({
          productId: product.id,
          variantId: img.variant_ids[0]
            ? await findVariantId(product.id, img.variant_ids[0])
            : null,
          url: localUrl,
          alt: img.alt || sp.title,
          position: img.position,
        });
      }

      results.imported++;
      console.log(`✓ Imported: ${sp.title}`);

    } catch (error) {
      results.errors.push(`${sp.title}: ${error.message}`);
      console.error(`✗ Failed: ${sp.title}`, error);
    }
  }

  return results;
}
```

### Image Migration

```typescript
// scripts/migration/utils/image-downloader.ts
import { put } from '@vercel/blob';
import fetch from 'node-fetch';

async function downloadAndUploadImage(
  shopifyUrl: string,
  productId: number
): Promise<string> {
  // Download from Shopify CDN
  const response = await fetch(shopifyUrl);
  const buffer = await response.buffer();

  // Extract filename
  const url = new URL(shopifyUrl);
  const filename = url.pathname.split('/').pop() || 'image.jpg';

  // Upload to Vercel Blob
  const blob = await put(`products/${productId}/${filename}`, buffer, {
    access: 'public',
    contentType: response.headers.get('content-type') || 'image/jpeg',
  });

  return blob.url;
}
```

### Customer Import

```typescript
// scripts/migration/import-customers.ts
async function importCustomers(shopifyCustomers: ShopifyCustomer[]) {
  for (const sc of shopifyCustomers) {
    // Check if already exists
    const existing = await db.query.customers.findFirst({
      where: eq(customers.email, sc.email.toLowerCase()),
    });

    if (existing) {
      // Merge: update if new data is more complete
      continue;
    }

    const [customer] = await db.insert(customers).values({
      email: sc.email.toLowerCase(),
      firstName: sc.first_name,
      lastName: sc.last_name,
      phone: sc.phone,
      acceptsMarketing: sc.accepts_marketing,
    }).returning();

    // Import addresses
    for (const addr of sc.addresses) {
      await db.insert(addresses).values({
        customerId: customer.id,
        type: addr.default ? 'shipping' : 'shipping',
        firstName: addr.first_name,
        lastName: addr.last_name,
        company: addr.company,
        line1: addr.address1,
        line2: addr.address2,
        city: addr.city,
        state: addr.province,
        postalCode: addr.zip,
        country: addr.country_code,
        phone: addr.phone,
        isDefault: addr.default,
      });
    }
  }
}
```

### Order Import

```typescript
// scripts/migration/import-orders.ts
async function importOrders(shopifyOrders: ShopifyOrder[]) {
  for (const so of shopifyOrders) {
    // Skip if already exists
    const existing = await db.query.orders.findFirst({
      where: eq(orders.orderNumber, so.name),
    });

    if (existing) continue;

    // Find or create customer
    const customer = await findOrCreateCustomer(so.customer);

    const [order] = await db.insert(orders).values({
      orderNumber: so.name, // e.g., "#1001"
      customerId: customer?.id,
      email: so.email,
      status: mapOrderStatus(so.fulfillment_status),
      paymentStatus: 'paid', // Historical orders were paid
      subtotal: parseFloat(so.subtotal_price),
      shippingCost: parseFloat(so.total_shipping_price_set.shop_money.amount),
      discountAmount: parseFloat(so.total_discounts),
      total: parseFloat(so.total_price),
      currency: so.currency,
      shippingAddress: JSON.stringify(so.shipping_address),
      billingAddress: JSON.stringify(so.billing_address),
      customerNotes: so.note,
      createdAt: so.created_at,
      shippedAt: so.fulfillments[0]?.created_at,
    }).returning();

    // Import line items
    for (const item of so.line_items) {
      const variantId = await findVariantBySku(item.sku);

      await db.insert(orderItems).values({
        orderId: order.id,
        variantId,
        productName: item.title,
        variantName: item.variant_title,
        sku: item.sku,
        quantity: item.quantity,
        price: parseFloat(item.price),
        weightGrams: item.grams,
      });
    }
  }
}

function mapOrderStatus(fulfillmentStatus: string | null): string {
  switch (fulfillmentStatus) {
    case 'fulfilled': return 'delivered';
    case 'partial': return 'shipped';
    case null: return 'processing'; // Unfulfilled
    default: return 'pending';
  }
}
```

### URL Redirects

```typescript
// next.config.ts
export default {
  async redirects() {
    // Load redirect map from migration
    const redirectMap = await import('./data/redirect-map.json');

    return [
      // Shopify product URLs → new product URLs
      ...redirectMap.products.map(({ from, to }) => ({
        source: from,
        destination: to,
        permanent: true,
      })),

      // Shopify collection URLs → new collection URLs
      ...redirectMap.collections.map(({ from, to }) => ({
        source: from,
        destination: to,
        permanent: true,
      })),

      // Catch-all for old Shopify paths
      {
        source: '/products/:slug',
        destination: '/products/:slug',
        permanent: true,
      },
      {
        source: '/collections/:slug',
        destination: '/collections/:slug',
        permanent: true,
      },
    ];
  },
};
```

### Validation Script

```typescript
// scripts/migration/validate-migration.ts
async function validateMigration() {
  const shopifyData = JSON.parse(
    await fs.readFile('data/shopify-products.json', 'utf-8')
  );

  const results = {
    products: { expected: 0, actual: 0, match: false },
    variants: { expected: 0, actual: 0, match: false },
    images: { expected: 0, actual: 0, match: false },
    errors: [] as string[],
  };

  // Count Shopify records
  results.products.expected = shopifyData.length;
  results.variants.expected = shopifyData.reduce(
    (sum, p) => sum + p.variants.length, 0
  );
  results.images.expected = shopifyData.reduce(
    (sum, p) => sum + p.images.length, 0
  );

  // Count database records
  const [productCount] = await db.select({ count: sql`count(*)` }).from(products);
  const [variantCount] = await db.select({ count: sql`count(*)` }).from(productVariants);
  const [imageCount] = await db.select({ count: sql`count(*)` }).from(productImages);

  results.products.actual = productCount.count as number;
  results.variants.actual = variantCount.count as number;
  results.images.actual = imageCount.count as number;

  results.products.match = results.products.expected === results.products.actual;
  results.variants.match = results.variants.expected === results.variants.actual;
  results.images.match = results.images.expected === results.images.actual;

  // Sample validation: check random products
  const sampleSize = Math.min(10, shopifyData.length);
  const samples = shopifyData.sort(() => 0.5 - Math.random()).slice(0, sampleSize);

  for (const sp of samples) {
    const product = await db.query.products.findFirst({
      where: eq(products.slug, sp.handle),
      with: { variants: true, images: true },
    });

    if (!product) {
      results.errors.push(`Missing product: ${sp.handle}`);
      continue;
    }

    if (product.variants.length !== sp.variants.length) {
      results.errors.push(
        `Variant mismatch for ${sp.handle}: expected ${sp.variants.length}, got ${product.variants.length}`
      );
    }

    // Check images are accessible
    for (const img of product.images) {
      try {
        const response = await fetch(img.url, { method: 'HEAD' });
        if (!response.ok) {
          results.errors.push(`Broken image: ${img.url}`);
        }
      } catch {
        results.errors.push(`Image fetch failed: ${img.url}`);
      }
    }
  }

  return results;
}
```

## Migration Runbook

### Pre-Migration Checklist

- [ ] Shopify Admin API access confirmed
- [ ] Vercel Blob storage configured
- [ ] Backup current database
- [ ] Test migration on staging with subset

### Migration Steps

```bash
# 1. Export from Shopify
npm run migrate:export

# 2. Import products (includes variants and images)
npm run migrate:products

# 3. Validate product import
npm run migrate:validate:products

# 4. Import customers
npm run migrate:customers

# 5. Import orders
npm run migrate:orders

# 6. Full validation
npm run migrate:validate

# 7. Generate redirect map
npm run migrate:redirects
```

### Post-Migration Checklist

- [ ] All products visible on storefront
- [ ] All images loading correctly
- [ ] Sample orders accessible
- [ ] URL redirects working
- [ ] SEO crawl to verify no broken links

### Rollback Procedure

```bash
# If migration fails, restore from backup
npm run db:restore

# Clear uploaded images
npm run blob:clear
```

## Environment Variables

```bash
# Shopify API
SHOPIFY_SHOP_DOMAIN=herbarium-dyeworks.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_...

# Vercel Blob
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

## Testing Strategy

### Unit Tests
- Data transformation functions
- Status mapping
- URL slug handling

### Integration Tests
- Single product import
- Image download and upload
- Customer deduplication

### Dry Run
- Run full migration on staging
- Validate all counts
- Test storefront functionality

## Rollout Plan

1. **Week 1**: Export data, develop import scripts
2. **Week 2**: Test on staging environment
3. **Week 3**: Final dry run, validate
4. **Launch Day**: Run migration, verify, switch DNS

## Open Questions

- [ ] Preserve Shopify order numbers or generate new?
- [ ] Image hosting: Vercel Blob vs Cloudinary vs keep Shopify CDN?
- [ ] Customer notification about new platform?

## Definition of Done

- [ ] All products migrated with correct data
- [ ] All images accessible
- [ ] Customer records imported
- [ ] Historical orders viewable
- [ ] URL redirects working
- [ ] Validation passing
- [ ] Rollback tested
- [ ] Code reviewed and merged
