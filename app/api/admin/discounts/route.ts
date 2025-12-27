import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { createDiscountSchema } from "@/lib/validations/discount";
import { logError } from "@/lib/logger";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const codes = await db.query.discountCodes.findMany({
      orderBy: [desc(discountCodes.createdAt)],
    });

    return NextResponse.json(codes);
  } catch (error) {
    logError("discounts.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch discount codes" },
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
    const parseResult = createDiscountSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      code,
      type,
      value,
      minOrderValue,
      maxUses,
      startsAt,
      expiresAt,
      active,
    } = parseResult.data;

    // Check for duplicate code
    const existing = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.code, code),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A discount code with this code already exists" },
        { status: 400 }
      );
    }

    const [newDiscount] = await db
      .insert(discountCodes)
      .values({
        code,
        type,
        value,
        minOrderValue: minOrderValue || null,
        maxUses: maxUses || null,
        usesCount: 0,
        startsAt: startsAt || null,
        expiresAt: expiresAt || null,
        active,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    logError("discounts.POST", error);
    return NextResponse.json(
      { error: "Failed to create discount code" },
      { status: 500 }
    );
  }
}
