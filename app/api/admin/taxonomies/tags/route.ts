import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { productTags, productTagAssignments } from "@/lib/db/schema";
import { eq, asc, count } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { logError } from "@/lib/logger";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const tags = await db.query.productTags.findMany({
      orderBy: [asc(productTags.name)],
    });

    // Get usage counts for each tag
    const tagsWithCounts = await Promise.all(
      tags.map(async (tag) => {
        const [result] = await db
          .select({ count: count() })
          .from(productTagAssignments)
          .where(eq(productTagAssignments.tagId, tag.id));

        return {
          ...tag,
          productCount: result?.count || 0,
        };
      })
    );

    return NextResponse.json(tagsWithCounts);
  } catch (error) {
    logError("productTags.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for duplicate
    const existing = await db.query.productTags.findFirst({
      where: eq(productTags.slug, slug),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(productTags)
      .values({
        name,
        slug,
        color: color || "#6b7280",
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ ...created, productCount: 0 }, { status: 201 });
  } catch (error) {
    logError("productTags.POST", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const existing = await db.query.productTags.findFirst({
      where: eq(productTags.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    // Update slug if name changed
    const updateData: Record<string, unknown> = {};

    if (name !== undefined && name !== existing.name) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existing);
    }

    const [updated] = await db
      .update(productTags)
      .set(updateData)
      .where(eq(productTags.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    logError("productTags.PUT", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
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

    // Delete assignments first (cascade should handle this, but be explicit)
    await db
      .delete(productTagAssignments)
      .where(eq(productTagAssignments.tagId, parsedId));

    // Then delete the tag
    await db.delete(productTags).where(eq(productTags.id, parsedId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("productTags.DELETE", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
