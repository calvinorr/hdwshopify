# E17: Database Management & Migration

> **Status**: 📋 TODO
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
**Status**: TODO

- [ ] Connect to production Turso database
- [ ] Document current schema (tables, columns, relationships)
- [ ] Count records in each table (products, variants, orders, customers, etc.)
- [ ] Determine if data is real customer data or test data
- [ ] Export current state as backup before any migration
- [ ] Document findings in this epic

**Output**: Clear understanding of what data exists and what needs migrating.

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

