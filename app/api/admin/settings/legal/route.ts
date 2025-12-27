import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

// Policy keys we support
const POLICY_KEYS = [
  "policy_terms",
  "policy_privacy",
  "policy_returns",
  "policy_shipping",
] as const;

type PolicyKey = (typeof POLICY_KEYS)[number];

interface PolicyData {
  body: string;
  updatedAt: string;
}

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const settings = await db.query.siteSettings.findMany({
      where: (siteSettings, { like }) => like(siteSettings.key, "policy_%"),
    });

    const policies: Record<string, PolicyData> = {};

    settings.forEach((s) => {
      try {
        policies[s.key] = JSON.parse(s.value);
      } catch {
        policies[s.key] = { body: s.value, updatedAt: s.updatedAt || "" };
      }
    });

    return NextResponse.json({ policies });
  } catch (error) {
    logError("legal.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch policies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const { policies } = body as { policies: Record<PolicyKey, string> };

    const now = new Date().toISOString();

    for (const key of POLICY_KEYS) {
      if (policies[key] !== undefined) {
        const policyData: PolicyData = {
          body: policies[key],
          updatedAt: now,
        };
        await upsertSetting(key, JSON.stringify(policyData));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("legal.POST", error);
    return NextResponse.json(
      { error: "Failed to save policies" },
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
