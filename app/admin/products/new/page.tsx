import { db } from "@/lib/db";
import { weightTypes, productTags } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { ProductForm } from "../product-form";

async function getCategories() {
  return db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
}

async function getWeightTypes() {
  return db.query.weightTypes.findMany({
    orderBy: [asc(weightTypes.sortOrder), asc(weightTypes.name)],
  });
}

async function getTags() {
  return db.query.productTags.findMany({
    orderBy: [asc(productTags.name)],
  });
}

export default async function NewProductPage() {
  const [categories, weightTypeList, tags] = await Promise.all([
    getCategories(),
    getWeightTypes(),
    getTags(),
  ]);

  return (
    <ProductForm
      categories={categories}
      weightTypes={weightTypeList}
      tags={tags}
      mode="create"
    />
  );
}
