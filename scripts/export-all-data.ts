/**
 * Full Data Export Script
 *
 * Exports all business data in a human-readable format for:
 * - Data portability
 * - GDPR compliance requests
 * - Business continuity / migration
 *
 * Run with: npm run data:export
 *
 * Output: exports/full-export-{timestamp}/
 *   - products.json      (products with variants and images)
 *   - customers.json     (customers with addresses)
 *   - orders.json        (orders with items and events)
 *   - settings.json      (site settings, shipping, discounts)
 *   - manifest.json      (export metadata)
 */

import "dotenv/config";
import { db } from "../lib/db";
import {
  categories,
  products,
  productVariants,
  productImages,
  customers,
  addresses,
  orders,
  orderItems,
  orderEvents,
  discountCodes,
  shippingZones,
  shippingRates,
  siteSettings,
  weightTypes,
  productTags,
  heroSlides,
  newsletterSubscribers,
} from "../lib/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function exportAllData() {
  console.log("Starting full data export...\n");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const exportDir = path.join(process.cwd(), "exports", `full-export-${timestamp}`);

  // Create export directory
  fs.mkdirSync(exportDir, { recursive: true });

  try {
    // 1. Export Products (with variants and images nested)
    console.log("Exporting products...");
    const allProducts = await db.select().from(products);
    const allVariants = await db.select().from(productVariants);
    const allImages = await db.select().from(productImages);
    const allCategories = await db.select().from(categories);
    const allWeightTypes = await db.select().from(weightTypes);
    const allProductTags = await db.select().from(productTags);

    const productsWithDetails = allProducts.map((product) => ({
      ...product,
      variants: allVariants.filter((v) => v.productId === product.id),
      images: allImages.filter((i) => i.productId === product.id),
    }));

    const productsExport = {
      exportedAt: new Date().toISOString(),
      products: productsWithDetails,
      categories: allCategories,
      weightTypes: allWeightTypes,
      tags: allProductTags,
    };

    fs.writeFileSync(
      path.join(exportDir, "products.json"),
      JSON.stringify(productsExport, null, 2)
    );
    console.log(`  ${allProducts.length} products exported`);

    // 2. Export Customers (with addresses)
    console.log("Exporting customers...");
    const allCustomers = await db.select().from(customers);
    const allAddresses = await db.select().from(addresses);

    const customersWithAddresses = allCustomers.map((customer) => ({
      ...customer,
      addresses: allAddresses.filter((a) => a.customerId === customer.id),
    }));

    const customersExport = {
      exportedAt: new Date().toISOString(),
      customers: customersWithAddresses,
      newsletterSubscribers: await db.select().from(newsletterSubscribers),
    };

    fs.writeFileSync(
      path.join(exportDir, "customers.json"),
      JSON.stringify(customersExport, null, 2)
    );
    console.log(`  ${allCustomers.length} customers exported`);

    // 3. Export Orders (with items and events)
    console.log("Exporting orders...");
    const allOrders = await db.select().from(orders);
    const allOrderItems = await db.select().from(orderItems);
    const allOrderEvents = await db.select().from(orderEvents);

    const ordersWithDetails = allOrders.map((order) => ({
      ...order,
      items: allOrderItems.filter((i) => i.orderId === order.id),
      events: allOrderEvents.filter((e) => e.orderId === order.id),
    }));

    const ordersExport = {
      exportedAt: new Date().toISOString(),
      orders: ordersWithDetails,
    };

    fs.writeFileSync(
      path.join(exportDir, "orders.json"),
      JSON.stringify(ordersExport, null, 2)
    );
    console.log(`  ${allOrders.length} orders exported`);

    // 4. Export Settings
    console.log("Exporting settings...");
    const allShippingZones = await db.select().from(shippingZones);
    const allShippingRates = await db.select().from(shippingRates);
    const allDiscountCodes = await db.select().from(discountCodes);
    const allSiteSettings = await db.select().from(siteSettings);
    const allHeroSlides = await db.select().from(heroSlides);

    const shippingWithRates = allShippingZones.map((zone) => ({
      ...zone,
      rates: allShippingRates.filter((r) => r.zoneId === zone.id),
    }));

    const settingsExport = {
      exportedAt: new Date().toISOString(),
      siteSettings: allSiteSettings,
      shipping: shippingWithRates,
      discountCodes: allDiscountCodes,
      heroSlides: allHeroSlides,
    };

    fs.writeFileSync(
      path.join(exportDir, "settings.json"),
      JSON.stringify(settingsExport, null, 2)
    );
    console.log("  Settings exported");

    // 5. Create manifest
    const manifest = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      format: "JSON",
      files: [
        "products.json",
        "customers.json",
        "orders.json",
        "settings.json",
      ],
      counts: {
        products: allProducts.length,
        variants: allVariants.length,
        images: allImages.length,
        customers: allCustomers.length,
        orders: allOrders.length,
        orderItems: allOrderItems.length,
        discountCodes: allDiscountCodes.length,
        shippingZones: allShippingZones.length,
      },
      notes: [
        "This export contains all business data from the Herbarium Dyeworks store.",
        "Data can be re-imported by parsing the JSON files and inserting into the database.",
        "For GDPR requests, the customers.json file contains all personal data.",
        "Passwords and payment details are NOT included in this export.",
      ],
    };

    fs.writeFileSync(
      path.join(exportDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    // Summary
    console.log("\n========================================");
    console.log("Export complete!");
    console.log(`Location: ${exportDir}`);
    console.log("\nFiles created:");
    console.log("  - products.json");
    console.log("  - customers.json");
    console.log("  - orders.json");
    console.log("  - settings.json");
    console.log("  - manifest.json");
    console.log("\nCounts:");
    Object.entries(manifest.counts).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log("========================================");
  } catch (error) {
    console.error("Export failed:", error);
    process.exit(1);
  }
}

exportAllData();
