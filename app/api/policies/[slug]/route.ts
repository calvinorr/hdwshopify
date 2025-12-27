import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Map public slugs to internal policy keys
const SLUG_TO_KEY: Record<string, string> = {
  terms: "policy_terms",
  privacy: "policy_privacy",
  returns: "policy_returns",
  shipping: "policy_shipping",
};

interface PolicyData {
  body: string;
  updatedAt: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const key = SLUG_TO_KEY[slug];

    if (!key) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const setting = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.key, key),
    });

    if (!setting) {
      return NextResponse.json({
        policy: null,
        message: "Policy not configured yet",
      });
    }

    try {
      const policy: PolicyData = JSON.parse(setting.value);
      return NextResponse.json({ policy });
    } catch {
      return NextResponse.json({
        policy: { body: setting.value, updatedAt: setting.updatedAt },
      });
    }
  } catch (error) {
    console.error("Error fetching policy:", error);
    return NextResponse.json(
      { error: "Failed to fetch policy" },
      { status: 500 }
    );
  }
}
