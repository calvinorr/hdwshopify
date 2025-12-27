import { db } from "@/lib/db";
import { shippingZones, shippingRates, siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ShippingSettingsForm } from "./shipping-form";

async function getShippingZones() {
  return db.query.shippingZones.findMany({
    with: {
      rates: {
        orderBy: (rates, { asc }) => [asc(rates.minWeightGrams)],
      },
    },
  });
}

async function getSettings() {
  const settings = await db.query.siteSettings.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
}

export default async function ShippingSettingsPage() {
  const [zones, settings] = await Promise.all([
    getShippingZones(),
    getSettings(),
  ]);

  return (
    <ShippingSettingsForm
      zones={zones}
      freeShippingThreshold={settings.free_shipping_threshold || "50"}
      freeShippingEnabled={settings.free_shipping_enabled !== "false"}
    />
  );
}
