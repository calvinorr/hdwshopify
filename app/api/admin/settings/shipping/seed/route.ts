import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shippingZones, shippingRates, siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { SHOPIFY_SHIPPING_CONFIG, EU_COUNTRIES } from "@/lib/data/countries";

// Shipping zones matching the exact Shopify configuration
const defaultZones = SHOPIFY_SHIPPING_CONFIG.zones;

export async function POST() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    // Check if zones already exist
    const existingZones = await db.query.shippingZones.findMany();

    if (existingZones.length > 0) {
      return NextResponse.json(
        { error: "Shipping zones already exist. Delete existing zones first to reseed." },
        { status: 400 }
      );
    }

    // Insert zones and rates
    for (const zone of defaultZones) {
      const [insertedZone] = await db
        .insert(shippingZones)
        .values({
          name: zone.name,
          countries: JSON.stringify(zone.countries),
          createdAt: new Date().toISOString(),
        })
        .returning({ id: shippingZones.id });

      // Insert rates for this zone
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
    }

    // Set free shipping defaults
    await upsertSetting("free_shipping_enabled", "true");
    await upsertSetting("free_shipping_threshold", "50");

    return NextResponse.json({
      success: true,
      message: `Seeded ${defaultZones.length} shipping zones with rates`,
      zones: defaultZones.map((z) => z.name),
    });
  } catch (error) {
    console.error("Error seeding shipping zones:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed shipping zones" },
      { status: 500 }
    );
  }
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
