import { db } from "@/lib/db";
import { weightTypes, productTags, productTagAssignments } from "@/lib/db/schema";
import { asc, count, eq } from "drizzle-orm";
import { TaxonomiesForm } from "./taxonomies-form";

async function getWeightTypes() {
  return db.query.weightTypes.findMany({
    orderBy: [asc(weightTypes.sortOrder), asc(weightTypes.name)],
  });
}

async function getTags() {
  const tags = await db.query.productTags.findMany({
    orderBy: [asc(productTags.name)],
  });

  // Get usage counts
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

  return tagsWithCounts;
}

export default async function TaxonomiesPage() {
  const [weights, tags] = await Promise.all([
    getWeightTypes(),
    getTags(),
  ]);

  return <TaxonomiesForm weightTypes={weights} tags={tags} />;
}
