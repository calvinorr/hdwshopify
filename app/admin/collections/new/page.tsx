import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { CollectionForm } from "../collection-form";

const MAX_FEATURED_COLLECTIONS = 6;

async function getProducts() {
  return db.query.products.findMany({
    orderBy: (products, { asc }) => [asc(products.name)],
    with: {
      images: {
        limit: 1,
        orderBy: (images, { asc }) => [asc(images.position)],
      },
    },
  });
}

async function getFeaturedCount() {
  const [{ featuredCount }] = await db
    .select({ featuredCount: count() })
    .from(categories)
    .where(eq(categories.featured, true));
  return featuredCount;
}

export default async function NewCollectionPage() {
  const [products, featuredCount] = await Promise.all([
    getProducts(),
    getFeaturedCount(),
  ]);

  return (
    <CollectionForm
      products={products}
      assignedProductIds={[]}
      mode="create"
      featuredCount={featuredCount}
      maxFeatured={MAX_FEATURED_COLLECTIONS}
    />
  );
}
