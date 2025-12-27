// Load environment variables first - must be done before any other imports
import { config } from "dotenv";
const result = config({ path: ".env.local" });

if (result.error) {
  console.error("Failed to load .env.local:", result.error);
  process.exit(1);
}

// Now import the rest
async function main() {
  console.log("🔄 Starting Shopify migration...\n");

  // Verify env vars are loaded
  console.log(`📦 Database: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
  console.log(`📦 Store: ${process.env.SHOPIFY_STORE_DOMAIN}`);

  if (!process.env.DATABASE_URL) {
    console.error("❌ Missing DATABASE_URL");
    process.exit(1);
  }

  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ACCESS_TOKEN) {
    console.error("❌ Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ACCESS_TOKEN");
    process.exit(1);
  }

  // Dynamic import after env is set
  const { migrateFromShopify, clearAllProducts } = await import("../lib/shopify");

  // Clear existing products first
  console.log("\n🗑️  Clearing existing products...");
  await clearAllProducts();
  console.log("✅ Cleared existing products");

  // Run migration
  console.log("\n📥 Importing products from Shopify...");
  const migrationResult = await migrateFromShopify({
    limit: 250,
    activeOnly: true,
    clearExisting: false,
  });

  console.log("\n✅ Migration completed!");
  console.log(`   Collections imported: ${migrationResult.collectionsImported}`);
  console.log(`   Products imported: ${migrationResult.productsImported}`);
  console.log(`   Variants imported: ${migrationResult.variantsImported}`);
  console.log(`   Images imported: ${migrationResult.imagesImported}`);

  if (migrationResult.errors.length > 0) {
    console.log("\n⚠️  Errors:");
    migrationResult.errors.forEach((err) => console.log(`   - ${err}`));
  }
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
