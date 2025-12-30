/**
 * Import customers from Shopify CSV export
 * Run with: DATABASE_URL=... DATABASE_AUTH_TOKEN=... npx tsx scripts/import-customers-csv.ts
 */

import { db } from "../lib/db";
import { customers, addresses } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

interface CSVCustomer {
  "Customer ID": string;
  "First Name": string;
  "Last Name": string;
  Email: string;
  "Accepts Email Marketing": string;
  "Default Address Company": string;
  "Default Address Address1": string;
  "Default Address Address2": string;
  "Default Address City": string;
  "Default Address Province Code": string;
  "Default Address Country Code": string;
  "Default Address Zip": string;
  "Default Address Phone": string;
  Phone: string;
  "Accepts SMS Marketing": string;
  "Total Spent": string;
  "Total Orders": string;
  Note: string;
  "Tax Exempt": string;
  Tags: string;
}

function parseCSV(content: string): CSVCustomer[] {
  const lines = content.split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const results: CSVCustomer[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV with quoted fields containing commas
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    results.push(row as unknown as CSVCustomer);
  }

  return results;
}

async function importCustomers() {
  console.log("🚀 Starting customer import from CSV...\n");

  const csvPath = path.join(process.cwd(), "docs", "customers_export.csv");

  if (!fs.existsSync(csvPath)) {
    console.error("❌ CSV file not found:", csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, "utf-8");
  const csvCustomers = parseCSV(content);

  console.log(`📊 Found ${csvCustomers.length} customers in CSV\n`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let addressesImported = 0;
  const errors: string[] = [];

  for (const csvCustomer of csvCustomers) {
    try {
      const email = csvCustomer.Email?.toLowerCase().trim();

      if (!email) {
        skipped++;
        continue;
      }

      // Check if customer already exists
      const existing = await db.query.customers.findFirst({
        where: eq(customers.email, email),
      });

      const acceptsMarketing =
        csvCustomer["Accepts Email Marketing"]?.toLowerCase() === "yes";

      if (existing) {
        // Update existing customer
        await db
          .update(customers)
          .set({
            firstName: csvCustomer["First Name"] || existing.firstName,
            lastName: csvCustomer["Last Name"] || existing.lastName,
            phone: csvCustomer.Phone || existing.phone,
            acceptsMarketing,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(customers.id, existing.id));
        updated++;
      } else {
        // Insert new customer
        const [inserted] = await db
          .insert(customers)
          .values({
            email,
            firstName: csvCustomer["First Name"] || null,
            lastName: csvCustomer["Last Name"] || null,
            phone: csvCustomer.Phone || null,
            acceptsMarketing,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning({ id: customers.id });

        imported++;

        // Import address if present
        if (
          csvCustomer["Default Address Address1"] &&
          csvCustomer["Default Address City"] &&
          csvCustomer["Default Address Country Code"]
        ) {
          await db.insert(addresses).values({
            customerId: inserted.id,
            type: "shipping",
            firstName:
              csvCustomer["First Name"] || "",
            lastName:
              csvCustomer["Last Name"] || "",
            company: csvCustomer["Default Address Company"] || null,
            line1: csvCustomer["Default Address Address1"],
            line2: csvCustomer["Default Address Address2"] || null,
            city: csvCustomer["Default Address City"],
            state: csvCustomer["Default Address Province Code"] || null,
            postalCode: csvCustomer["Default Address Zip"] || "",
            country: csvCustomer["Default Address Country Code"],
            phone: csvCustomer["Default Address Phone"] || null,
            isDefault: true,
            createdAt: new Date().toISOString(),
          });
          addressesImported++;
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${csvCustomer.Email}: ${msg}`);
    }
  }

  console.log("✅ Import complete!\n");
  console.log(`   New customers: ${imported}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped (no email): ${skipped}`);
  console.log(`   Addresses imported: ${addressesImported}`);

  if (errors.length > 0) {
    console.log(`\n⚠️  ${errors.length} errors:`);
    errors.slice(0, 10).forEach((e) => console.log(`   - ${e}`));
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more`);
    }
  }

  process.exit(0);
}

importCustomers().catch(console.error);
