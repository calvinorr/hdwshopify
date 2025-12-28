import { NextResponse } from "next/server";
import { db, products } from "@/lib/db";
import { eq, inArray, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slugs } = body as { slugs: string[] };

    if (!Array.isArray(slugs) || slugs.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Limit to 10 slugs max for safety
    const limitedSlugs = slugs.slice(0, 10);

    const recentProducts = await db.query.products.findMany({
      where: and(
        inArray(products.slug, limitedSlugs),
        eq(products.status, "active")
      ),
      with: {
        variants: {
          orderBy: (variants, { asc }) => [asc(variants.position)],
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
      },
    });

    return NextResponse.json({ products: recentProducts });
  } catch (error) {
    console.error("Error fetching recently viewed products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
