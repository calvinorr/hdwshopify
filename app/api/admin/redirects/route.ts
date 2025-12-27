import { NextResponse } from "next/server";
import { db, redirects } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/admin";
import { eq, desc, sql } from "drizzle-orm";
import { logError } from "@/lib/logger";

// GET - List all redirects
export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const allRedirects = await db
      .select()
      .from(redirects)
      .orderBy(desc(redirects.hits), desc(redirects.createdAt));

    return NextResponse.json({ redirects: allRedirects });
  } catch (error) {
    logError("redirects.GET", error);
    return NextResponse.json(
      { error: "Failed to fetch redirects" },
      { status: 500 }
    );
  }
}

// POST - Create a new redirect
export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    const body = await request.json();
    const { fromPath, toPath, statusCode, notes } = body;

    // Validate required fields
    if (!fromPath || !toPath) {
      return NextResponse.json(
        { error: "fromPath and toPath are required" },
        { status: 400 }
      );
    }

    // Normalize fromPath (ensure it starts with /)
    const normalizedFromPath = fromPath.startsWith("/") ? fromPath : `/${fromPath}`;

    // Check if redirect already exists
    const existing = await db.query.redirects.findFirst({
      where: eq(redirects.fromPath, normalizedFromPath),
    });

    if (existing) {
      return NextResponse.json(
        { error: "A redirect for this path already exists" },
        { status: 409 }
      );
    }

    const [newRedirect] = await db
      .insert(redirects)
      .values({
        fromPath: normalizedFromPath,
        toPath,
        statusCode: statusCode || 301,
        notes,
        active: true,
        hits: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json({ redirect: newRedirect }, { status: 201 });
  } catch (error) {
    logError("redirects.POST", error);
    return NextResponse.json(
      { error: "Failed to create redirect" },
      { status: 500 }
    );
  }
}

// DELETE - Delete all redirects (bulk clear)
export async function DELETE() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) return authResult.error;

  try {
    await db.delete(redirects);
    await db.run(sql`DELETE FROM sqlite_sequence WHERE name='redirects'`);

    return NextResponse.json({ success: true, message: "All redirects cleared" });
  } catch (error) {
    logError("redirects.DELETE", error);
    return NextResponse.json(
      { error: "Failed to clear redirects" },
      { status: 500 }
    );
  }
}
