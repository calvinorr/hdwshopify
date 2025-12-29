import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "../lib/db";
import { weightTypes } from "../lib/db/schema";

const WEIGHT_TYPES = [
  { name: "Laceweight", label: "Laceweight", description: "Very fine yarn, great for delicate shawls", sortOrder: 1 },
  { name: "2ply", label: "2ply", description: "Fine yarn, similar to laceweight", sortOrder: 2 },
  { name: "4ply", label: "4ply / Fingering", description: "Light yarn, popular for socks and lightweight garments", sortOrder: 3 },
  { name: "Sport", label: "Sport", description: "Between fingering and DK weight", sortOrder: 4 },
  { name: "DK", label: "DK (Double Knitting)", description: "Versatile medium weight, great for sweaters", sortOrder: 5 },
  { name: "Aran", label: "Aran / Worsted", description: "Medium-heavy weight, warm and quick to knit", sortOrder: 6 },
  { name: "Chunky", label: "Chunky / Bulky", description: "Heavy weight, very quick projects", sortOrder: 7 },
  { name: "Super Chunky", label: "Super Chunky", description: "Very heavy, arm-knitting weight", sortOrder: 8 },
];

async function seedWeightTypes() {
  console.log("🧶 Seeding yarn weight types...\n");

  // Check existing
  const existing = await db.query.weightTypes.findMany();

  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing weight types. Skipping seed.`);
    console.log("Existing types:", existing.map(t => t.name).join(", "));
    return;
  }

  // Insert weight types
  for (const wt of WEIGHT_TYPES) {
    console.log(`  Adding: ${wt.label}`);
    await db.insert(weightTypes).values({
      name: wt.name,
      label: wt.label,
      description: wt.description,
      sortOrder: wt.sortOrder,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  console.log(`\n✅ Added ${WEIGHT_TYPES.length} weight types.`);
}

seedWeightTypes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding weight types:", err);
    process.exit(1);
  });
