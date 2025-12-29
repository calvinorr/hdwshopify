# E17: Database Management & Migration

> **Status**: 🔄 IN PROGRESS
> **Priority**: HIGH - Required before E16 can be deployed
> **Branch**: `feature/e16-remove-variants` (depends on E16 schema changes)
> **Goal**: Ensure production data integrity, create migration tooling, and establish database management practices

## Overview

E16 removed the `productVariants` table, moving price/stock/sku directly to products. Before deploying, we need to:
1. Understand current production database state
2. Migrate any existing data safely
3. Ensure test environment has real Shopify data
4. Create reusable database management tooling

**Critical Constraint**: Do NOT remove any data from current schema. Preserve all Shopify product, collection, and tag data.

---

## User Stories

### US17.1: Audit Production Database State
**Status**: ✅ COMPLETE (2025-12-29)

- [x] Connect to production Turso database
- [x] Document current schema (tables, columns, relationships)
- [x] Count records in each table (products, variants, orders, customers, etc.)
- [x] Determine if data is real customer data or test data
- [x] Export current state as backup before any migration
- [x] Document findings in this epic

**Output**: Clear understanding of what data exists and what needs migrating.

#### Audit Findings (2025-12-29)

**Production Database Status**: ✅ CREATED AND POPULATED (2025-12-29)

| Database | Purpose | Location |
|----------|---------|----------|
| `herbarium-dyeworks-db` | Primary database | `libsql://herbarium-dyeworks-db-calvinorr.aws-eu-west-1.turso.io` |
| `herbarium-dyeworks-golden` | Immutable backup for dev resets | `libsql://herbarium-dyeworks-golden-calvinorr.aws-eu-west-1.turso.io` |

**Imported Data**:
| Table | Count | Notes |
|-------|-------|-------|
| products | 198 | Active products only |
| categories | 17 | Shopify collections |
| product_images | 281 | All product images |
| orders | 0 | Blocked by API (see below) |
| customers | 0 | Blocked by API (see below) |

**Shopify Source Data** (Real customer data from live store):
| Data Type | Count | Notes |
|-----------|-------|-------|
| Products | 250 | 156 active, 94 draft |
| Collections | 17 | See list below |
| Orders | 70 | £2,753.42 total value |
| Customers | ~37+ | API blocked (see below) |

**Collections in Shopify**:
1. Home page (163 products)
2. In stock (70 products)
3. Yarn (62 products)
4. 4 ply fingering (90 products)
5. Sept 24 shop update (49 products)
6. First shop update (39 products)
7. DK (21 products)
8. Laceweight (15 products)
9. Threads (9 products)
10. Mini skeins (8 products)
11. Fabric (7 products)
12. Aran (3 products)
13. Kits (3 products)
14. Calendars 2025 (1 product)
15. Open Studio (1 product)

**⚠️ CRITICAL BLOCKER: Customer Data Access**
```
ERROR: This app is not approved to access the Customer object.
Access to PII (names, addresses, emails, phone numbers) is only
available on Shopify Advanced and Plus plans.
```

The current Shopify API token cannot access customer data. Options:
1. **Request app approval** in Shopify Admin → Apps → Development → App configuration
2. **Upgrade Shopify plan** to Advanced or Plus
3. **Manual CSV export** from Shopify Admin (Customers → Export)

**What CAN be imported via API**:
- ✓ Products (all fields, images, metafields)
- ✓ Collections (with product assignments)
- ✓ Orders (order details, line items, totals)
- ✗ Customer PII (email, name, address, phone)

**Remaining Work**: To import orders and customers:
1. Ask client to export customers and orders as CSV from Shopify Admin
2. OR request customer data API access approval in Shopify (Apps → Development → App configuration)

**To reset dev database from golden backup**:
```bash
turso db shell herbarium-dyeworks-golden .dump > /tmp/backup.sql
turso db shell herbarium-dyeworks-db < /tmp/backup.sql
```

---

### US17.2: Create Database Management Skill
**Status**: TODO

Create `/db` skill that can:
- [ ] Connect to any environment (local, preview, production)
- [ ] Run schema comparisons between environments
- [ ] Execute migrations safely with rollback capability
- [ ] Backup/restore database snapshots
- [ ] Seed test data from Shopify export

**Skill location**: `~/.claude/commands/db.md`

**Commands the skill should support**:
```
/db status          - Show current DB connection and table counts
/db compare         - Compare local vs production schema
/db backup [name]   - Create named backup
/db restore [name]  - Restore from backup
/db migrate [name]  - Run a migration script
/db seed            - Seed from Shopify data
```

---

### US17.3: Write E16 Migration Script
**Status**: TODO

Migration script to handle variant → product data transformation:

- [ ] Create `scripts/migrations/e16-remove-variants.ts`
- [ ] For each product with variants:
  - Copy first variant's price → product.price
  - Copy first variant's compareAtPrice → product.compareAtPrice
  - Copy first variant's stock → product.stock
  - Copy first variant's weightGrams → product.weightGrams
  - Copy first variant's sku → product.sku
  - Store variant colorway info in product.colorHex or product metadata
- [ ] Update orderItems to use productId instead of variantId
- [ ] Update stockReservations to use productId
- [ ] Preserve original variant data in backup before deletion
- [ ] Add dry-run mode to preview changes without applying

---

### US17.4: Test Migration on Copy
**Status**: TODO

- [ ] Create copy of production database
- [ ] Run migration script in dry-run mode
- [ ] Review proposed changes
- [ ] Run migration script for real on copy
- [ ] Verify data integrity post-migration
- [ ] Run E2E tests against migrated copy
- [ ] Document any issues found

---

### US17.5: Sync Test Environment with Real Data
**Status**: TODO

Ensure local development has realistic data:

- [ ] Export Shopify products, collections, tags (if not already done)
- [ ] Create seed script that populates from Shopify export
- [ ] Include all product fields (fiber content, yardage, care instructions, etc.)
- [ ] Include all collection assignments
- [ ] Include all tag assignments
- [ ] Preserve product images (URLs or local copies)
- [ ] Verify seeded data matches Shopify source

---

## Technical Notes

### Current Schema (Pre-E16, on main branch)
```
products → productVariants → productImages
         → productTagAssignments → productTags
         → categories
```

### New Schema (E16, on feature branch)
```
products (with price, stock, sku, weightGrams, colorHex)
         → productImages
         → productTagAssignments → productTags
         → categories
```

### Migration Safety Rules
1. Always backup before migrating
2. Run dry-run first
3. Test on copy before production
4. Keep old variant data archived (don't delete permanently)
5. Verify record counts before and after

### Environment Variables
```
DATABASE_URL=file:./local.db           # Local SQLite
DATABASE_URL=libsql://...turso.io      # Production Turso
DATABASE_AUTH_TOKEN=...                 # Turso auth
```

---

## Parking Lot

- [ ] Consider multi-variant products in future (not for initial launch)
- [ ] Automated schema diff on deploy

---

## Dependencies

- **Blocked by**: Nothing
- **Blocks**: E16 deployment to production
- **Related**: E16-remove-variants.md

