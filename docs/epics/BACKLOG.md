# Feature Backlog

> **Status**: POST-LAUNCH ENHANCEMENTS
> **Priority**: P2-P3 (Nice to have)

This document consolidates future enhancement ideas. These features are not required for launch but could be added later based on business needs.

---

## Engagement Features (formerly E10)

**Priority**: P2 (Medium)
**Complexity**: High

### Product Reviews & Ratings
- Customer can leave reviews on products they've purchased
- Star rating (1-5) with title and content
- Admin moderation queue (approve/reject)
- Verified purchase badge
- Average rating display on product cards
- Review sorting (newest, highest rated, most helpful)

### Wishlist / Favorites
- Heart button on product cards
- Saved items page at `/wishlist`
- "Add all to cart" functionality
- Back-in-stock notifications for wishlisted items
- Requires customer account

### Search Autocomplete
- Dropdown suggestions as user types
- Shows matching products with thumbnails
- Shows matching collections
- Keyboard navigation support
- "See all results" link

### Price Range Filter
- Dual-handle slider for min/max price
- Manual input fields
- Works with variant pricing (shows products where any variant matches)
- URL parameter support for shareable filtered views

---

## Polish Features (formerly E11)

**Priority**: P3 (Low)
**Complexity**: Low-Medium

### Yarn Weight Guide
- Educational page at `/yarn-weight-guide`
- Explains each weight category (Lace, 4ply, DK, Aran, etc.)
- Gauge, needle sizes, common uses
- Links to shop filtered by weight
- Info tooltips on product pages

### Back-in-Stock Notifications
- Email signup form on sold-out variants
- "Notify me when available" button
- Automatic email when stock > 0
- Admin view of pending notifications
- Manual trigger option in admin

---

## Infrastructure (formerly E8)

**Priority**: P1 (Post-launch cost optimization)
**Complexity**: Medium
**Estimated Savings**: ~$250/year

### Cloudflare Migration
- Move from Vercel to Cloudflare Pages
- Migrate images from Vercel Blob to Cloudflare R2
- Update deployment pipeline
- DNS cutover

**Benefits**:
- $240/year Vercel Pro → $0 Cloudflare Pages
- $30-50/year Vercel Blob → $0 Cloudflare R2 (10GB free)
- Same or better performance

**Considerations**:
- Requires removing ISR (use on-demand revalidation instead)
- Need to test Clerk auth compatibility
- Keep Vercel as fallback during transition

See `E8-cloudflare-migration.md` for detailed migration plan.

---

## Quick Wins (Low Effort, High Impact)

These could be done anytime with minimal effort:

1. **Announcement Bar** - Editable banner for sales/shipping info
2. **Social Sharing** - Share buttons on product pages
3. **Related Products Improvements** - Better algorithm based on fiber/weight
4. **Order Notes** - Let customers add notes at checkout
5. **Gift Wrapping Option** - Add-on at checkout

---

## Not Planned

To keep scope manageable, we're explicitly **not** building:

- Multi-currency support (GBP only)
- Gift cards
- Subscriptions / recurring orders
- Advanced analytics (use Plausible/Fathom instead)
- Complex promotions (BOGO, bundles)
- Multi-user admin with roles
- Inventory sync with Shopify (one-time migration done)

These could be reconsidered based on business needs.

---

## How to Prioritize

When deciding what to build next:

1. **Does it directly increase sales?** (Reviews, wishlist)
2. **Does it reduce support burden?** (Yarn guide, better search)
3. **Does it save money?** (Cloudflare migration)
4. **Is the effort justified?** (Quick wins vs. complex features)

Start with quick wins, then tackle high-impact features based on customer feedback.
