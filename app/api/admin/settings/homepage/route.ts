import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings, heroSlides, products } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET() {
  try {
    const [settings, slides] = await Promise.all([
      db.query.siteSettings.findMany(),
      db.query.heroSlides.findMany({
        orderBy: (heroSlides, { asc }) => [asc(heroSlides.position)],
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ settings: settingsMap, heroSlides: slides });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { announcementText, announcementEnabled, heroSlides: slides, featuredProductIds } = body;

    // Update announcement settings
    await upsertSetting("announcement_text", announcementText || "");
    await upsertSetting("announcement_enabled", announcementEnabled ? "true" : "false");

    // Update hero slides - delete all and recreate
    await db.delete(heroSlides);

    if (slides && slides.length > 0) {
      await db.insert(heroSlides).values(
        slides.map((slide: any, index: number) => ({
          title: slide.title || null,
          subtitle: slide.subtitle || null,
          buttonText: slide.buttonText || null,
          buttonLink: slide.buttonLink || null,
          imageUrl: slide.imageUrl,
          imageAlt: slide.imageAlt || null,
          position: index,
          active: slide.active !== false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
      );
    }

    // Update featured products
    // First, unflag all featured products
    await db
      .update(products)
      .set({ featured: false, updatedAt: new Date().toISOString() });

    // Then flag selected products as featured
    if (featuredProductIds && featuredProductIds.length > 0) {
      await db
        .update(products)
        .set({ featured: true, updatedAt: new Date().toISOString() })
        .where(inArray(products.id, featuredProductIds));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save settings" },
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
