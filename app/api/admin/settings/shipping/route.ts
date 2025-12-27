import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shippingZones, shippingRates, siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { shippingSettingsSchema } from "@/lib/validations/shipping";
import { logError } from "@/lib/logger";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const [zones, settings] = await Promise.all([
      db.query.shippingZones.findMany({
        with: {
          rates: {
            orderBy: (rates, { asc }) => [asc(rates.minWeightGrams)],
          },
        },
      }),
      db.query.siteSettings.findMany(),
    ]);

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      zones,
      freeShippingEnabled: settingsMap.free_shipping_enabled !== "false",
      freeShippingThreshold: settingsMap.free_shipping_threshold || "50",
    });
  } catch (error) {
    logError("shipping.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();

    // Validate request body with Zod
    const parseResult = shippingSettingsSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { freeShippingEnabled, freeShippingThreshold, zones: newZones } = parseResult.data;

    // Use transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Update free shipping settings
      await upsertSetting(tx, "free_shipping_enabled", freeShippingEnabled ? "true" : "false");
      await upsertSetting(tx, "free_shipping_threshold", String(freeShippingThreshold));

      // Get existing zones to handle updates vs inserts
      const existingZones = await tx.query.shippingZones.findMany({
        with: { rates: true },
      });
      const existingZoneIds = existingZones.map((z) => z.id);
      const newZoneIds: number[] = [];

      // Process each zone
      for (const zone of newZones) {
        let zoneId: number;

        if (zone.id && existingZoneIds.includes(zone.id)) {
          // Update existing zone
          zoneId = zone.id;
          await tx
            .update(shippingZones)
            .set({
              name: zone.name,
              countries: zone.countries,
            })
            .where(eq(shippingZones.id, zone.id));

          // Delete existing rates for this zone (we'll recreate them)
          await tx.delete(shippingRates).where(eq(shippingRates.zoneId, zone.id));
        } else {
          // Insert new zone
          const result = await tx
            .insert(shippingZones)
            .values({
              name: zone.name,
              countries: zone.countries,
              createdAt: new Date().toISOString(),
            })
            .returning({ id: shippingZones.id });

          zoneId = result[0].id;
        }

        newZoneIds.push(zoneId);

        // Insert rates for this zone
        if (zone.rates && zone.rates.length > 0) {
          await tx.insert(shippingRates).values(
            zone.rates.map((rate) => ({
              zoneId,
              name: rate.name,
              minWeightGrams: rate.minWeightGrams,
              maxWeightGrams: rate.maxWeightGrams || null,
              price: rate.price,
              estimatedDays: rate.estimatedDays || null,
              tracked: rate.tracked,
              createdAt: new Date().toISOString(),
            }))
          );
        }
      }

      // Delete zones that are no longer in the list
      for (const existingId of existingZoneIds) {
        if (!newZoneIds.includes(existingId)) {
          await tx.delete(shippingZones).where(eq(shippingZones.id, existingId));
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("shipping.POST", error);
    return NextResponse.json(
      { error: "Failed to save shipping settings" },
      { status: 500 }
    );
  }
}

async function upsertSetting(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  key: string,
  value: string
) {
  const existing = await tx.query.siteSettings.findFirst({
    where: eq(siteSettings.key, key),
  });

  if (existing) {
    await tx
      .update(siteSettings)
      .set({ value, updatedAt: new Date().toISOString() })
      .where(eq(siteSettings.key, key));
  } else {
    await tx.insert(siteSettings).values({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }
}
