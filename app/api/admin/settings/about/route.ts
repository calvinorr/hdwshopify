import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

// About page setting keys
const ABOUT_KEYS = [
  "about_hero_title",
  "about_hero_description",
  "about_story_heading",
  "about_story_paragraph1",
  "about_story_paragraph2",
  "about_story_paragraph3",
  "about_story_image",
  "about_value1_title",
  "about_value1_description",
  "about_value1_icon",
  "about_value2_title",
  "about_value2_description",
  "about_value2_icon",
  "about_value3_title",
  "about_value3_description",
  "about_value3_icon",
];

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const settings = await db.query.siteSettings.findMany();

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      if (ABOUT_KEYS.includes(s.key)) {
        settingsMap[s.key] = s.value;
      }
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    logError("about.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch about settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();

    // Update each about setting
    for (const key of ABOUT_KEYS) {
      if (key in body) {
        await upsertSetting(key, body[key] || "");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("about.POST", error);
    return NextResponse.json(
      { error: "Failed to save about settings" },
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
