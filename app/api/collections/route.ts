import { NextResponse } from "next/server";
import { db, categories } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    // Fetch only active categories with their parent/children hierarchy
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.status, "active"),
      orderBy: (categories, { asc }) => [asc(categories.position)],
      with: {
        parent: true,
        children: {
          where: eq(categories.status, "active"),
          orderBy: (categories, { asc }) => [asc(categories.position)],
        },
      },
    });

    // Build hierarchical structure - only top-level categories with nested children
    const topLevelCategories = allCategories.filter((cat) => !cat.parentId);

    return NextResponse.json({ collections: topLevelCategories });
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json(
      { error: "Failed to fetch collections" },
      { status: 500 }
    );
  }
}
