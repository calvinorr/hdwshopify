/**
 * Migration Validation Script
 *
 * Validates the integrity of migrated data from Shopify.
 * Run with: npx tsx scripts/validate-migration.ts
 *
 * Checks:
 * - Record counts for all tables
 * - Data integrity (foreign keys, required fields)
 * - Image accessibility
 * - Sample data spot checks
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../lib/db";
import {
  categories,
  products,
  productImages,
  customers,
  addresses,
  orders,
  orderItems,
  redirects,
} from "../lib/db/schema";
import { sql, isNull, eq } from "drizzle-orm";

interface ValidationResult {
  category: string;
  check: string;
  status: "pass" | "fail" | "warning";
  message: string;
  details?: unknown;
}

const results: ValidationResult[] = [];

function log(result: ValidationResult) {
  const icon = result.status === "pass" ? "✅" : result.status === "fail" ? "❌" : "⚠️";
  console.log(`${icon} [${result.category}] ${result.check}: ${result.message}`);
  results.push(result);
}

async function validateRecordCounts() {
  console.log("\n📊 Validating Record Counts...\n");

  const counts = {
    categories: await db.select({ count: sql<number>`count(*)` }).from(categories),
    products: await db.select({ count: sql<number>`count(*)` }).from(products),
    productImages: await db.select({ count: sql<number>`count(*)` }).from(productImages),
    customers: await db.select({ count: sql<number>`count(*)` }).from(customers),
    addresses: await db.select({ count: sql<number>`count(*)` }).from(addresses),
    orders: await db.select({ count: sql<number>`count(*)` }).from(orders),
    orderItems: await db.select({ count: sql<number>`count(*)` }).from(orderItems),
    redirects: await db.select({ count: sql<number>`count(*)` }).from(redirects),
  };

  for (const [table, result] of Object.entries(counts)) {
    const count = Number(result[0].count);
    log({
      category: "Counts",
      check: table,
      status: count > 0 ? "pass" : "warning",
      message: `${count} records`,
    });
  }

  return counts;
}

async function validateProductIntegrity() {
  console.log("\n🛍️ Validating Product Integrity...\n");

  // Check for products without images
  const productsWithoutImages = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .leftJoin(productImages, eq(products.id, productImages.productId))
    .where(isNull(productImages.id));

  log({
    category: "Products",
    check: "Products without images",
    status: productsWithoutImages.length === 0 ? "pass" : "warning",
    message:
      productsWithoutImages.length === 0
        ? "All products have at least one image"
        : `${productsWithoutImages.length} products have no images`,
    details: productsWithoutImages.slice(0, 5),
  });

  // Check for products without slugs
  const productsWithoutSlugs = await db
    .select({ id: products.id, name: products.name })
    .from(products)
    .where(sql`${products.slug} IS NULL OR ${products.slug} = ''`);

  log({
    category: "Products",
    check: "Products without slugs",
    status: productsWithoutSlugs.length === 0 ? "pass" : "fail",
    message:
      productsWithoutSlugs.length === 0
        ? "All products have slugs"
        : `${productsWithoutSlugs.length} products missing slugs`,
    details: productsWithoutSlugs.slice(0, 5),
  });

  // Check for products with zero or negative prices
  const invalidPriceProducts = await db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
    })
    .from(products)
    .where(sql`${products.price} <= 0`);

  log({
    category: "Products",
    check: "Products with invalid prices",
    status: invalidPriceProducts.length === 0 ? "pass" : "warning",
    message:
      invalidPriceProducts.length === 0
        ? "All products have valid prices"
        : `${invalidPriceProducts.length} products have zero or negative prices`,
    details: invalidPriceProducts.slice(0, 5),
  });
}

async function validateCustomerIntegrity() {
  console.log("\n👥 Validating Customer Integrity...\n");

  // Check for customers without emails
  const customersWithoutEmails = await db
    .select({ id: customers.id })
    .from(customers)
    .where(sql`${customers.email} IS NULL OR ${customers.email} = ''`);

  log({
    category: "Customers",
    check: "Customers without emails",
    status: customersWithoutEmails.length === 0 ? "pass" : "fail",
    message:
      customersWithoutEmails.length === 0
        ? "All customers have emails"
        : `${customersWithoutEmails.length} customers missing emails`,
  });

  // Check for duplicate emails
  const duplicateEmails = await db.all(sql`
    SELECT email, COUNT(*) as count
    FROM customers
    GROUP BY email
    HAVING COUNT(*) > 1
  `);

  log({
    category: "Customers",
    check: "Duplicate customer emails",
    status: duplicateEmails.length === 0 ? "pass" : "warning",
    message:
      duplicateEmails.length === 0
        ? "No duplicate emails"
        : `${duplicateEmails.length} duplicate email addresses found`,
    details: duplicateEmails.slice(0, 5),
  });

  // Check for orphaned addresses
  const orphanedAddresses = await db
    .select({ id: addresses.id })
    .from(addresses)
    .leftJoin(customers, eq(addresses.customerId, customers.id))
    .where(isNull(customers.id));

  log({
    category: "Customers",
    check: "Orphaned addresses",
    status: orphanedAddresses.length === 0 ? "pass" : "fail",
    message:
      orphanedAddresses.length === 0
        ? "All addresses linked to customers"
        : `${orphanedAddresses.length} orphaned addresses found`,
  });
}

async function validateOrderIntegrity() {
  console.log("\n📦 Validating Order Integrity...\n");

  // Check for orders without items
  const ordersWithoutItems = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .where(isNull(orderItems.id));

  log({
    category: "Orders",
    check: "Orders without items",
    status: ordersWithoutItems.length === 0 ? "pass" : "warning",
    message:
      ordersWithoutItems.length === 0
        ? "All orders have at least one item"
        : `${ordersWithoutItems.length} orders have no items`,
    details: ordersWithoutItems.slice(0, 5),
  });

  // Check for orders with invalid totals
  const ordersWithInvalidTotals = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber, total: orders.total })
    .from(orders)
    .where(sql`${orders.total} <= 0`);

  log({
    category: "Orders",
    check: "Orders with invalid totals",
    status: ordersWithInvalidTotals.length === 0 ? "pass" : "warning",
    message:
      ordersWithInvalidTotals.length === 0
        ? "All orders have valid totals"
        : `${ordersWithInvalidTotals.length} orders have zero or negative totals`,
    details: ordersWithInvalidTotals.slice(0, 5),
  });

  // Check order status distribution
  const statusDistribution = await db.all(sql`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
  `);

  log({
    category: "Orders",
    check: "Order status distribution",
    status: "pass",
    message: "Status breakdown",
    details: statusDistribution,
  });
}

async function validateImageAccessibility() {
  console.log("\n🖼️ Validating Image Accessibility...\n");

  // Get a sample of images to check
  const sampleImages = await db
    .select({ id: productImages.id, url: productImages.url })
    .from(productImages)
    .limit(10);

  if (sampleImages.length === 0) {
    log({
      category: "Images",
      check: "Image sample check",
      status: "warning",
      message: "No images to validate",
    });
    return;
  }

  let accessible = 0;
  let inaccessible = 0;
  const brokenUrls: string[] = [];

  for (const img of sampleImages) {
    try {
      const response = await fetch(img.url, { method: "HEAD" });
      if (response.ok) {
        accessible++;
      } else {
        inaccessible++;
        brokenUrls.push(img.url);
      }
    } catch {
      inaccessible++;
      brokenUrls.push(img.url);
    }
  }

  log({
    category: "Images",
    check: "Sample image accessibility",
    status: inaccessible === 0 ? "pass" : inaccessible < sampleImages.length / 2 ? "warning" : "fail",
    message: `${accessible}/${sampleImages.length} sample images accessible`,
    details: brokenUrls.length > 0 ? { brokenUrls } : undefined,
  });
}

async function validateRedirects() {
  console.log("\n🔀 Validating Redirects...\n");

  // Check for duplicate from paths
  const duplicateFromPaths = await db.all(sql`
    SELECT from_path, COUNT(*) as count
    FROM redirects
    GROUP BY from_path
    HAVING COUNT(*) > 1
  `);

  log({
    category: "Redirects",
    check: "Duplicate from paths",
    status: duplicateFromPaths.length === 0 ? "pass" : "fail",
    message:
      duplicateFromPaths.length === 0
        ? "No duplicate redirect sources"
        : `${duplicateFromPaths.length} duplicate from_path entries`,
    details: duplicateFromPaths,
  });

  // Check for circular redirects
  const allRedirects = await db.select().from(redirects);
  const fromPaths = new Set(allRedirects.map((r) => r.fromPath));
  const circularRedirects = allRedirects.filter((r) => fromPaths.has(r.toPath));

  log({
    category: "Redirects",
    check: "Circular redirects",
    status: circularRedirects.length === 0 ? "pass" : "warning",
    message:
      circularRedirects.length === 0
        ? "No circular redirects detected"
        : `${circularRedirects.length} potential circular redirects`,
    details: circularRedirects.slice(0, 5).map((r) => ({ from: r.fromPath, to: r.toPath })),
  });

  // Check redirect status codes
  const invalidStatusCodes = allRedirects.filter(
    (r) => r.statusCode !== 301 && r.statusCode !== 302
  );

  log({
    category: "Redirects",
    check: "Valid status codes",
    status: invalidStatusCodes.length === 0 ? "pass" : "fail",
    message:
      invalidStatusCodes.length === 0
        ? "All redirects use valid status codes (301/302)"
        : `${invalidStatusCodes.length} redirects have invalid status codes`,
    details: invalidStatusCodes.slice(0, 5),
  });
}

async function generateSummary() {
  console.log("\n" + "=".repeat(60));
  console.log("📋 VALIDATION SUMMARY");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter((r) => r.status === "pass").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const total = results.length;

  console.log(`Total Checks: ${total}`);
  console.log(`✅ Passed:    ${passed}`);
  console.log(`⚠️  Warnings:  ${warnings}`);
  console.log(`❌ Failed:    ${failed}`);
  console.log();

  if (failed > 0) {
    console.log("Failed checks:");
    results
      .filter((r) => r.status === "fail")
      .forEach((r) => {
        console.log(`  - [${r.category}] ${r.check}: ${r.message}`);
      });
    console.log();
  }

  if (warnings > 0) {
    console.log("Warnings:");
    results
      .filter((r) => r.status === "warning")
      .forEach((r) => {
        console.log(`  - [${r.category}] ${r.check}: ${r.message}`);
      });
    console.log();
  }

  const overallStatus = failed > 0 ? "FAILED" : warnings > 0 ? "PASSED WITH WARNINGS" : "PASSED";
  console.log(`Overall Status: ${overallStatus}`);

  return {
    total,
    passed,
    warnings,
    failed,
    status: overallStatus,
    results,
  };
}

async function main() {
  console.log("🔍 Starting Migration Validation...");
  console.log("=".repeat(60));

  try {
    await validateRecordCounts();
    await validateProductIntegrity();
    await validateCustomerIntegrity();
    await validateOrderIntegrity();
    await validateImageAccessibility();
    await validateRedirects();

    const summary = await generateSummary();
    process.exit(summary.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n❌ Validation failed with error:", error);
    process.exit(1);
  }
}

main();
