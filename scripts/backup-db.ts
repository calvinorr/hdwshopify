/**
 * Database Backup Script
 *
 * Creates a JSON backup of all database tables.
 * Run with: npm run db:backup
 *
 * Output: backups/backup-{timestamp}.json
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
  carts,
  discountCodes,
  shippingZones,
  shippingRates,
  siteSettings,
  weightTypes,
  productTags,
  productTagAssignments,
  heroSlides,
  newsletterSubscribers,
  stockReservations,
} from "../lib/db/schema";
import * as fs from "fs";
import * as path from "path";

async function backup() {
  console.log("Starting database backup...\n");

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

  // Ensure backups directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    // Export all tables
    const data = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      tables: {
        categories: await db.select().from(categories),
        products: await db.select().from(products),
        productVariants: await db.select().from(productVariants),
        productImages: await db.select().from(productImages),
        customers: await db.select().from(customers),
        addresses: await db.select().from(addresses),
        orders: await db.select().from(orders),
        orderItems: await db.select().from(orderItems),
        orderEvents: await db.select().from(orderEvents),
        carts: await db.select().from(carts),
        discountCodes: await db.select().from(discountCodes),
        shippingZones: await db.select().from(shippingZones),
        shippingRates: await db.select().from(shippingRates),
        siteSettings: await db.select().from(siteSettings),
        weightTypes: await db.select().from(weightTypes),
        productTags: await db.select().from(productTags),
        productTagAssignments: await db.select().from(productTagAssignments),
        heroSlides: await db.select().from(heroSlides),
        newsletterSubscribers: await db.select().from(newsletterSubscribers),
        stockReservations: await db.select().from(stockReservations),
      },
    };

    // Calculate stats
    const stats = Object.entries(data.tables).map(([table, rows]) => ({
      table,
      count: (rows as unknown[]).length,
    }));

    console.log("Exported tables:");
    stats.forEach(({ table, count }) => {
      console.log(`  ${table}: ${count} rows`);
    });

    // Write to file
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

    const fileSizeKB = (fs.statSync(backupFile).size / 1024).toFixed(2);
    console.log(`\nBackup saved to: ${backupFile}`);
    console.log(`File size: ${fileSizeKB} KB`);
    console.log("\nBackup complete!");
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  }
}

backup();
