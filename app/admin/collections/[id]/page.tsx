import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { eq, and, ne, count } from "drizzle-orm";
import { notFound } from "next/navigation";
import { CollectionForm } from "../collection-form";

const MAX_FEATURED_COLLECTIONS = 6;

interface Props {
  params: Promise<{ id: string }>;
}

async function getCollection(id: number) {
  return db.query.categories.findFirst({
    where: eq(categories.id, id),
  });
}

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

async function getAssignedProductIds(collectionId: number) {
  const assigned = await db.query.products.findMany({
    where: eq(products.categoryId, collectionId),
    columns: { id: true },
  });
  return assigned.map((p) => p.id);
}

async function getFeaturedCount(excludeId: number) {
  const [{ featuredCount }] = await db
    .select({ featuredCount: count() })
    .from(categories)
    .where(and(eq(categories.featured, true), ne(categories.id, excludeId)));
  return featuredCount;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const collectionId = parseInt(id, 10);

  if (isNaN(collectionId)) {
    notFound();
  }

  const [collection, allProducts, assignedProductIds, featuredCount] = await Promise.all([
    getCollection(collectionId),
    getProducts(),
    getAssignedProductIds(collectionId),
    getFeaturedCount(collectionId),
  ]);

  if (!collection) {
    notFound();
  }

  return (
    <CollectionForm
      collection={collection}
      products={allProducts}
      assignedProductIds={assignedProductIds}
      mode="edit"
      featuredCount={featuredCount}
      maxFeatured={MAX_FEATURED_COLLECTIONS}
    />
  );
}
