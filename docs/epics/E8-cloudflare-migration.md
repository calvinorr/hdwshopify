# E8: Cloudflare Migration

> **Status**: NOT STARTED
> **Priority**: P1 - After E3 Checkout is complete
> **Estimated Effort**: 6-9 hours
> **Annual Savings**: ~$250-280 (Vercel Pro + Blob → Cloudflare Free)

## Overview

Migrate the entire platform from Vercel to Cloudflare Pages + Workers to reduce hosting costs to near-zero while maintaining performance and reliability.

## Business Value

- **Cost reduction**: $240-290/year → $0-10/year
- **Performance**: Cloudflare's edge network often faster than Vercel
- **Reliability**: Cloudflare's infrastructure is battle-tested
- **Full ownership**: No vendor lock-in to Vercel-specific features

## Current vs Target Stack

| Component | Current (Vercel) | Target (Cloudflare) |
|-----------|------------------|---------------------|
| Hosting | Vercel Pro ($20/mo) | Cloudflare Pages (Free) |
| Database | Turso (Free tier) | Turso (unchanged) |
| Image Storage | Vercel Blob | Cloudflare R2 (Free 10GB) |
| Auth | Clerk | Clerk (unchanged) |
| Payments | Stripe | Stripe (unchanged) |
| Email | Resend | Resend (unchanged) |
| CDN | Vercel Edge | Cloudflare (Free) |

## Prerequisites (Must Complete First)

Before starting this migration, complete these epics:

- [x] E1: Product Catalog (mostly complete)
- [ ] **E3: Checkout & Payments** (CRITICAL - blocks all sales)
- [ ] E4: Shipping integration with checkout
- [ ] E7: Image migration (migrate to R2, not Vercel Blob)

## Migration Tasks

### Phase 1: Preparation (1-2 hours)

#### 1.1 Remove ISR Exports
ISR (Incremental Static Regeneration) is not supported on Cloudflare.

**Files to update:**
- [ ] `app/page.tsx` - Remove `export const revalidate = 60`
- [ ] `app/collections/page.tsx` - Remove `export const revalidate = 3600`
- [ ] `app/collections/[slug]/page.tsx` - Remove `export const revalidate = 3600`
- [ ] `app/products/[slug]/page.tsx` - Remove `export const revalidate = 3600`

**Alternative:** Use on-demand revalidation via admin webhook after product updates.

#### 1.2 Update Image Config
```typescript
// next.config.ts - Add R2 hostname
{
  protocol: "https",
  hostname: "*.r2.cloudflarestorage.com",
}
```

### Phase 2: Image Storage Migration (2-3 hours)

#### 2.1 Set Up Cloudflare R2 Bucket
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create R2 bucket
wrangler r2 bucket create herbarium-images
```

#### 2.2 Update Upload API Route
Replace `@vercel/blob` with R2:

```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  // Upload to R2
  const filename = `products/${Date.now()}-${file.name}`;
  await env.IMAGES.put(filename, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return NextResponse.json({
    url: `${env.R2_PUBLIC_URL}/${filename}`,
  });
}
```

#### 2.3 Migrate Existing Images
Update `scripts/migrate-images.ts` to upload to R2 instead of Vercel Blob.

### Phase 3: Environment Configuration (1 hour)

#### 3.1 Create wrangler.toml
```toml
name = "herbarium-dyeworks"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "herbarium-images"

[vars]
NODE_ENV = "production"
```

#### 3.2 Add Secrets
```bash
wrangler secret put DATABASE_URL
wrangler secret put DATABASE_AUTH_TOKEN
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put CLERK_SECRET_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put ADMIN_USER_IDS
```

### Phase 4: Deploy & Test (2-3 hours)

#### 4.1 Install OpenNext for Cloudflare
```bash
npm install @opennextjs/cloudflare
```

#### 4.2 Update Build Configuration
```json
// package.json
{
  "scripts": {
    "build:cf": "npx @opennextjs/cloudflare build",
    "deploy": "wrangler pages deploy .open-next"
  }
}
```

#### 4.3 Test Locally
```bash
wrangler pages dev .open-next
```

#### 4.4 Deploy to Cloudflare
```bash
npm run build:cf && npm run deploy
```

### Phase 5: DNS Cutover (30 min)

#### 5.1 Add Custom Domain
```bash
wrangler pages project create herbarium-dyeworks
# Add domain in Cloudflare dashboard
```

#### 5.2 Update DNS
Point `herbarium-dyeworks.com` to Cloudflare Pages.

#### 5.3 Verify SSL
Cloudflare provides free SSL automatically.

## Compatibility Notes

### Confirmed Working
| Feature | Status | Notes |
|---------|--------|-------|
| Turso (libsql) | ✅ Works | Edge-compatible |
| Stripe SDK | ✅ Works | HTTP/fetch-based |
| Stripe Webhooks | ✅ Works | Signature verification works |
| Resend Email | ✅ Works | API calls |
| Drizzle ORM | ✅ Works | Same as before |
| App Router | ✅ Works | Supported |
| Server Components | ✅ Works | Supported |
| API Routes | ✅ Works | Supported |
| Middleware | ✅ Works | Runs as Proxy |

### Needs Testing
| Feature | Status | Notes |
|---------|--------|-------|
| Clerk Auth | ⚠️ Test | May need timeout adjustments |
| cookies() API | ⚠️ Test | Cart sessions |
| headers() API | ⚠️ Test | Used in webhooks |

### Not Supported
| Feature | Status | Alternative |
|---------|--------|-------------|
| ISR (revalidate) | ❌ | On-demand revalidation |
| Vercel Blob | ❌ | Cloudflare R2 |
| next/image optimization | ⚠️ | Use `unoptimized` or Cloudflare Images |

## Rollback Plan

If migration fails:
1. DNS remains pointed at Vercel until cutover
2. Keep Vercel deployment running during testing
3. Switch DNS back to Vercel if issues

## Testing Checklist

Before DNS cutover, verify:

- [ ] Homepage loads correctly
- [ ] Product pages render
- [ ] Product filtering/sorting works
- [ ] Cart add/remove works
- [ ] Cart persists across sessions
- [ ] Admin login works (Clerk)
- [ ] Admin product CRUD works
- [ ] Image uploads work (R2)
- [ ] Checkout flow works (Stripe)
- [ ] Webhook receives events
- [ ] Order confirmation emails send
- [ ] Mobile responsive

## Post-Migration

- [ ] Remove Vercel project (after 1 week stable)
- [ ] Cancel Vercel Pro subscription
- [ ] Update CLAUDE.md with new deployment info
- [ ] Monitor Cloudflare analytics

## Cost Breakdown

### Before (Vercel)
| Service | Cost |
|---------|------|
| Vercel Pro | $240/year |
| Vercel Blob (est. 1GB) | $30-50/year |
| **Total** | **$270-290/year** |

### After (Cloudflare)
| Service | Cost |
|---------|------|
| Cloudflare Pages | Free |
| Cloudflare R2 (10GB free) | $0 |
| Turso (free tier) | $0 |
| **Total** | **$0-10/year** |

## Open Questions

- [ ] Image optimization strategy on Cloudflare?
- [ ] On-demand revalidation webhook implementation?
- [ ] Monitoring/logging setup?

## Definition of Done

- [ ] All pages render correctly on Cloudflare
- [ ] Checkout flow works end-to-end
- [ ] Admin dashboard fully functional
- [ ] Image uploads working via R2
- [ ] DNS pointing to Cloudflare
- [ ] Vercel project decommissioned
- [ ] Cost savings realized
