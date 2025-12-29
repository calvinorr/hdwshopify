import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../lib/db";
import { shippingZones, shippingRates, siteSettings } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { SHOPIFY_SHIPPING_CONFIG } from "../lib/data/countries";

async function seedShipping() {
  console.log("🚚 Seeding shipping zones and rates...\n");

  // Check if zones already exist
  const existingZones = await db.query.shippingZones.findMany();

  if (existingZones.length > 0) {
    console.log(`Found ${existingZones.length} existing zones.`);
    console.log("Clearing existing shipping data...\n");

    // Delete rates first (foreign key constraint)
    await db.delete(shippingRates);
    await db.delete(shippingZones);
  }

  // Insert zones and rates
  const zones = SHOPIFY_SHIPPING_CONFIG.zones;

  for (const zone of zones) {
    console.log(`Creating zone: ${zone.name}`);
    console.log(`  Countries: ${zone.countries.join(", ")}`);

    const [insertedZone] = await db
      .insert(shippingZones)
      .values({
        name: zone.name,
        countries: JSON.stringify(zone.countries),
        createdAt: new Date().toISOString(),
      })
      .returning({ id: shippingZones.id });

    // Insert rates for this zone
    for (const rate of zone.rates) {
      console.log(`    Rate: ${rate.name} - £${rate.price.toFixed(2)} (${rate.minWeightGrams}-${rate.maxWeightGrams}g)`);
    }

    await db.insert(shippingRates).values(
      zone.rates.map((rate) => ({
        zoneId: insertedZone.id,
        name: rate.name,
        minWeightGrams: rate.minWeightGrams,
        maxWeightGrams: rate.maxWeightGrams,
        price: rate.price,
        estimatedDays: rate.estimatedDays,
        tracked: rate.tracked,
        createdAt: new Date().toISOString(),
      }))
    );

    console.log("");
  }

  // Set free shipping defaults
  await upsertSetting("free_shipping_enabled", "true");
  await upsertSetting("free_shipping_threshold", "50");

  console.log("✅ Shipping seeding complete!");
  console.log(`   - ${zones.length} zones created`);
  console.log(`   - ${zones.reduce((acc, z) => acc + z.rates.length, 0)} rates created`);
  console.log(`   - Free shipping: enabled over £50`);
}

async function upsertSetting(key: string, value: string) {
  const existing = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, key),
  });

  if (existing) {
    await db
      .update(siteSettings)
      .set({ value, updatedAt: new Date().toISOString() })
      .where(eq(siteSettings.key, key));
  } else {
    await db.insert(siteSettings).values({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }
}

seedShipping()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
