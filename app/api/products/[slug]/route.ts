import { NextRequest, NextResponse } from "next/server";
import { db, products } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.status, "active")),
      with: {
        variants: {
          orderBy: (variants, { asc }) => [asc(variants.position)],
          with: {
            images: {
              orderBy: (images, { asc }) => [asc(images.position)],
            },
          },
        },
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
