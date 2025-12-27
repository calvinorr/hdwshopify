import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { discountCodes } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { updateDiscountSchema } from "@/lib/validations/discount";
import { logError } from "@/lib/logger";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let discountId: number | undefined;

  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    discountId = parsedId;

    const discount = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, parsedId),
    });

    if (!discount) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(discount);
  } catch (error) {
    logError("discounts.GET", error, { discountId });
    return NextResponse.json(
      { error: "Failed to fetch discount code" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let discountId: number | undefined;

  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    discountId = parsedId;

    const body = await request.json();

    // Validate request body with Zod
    const parseResult = updateDiscountSchema.safeParse(body);

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

    // Check if discount exists
    const existing = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, parsedId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // Check for duplicate code (excluding current discount)
    if (code) {
      const duplicate = await db.query.discountCodes.findFirst({
        where: and(
          eq(discountCodes.code, code),
          ne(discountCodes.id, parsedId)
        ),
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A discount code with this code already exists" },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(discountCodes)
      .set({
        ...(code !== undefined && { code }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value }),
        ...(minOrderValue !== undefined && { minOrderValue: minOrderValue || null }),
        ...(maxUses !== undefined && { maxUses: maxUses || null }),
        ...(startsAt !== undefined && { startsAt: startsAt || null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt || null }),
        ...(active !== undefined && { active }),
      })
      .where(eq(discountCodes.id, parsedId))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    logError("discounts.PATCH", error, { discountId });
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  let discountId: number | undefined;

  try {
    const { id } = await context.params;
    const parsedId = parseInt(id);

    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    discountId = parsedId;

    // Check if discount exists
    const existing = await db.query.discountCodes.findFirst({
      where: eq(discountCodes.id, parsedId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    await db.delete(discountCodes).where(eq(discountCodes.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("discounts.DELETE", error, { discountId });
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 }
    );
  }
}
