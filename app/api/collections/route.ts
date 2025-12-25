import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Fetch all categories with their parent/children hierarchy
    const allCategories = await db.query.categories.findMany({
      orderBy: (categories, { asc }) => [asc(categories.position)],
      with: {
        parent: true,
        children: {
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
