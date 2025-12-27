import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { weightTypes } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const types = await db.query.weightTypes.findMany({
      orderBy: [asc(weightTypes.sortOrder), asc(weightTypes.name)],
    });

    return NextResponse.json(types);
  } catch (error) {
    logError("weightTypes.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch weight types" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const { name, label, description, sortOrder, active } = body;

    if (!name || !label) {
      return NextResponse.json(
        { error: "Name and label are required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.query.weightTypes.findFirst({
      where: eq(weightTypes.name, name),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A weight type with this name already exists" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(weightTypes)
      .values({
        name,
        label,
        description: description || null,
        sortOrder: sortOrder ?? 0,
        active: active !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    logError("weightTypes.POST", error);
    return NextResponse.json(
      { error: "Failed to create weight type" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const { id, name, label, description, sortOrder, active } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const existing = await db.query.weightTypes.findFirst({
      where: eq(weightTypes.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Weight type not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(weightTypes)
      .set({
        ...(name !== undefined && { name }),
        ...(label !== undefined && { label }),
        ...(description !== undefined && { description }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(active !== undefined && { active }),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(weightTypes.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    logError("weightTypes.PUT", error);
    return NextResponse.json(
      { error: "Failed to update weight type" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    await db.delete(weightTypes).where(eq(weightTypes.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("weightTypes.DELETE", error);
    return NextResponse.json(
      { error: "Failed to delete weight type" },
      { status: 500 }
    );
  }
}
