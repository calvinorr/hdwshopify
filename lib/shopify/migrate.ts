/**
 * Shopify to Herbarium Dyeworks Migration Script
 *
 * Imports products, variants, images, and collections from Shopify
 * into our local database.
 */

import { db } from "@/lib/db";
import { products, productVariants, productImages, categories } from "@/lib/db/schema";
import { shopify, type ShopifyProduct, type ShopifyCollection } from "./client";
import { eq } from "drizzle-orm";

interface MigrationResult {
  productsImported: number;
  variantsImported: number;
  imagesImported: number;
  collectionsImported: number;
  errors: string[];
}

/**
 * Parse yarn weight from product tags or type
 */
function parseYarnWeight(product: ShopifyProduct): string | null {
  const tags = product.tags.toLowerCase();
  const title = product.title.toLowerCase();

  if (tags.includes("laceweight") || title.includes("lace")) return "Laceweight";
  if (tags.includes("4ply") || tags.includes("4-ply") || tags.includes("fingering")) return "4ply";
  if (tags.includes("dk") || title.includes(" dk")) return "DK";
  if (tags.includes("aran") || title.includes("aran")) return "Aran";
  if (tags.includes("heavylace")) return "Heavy Laceweight";

  return null;
}

/**
 * Parse fiber content from description
 */
function parseFiberContent(bodyHtml: string | null): string | null {
  if (!bodyHtml) return null;

  // Look for common patterns like "74% baby suri alpaca 26% silk"
  const fiberMatch = bodyHtml.match(/(\d+%\s*[\w\s]+(?:,?\s*\d+%\s*[\w\s]+)*)/i);
  if (fiberMatch) {
    return fiberMatch[1].replace(/<[^>]*>/g, "").trim();
  }

  return null;
}

/**
 * Parse yardage from description
 */
function parseYardage(bodyHtml: string | null): string | null {
  if (!bodyHtml) return null;

  // Look for patterns like "300m" or "300 meters"
  const yardageMatch = bodyHtml.match(/(\d+)\s*m(?:eters?)?/i);
  if (yardageMatch) {
    return `${yardageMatch[1]}m`;
  }

  return null;
}

/**
 * Clean HTML to plain text
 */
function htmlToText(html: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Import a single product from Shopify
 */
async function importProduct(shopifyProduct: ShopifyProduct): Promise<{ productId: number; variantCount: number; imageCount: number }> {
  // Map Shopify status to our status
  const statusMap: Record<string, "draft" | "active" | "archived"> = {
    active: "active",
    draft: "draft",
    archived: "archived",
  };

  // Check if product already exists (by slug/handle)
  const existing = await db.query.products.findFirst({
    where: eq(products.slug, shopifyProduct.handle),
  });

  if (existing) {
    // Update existing product
    await db.update(products)
      .set({
        name: shopifyProduct.title,
        description: htmlToText(shopifyProduct.body_html),
        status: statusMap[shopifyProduct.status] || "draft",
        fiberContent: parseFiberContent(shopifyProduct.body_html),
        weight: parseYarnWeight(shopifyProduct),
        yardage: parseYardage(shopifyProduct.body_html),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(products.id, existing.id));

    // Delete existing variants and images (will re-import)
    await db.delete(productVariants).where(eq(productVariants.productId, existing.id));
    await db.delete(productImages).where(eq(productImages.productId, existing.id));

    return await importVariantsAndImages(existing.id, shopifyProduct);
  }

  // Create new product
  const [newProduct] = await db.insert(products).values({
    name: shopifyProduct.title,
    slug: shopifyProduct.handle,
    description: htmlToText(shopifyProduct.body_html),
    basePrice: shopifyProduct.variants[0]?.price ? parseFloat(shopifyProduct.variants[0].price) : 0,
    status: statusMap[shopifyProduct.status] || "draft",
    featured: false,
    fiberContent: parseFiberContent(shopifyProduct.body_html),
    weight: parseYarnWeight(shopifyProduct),
    yardage: parseYardage(shopifyProduct.body_html),
    shopifyId: shopifyProduct.id.toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning();

  return await importVariantsAndImages(newProduct.id, shopifyProduct);
}

/**
 * Import variants and images for a product
 */
async function importVariantsAndImages(
  productId: number,
  shopifyProduct: ShopifyProduct
): Promise<{ productId: number; variantCount: number; imageCount: number }> {
  // Import variants
  let variantCount = 0;
  for (const variant of shopifyProduct.variants) {
    await db.insert(productVariants).values({
      productId,
      name: variant.title === "Default Title" ? shopifyProduct.title : variant.title,
      sku: variant.sku,
      price: parseFloat(variant.price),
      compareAtPrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
      stock: variant.inventory_quantity,
      weightGrams: variant.grams || variant.weight || 100,
      position: variant.position,
      shopifyVariantId: variant.id.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    variantCount++;
  }

  // Import images
  let imageCount = 0;
  for (const image of shopifyProduct.images) {
    // Find which variant this image belongs to (if any)
    let variantId: number | null = null;
    if (image.variant_ids.length > 0) {
      const variant = await db.query.productVariants.findFirst({
        where: eq(productVariants.shopifyVariantId, image.variant_ids[0].toString()),
      });
      variantId = variant?.id ?? null;
    }

    await db.insert(productImages).values({
      productId,
      variantId,
      url: image.src,
      alt: image.alt,
      position: image.position,
      createdAt: new Date().toISOString(),
    });
    imageCount++;
  }

  return { productId, variantCount, imageCount };
}

/**
 * Import a collection from Shopify
 */
async function importCollection(shopifyCollection: ShopifyCollection): Promise<number> {
  // Check if collection exists
  const existing = await db.query.categories.findFirst({
    where: eq(categories.slug, shopifyCollection.handle),
  });

  if (existing) {
    // Update
    await db.update(categories)
      .set({
        name: shopifyCollection.title,
        description: htmlToText(shopifyCollection.body_html),
        image: shopifyCollection.image?.src,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, existing.id));
    return existing.id;
  }

  // Create new
  const [newCategory] = await db.insert(categories).values({
    name: shopifyCollection.title,
    slug: shopifyCollection.handle,
    description: htmlToText(shopifyCollection.body_html),
    image: shopifyCollection.image?.src,
    shopifyCollectionId: shopifyCollection.id.toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).returning();

  return newCategory.id;
}

/**
 * Run full migration
 */
export async function migrateFromShopify(options?: {
  limit?: number;
  activeOnly?: boolean;
}): Promise<MigrationResult> {
  const result: MigrationResult = {
    productsImported: 0,
    variantsImported: 0,
    imagesImported: 0,
    collectionsImported: 0,
    errors: [],
  };

  console.log("Starting Shopify migration...");

  // Import collections first
  console.log("Importing collections...");
  try {
    const collections = await shopify.getAllCollections();
    for (const collection of collections) {
      try {
        await importCollection(collection);
        result.collectionsImported++;
        console.log(`  ✓ Collection: ${collection.title}`);
      } catch (error) {
        result.errors.push(`Collection ${collection.title}: ${error}`);
      }
    }
  } catch (error) {
    result.errors.push(`Failed to fetch collections: ${error}`);
  }

  // Import products
  console.log("Importing products...");
  try {
    let products = await shopify.getProducts(options?.limit || 250);

    // Filter to active only if requested
    if (options?.activeOnly) {
      products = products.filter((p) => p.status === "active");
    }

    // Limit if specified
    if (options?.limit) {
      products = products.slice(0, options.limit);
    }

    for (const product of products) {
      try {
        const imported = await importProduct(product);
        result.productsImported++;
        result.variantsImported += imported.variantCount;
        result.imagesImported += imported.imageCount;
        console.log(`  ✓ Product: ${product.title} (${imported.variantCount} variants, ${imported.imageCount} images)`);
      } catch (error) {
        result.errors.push(`Product ${product.title}: ${error}`);
        console.error(`  ✗ Product ${product.title}: ${error}`);
      }
    }
  } catch (error) {
    result.errors.push(`Failed to fetch products: ${error}`);
  }

  console.log("\nMigration complete!");
  console.log(`  Products: ${result.productsImported}`);
  console.log(`  Variants: ${result.variantsImported}`);
  console.log(`  Images: ${result.imagesImported}`);
  console.log(`  Collections: ${result.collectionsImported}`);
  if (result.errors.length > 0) {
    console.log(`  Errors: ${result.errors.length}`);
  }

  return result;
}

/**
 * Import just a few sample products for testing
 */
export async function importSampleProducts(count = 20): Promise<MigrationResult> {
  return migrateFromShopify({ limit: count, activeOnly: true });
}
