import { NextResponse } from "next/server";
import { db, redirects } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { eq } from "drizzle-orm";
import { logError } from "@/lib/logger";

// GET - Get a single redirect
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { id } = await params;
    const redirectId = parseInt(id, 10);

    const redirect = await db.query.redirects.findFirst({
      where: eq(redirects.id, redirectId),
    });

    if (!redirect) {
      return NextResponse.json(
        { error: "Redirect not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ redirect });
  } catch (error) {
    logError("redirects.[id].GET", error);
    return NextResponse.json(
      { error: "Failed to fetch redirect" },
      { status: 500 }
    );
  }
}

// PATCH - Update a redirect
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { id } = await params;
    const redirectId = parseInt(id, 10);
    const body = await request.json();
    const { fromPath, toPath, statusCode, notes, active } = body;

    // Check if redirect exists
    const existing = await db.query.redirects.findFirst({
      where: eq(redirects.id, redirectId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Redirect not found" },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (fromPath !== undefined) {
      updates.fromPath = fromPath.startsWith("/") ? fromPath : `/${fromPath}`;
    }
    if (toPath !== undefined) updates.toPath = toPath;
    if (statusCode !== undefined) updates.statusCode = statusCode;
    if (notes !== undefined) updates.notes = notes;
    if (active !== undefined) updates.active = active;

    const [updated] = await db
      .update(redirects)
      .set(updates)
      .where(eq(redirects.id, redirectId))
      .returning();

    return NextResponse.json({ redirect: updated });
  } catch (error) {
    logError("redirects.[id].PATCH", error);
    return NextResponse.json(
      { error: "Failed to update redirect" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a single redirect
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { id } = await params;
    const redirectId = parseInt(id, 10);

    const existing = await db.query.redirects.findFirst({
      where: eq(redirects.id, redirectId),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Redirect not found" },
        { status: 404 }
      );
    }

    await db.delete(redirects).where(eq(redirects.id, redirectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("redirects.[id].DELETE", error);
    return NextResponse.json(
      { error: "Failed to delete redirect" },
      { status: 500 }
    );
  }
}
