import { db } from "@/lib/db";
import { siteSettings, heroSlides, products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { HomepageSettingsForm } from "./homepage-form";

async function getSettings() {
  const settings = await db.query.siteSettings.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
}

async function getHeroSlides() {
  return db.query.heroSlides.findMany({
    orderBy: [heroSlides.position],
  });
}

async function getProducts() {
  return db.query.products.findMany({
    where: eq(products.status, "active"),
    orderBy: [products.name],
    with: {
      images: {
        limit: 1,
        orderBy: (images, { asc }) => [asc(images.position)],
      },
    },
  });
}

async function getFeaturedProducts() {
  return db.query.products.findMany({
    where: eq(products.featured, true),
    with: {
      images: {
        limit: 1,
      },
    },
  });
}

export default async function HomepageSettingsPage() {
  const [settings, slides, allProducts, featuredProducts] = await Promise.all([
    getSettings(),
    getHeroSlides(),
    getProducts(),
    getFeaturedProducts(),
  ]);

  return (
    <HomepageSettingsForm
      settings={settings}
      heroSlides={slides}
      products={allProducts}
      featuredProductIds={featuredProducts.map((p) => p.id)}
    />
  );
}
