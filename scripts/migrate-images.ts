/**
 * Image Migration Script
 *
 * Migrates all images from Shopify CDN to Vercel Blob storage.
 *
 * Usage:
 *   npx tsx scripts/migrate-images.ts [--dry-run]
 *
 * Required env vars:
 *   - DATABASE_URL
 *   - DATABASE_AUTH_TOKEN
 *   - BLOB_READ_WRITE_TOKEN
 */

import { put } from "@vercel/blob";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, like } from "drizzle-orm";
import * as schema from "../lib/db/schema";

const SHOPIFY_CDN_PATTERN = "cdn.shopify.com";
const DRY_RUN = process.argv.includes("--dry-run");

// Initialize database
const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

interface MigrationResult {
  table: string;
  id: number;
  oldUrl: string;
  newUrl: string;
  success: boolean;
  error?: string;
}

const results: MigrationResult[] = [];

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToBlob(buffer: Buffer, filename: string, contentType: string): Promise<string> {
  const blob = await put(filename, buffer, {
    access: "public",
    contentType,
    addRandomSuffix: false,
  });
  return blob.url;
}

function getFilenameFromUrl(url: string): string {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split("/");
  const originalFilename = pathParts[pathParts.length - 1];

  // Clean up Shopify's versioned filenames (e.g., image_1024x.jpg -> image.jpg)
  const cleanFilename = originalFilename.replace(/_\d+x(\d+)?/, "");

  // Add timestamp prefix for uniqueness
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);

  return `migrated/${timestamp}-${randomSuffix}-${cleanFilename}`;
}

function getContentType(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase().split("?")[0];
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    avif: "image/avif",
  };
  return types[ext || ""] || "image/jpeg";
}

async function migrateProductImages() {
  console.log("\n📦 Migrating product images...");

  const images = await db.query.productImages.findMany();
  const shopifyImages = images.filter(img => img.url.includes(SHOPIFY_CDN_PATTERN));

  console.log(`   Found ${shopifyImages.length} Shopify images out of ${images.length} total`);

  for (const image of shopifyImages) {
    try {
      console.log(`   [${image.id}] ${image.url.substring(0, 60)}...`);

      if (DRY_RUN) {
        results.push({
          table: "product_images",
          id: image.id,
          oldUrl: image.url,
          newUrl: "[DRY RUN]",
          success: true,
        });
        continue;
      }

      const buffer = await downloadImage(image.url);
      const filename = getFilenameFromUrl(image.url);
      const contentType = getContentType(image.url);
      const newUrl = await uploadToBlob(buffer, filename, contentType);

      await db.update(schema.productImages)
        .set({ url: newUrl })
        .where(eq(schema.productImages.id, image.id));

      results.push({
        table: "product_images",
        id: image.id,
        oldUrl: image.url,
        newUrl,
        success: true,
      });

      console.log(`   ✓ Migrated to ${newUrl.substring(0, 50)}...`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`   ✗ Failed: ${errorMessage}`);
      results.push({
        table: "product_images",
        id: image.id,
        oldUrl: image.url,
        newUrl: "",
        success: false,
        error: errorMessage,
      });
    }
  }
}

async function migrateHeroSlides() {
  console.log("\n🎠 Migrating hero slides...");

  const slides = await db.query.heroSlides.findMany();
  const shopifySlides = slides.filter(slide => slide.imageUrl.includes(SHOPIFY_CDN_PATTERN));

  console.log(`   Found ${shopifySlides.length} Shopify images out of ${slides.length} total`);

  for (const slide of shopifySlides) {
    try {
      console.log(`   [${slide.id}] ${slide.imageUrl.substring(0, 60)}...`);

      if (DRY_RUN) {
        results.push({
          table: "hero_slides",
          id: slide.id,
          oldUrl: slide.imageUrl,
          newUrl: "[DRY RUN]",
          success: true,
        });
        continue;
      }

      const buffer = await downloadImage(slide.imageUrl);
      const filename = getFilenameFromUrl(slide.imageUrl);
      const contentType = getContentType(slide.imageUrl);
      const newUrl = await uploadToBlob(buffer, filename, contentType);

      await db.update(schema.heroSlides)
        .set({ imageUrl: newUrl })
        .where(eq(schema.heroSlides.id, slide.id));

      results.push({
        table: "hero_slides",
        id: slide.id,
        oldUrl: slide.imageUrl,
        newUrl,
        success: true,
      });

      console.log(`   ✓ Migrated to ${newUrl.substring(0, 50)}...`);
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`   ✗ Failed: ${errorMessage}`);
      results.push({
        table: "hero_slides",
        id: slide.id,
        oldUrl: slide.imageUrl,
        newUrl: "",
        success: false,
        error: errorMessage,
      });
    }
  }
}

async function migrateCategoryImages() {
  console.log("\n📁 Migrating category images...");

  const categories = await db.query.categories.findMany();
  const shopifyCategories = categories.filter(cat => cat.image?.includes(SHOPIFY_CDN_PATTERN));

  console.log(`   Found ${shopifyCategories.length} Shopify images out of ${categories.length} total`);

  for (const category of shopifyCategories) {
    if (!category.image) continue;

    try {
      console.log(`   [${category.id}] ${category.image.substring(0, 60)}...`);

      if (DRY_RUN) {
        results.push({
          table: "categories",
          id: category.id,
          oldUrl: category.image,
          newUrl: "[DRY RUN]",
          success: true,
        });
        continue;
      }

      const buffer = await downloadImage(category.image);
      const filename = getFilenameFromUrl(category.image);
      const contentType = getContentType(category.image);
      const newUrl = await uploadToBlob(buffer, filename, contentType);

      await db.update(schema.categories)
        .set({ image: newUrl })
        .where(eq(schema.categories.id, category.id));

      results.push({
        table: "categories",
        id: category.id,
        oldUrl: category.image,
        newUrl,
        success: true,
      });

      console.log(`   ✓ Migrated to ${newUrl.substring(0, 50)}...`);
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`   ✗ Failed: ${errorMessage}`);
      results.push({
        table: "categories",
        id: category.id,
        oldUrl: category.image,
        newUrl: "",
        success: false,
        error: errorMessage,
      });
    }
  }
}

async function main() {
  console.log("🖼️  Shopify → Vercel Blob Image Migration");
  console.log("==========================================");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  // Check required env vars
  if (!process.env.DATABASE_URL) {
    console.error("❌ Missing DATABASE_URL environment variable");
    process.exit(1);
  }

  if (!DRY_RUN && !process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("❌ Missing BLOB_READ_WRITE_TOKEN environment variable");
    process.exit(1);
  }

  try {
    await migrateProductImages();
    await migrateHeroSlides();
    await migrateCategoryImages();

    // Summary
    console.log("\n==========================================");
    console.log("📊 Migration Summary");
    console.log("==========================================");

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✓ Successful: ${successful.length}`);
    console.log(`✗ Failed: ${failed.length}`);

    if (failed.length > 0) {
      console.log("\n❌ Failed migrations:");
      for (const f of failed) {
        console.log(`   - [${f.table}:${f.id}] ${f.error}`);
      }
    }

    // Group by table
    const byTable = results.reduce((acc, r) => {
      acc[r.table] = (acc[r.table] || 0) + (r.success ? 1 : 0);
      return acc;
    }, {} as Record<string, number>);

    console.log("\n📦 By table:");
    for (const [table, count] of Object.entries(byTable)) {
      console.log(`   - ${table}: ${count} migrated`);
    }

    if (DRY_RUN) {
      console.log("\n💡 Run without --dry-run to perform actual migration");
    } else {
      console.log("\n✅ Migration complete!");
      console.log("   Don't forget to run: npm run db:push");
    }

  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
