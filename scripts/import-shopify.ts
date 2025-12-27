/**
 * Shopify Import Script
 *
 * Imports customers and orders from Shopify.
 * Run with: npx tsx scripts/import-shopify.ts
 *
 * Requires:
 *   - SHOPIFY_STORE_DOMAIN
 *   - SHOPIFY_ACCESS_TOKEN
 *   - DATABASE_URL
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { migrateCustomers, migrateOrders } from "../lib/shopify";

async function main() {
  console.log("🚀 Starting Shopify Import...\n");

  // Import customers first
  console.log("👥 Importing customers...");
  try {
    const customerResult = await migrateCustomers({ limit: 250 });
    console.log(`✅ Customers: ${customerResult.customersImported} imported, ${customerResult.customersSkipped} updated`);
    console.log(`   Addresses: ${customerResult.addressesImported} imported`);
    if (customerResult.errors.length > 0) {
      console.log(`   ⚠️ ${customerResult.errors.length} warnings:`);
      customerResult.errors.forEach(err => console.log(`      - ${err}`));
    }
  } catch (error) {
    console.error("❌ Customer import failed:", error);
  }

  console.log("");

  // Import orders
  console.log("📦 Importing orders...");
  try {
    const orderResult = await migrateOrders({ limit: 250 });
    console.log(`✅ Orders: ${orderResult.ordersImported} imported, ${orderResult.ordersSkipped} skipped`);
    console.log(`   Line items: ${orderResult.orderItemsImported} imported`);
    if (orderResult.errors.length > 0) {
      console.log(`   ⚠️ ${orderResult.errors.length} warnings:`);
      orderResult.errors.forEach(err => console.log(`      - ${err}`));
    }
  } catch (error) {
    console.error("❌ Order import failed:", error);
  }

  console.log("\n✨ Import complete!");
}

main().catch(console.error);
