import { db } from "@/lib/db";
import { weightTypes } from "@/lib/db/schema";
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

export default async function NewProductPage() {
  const [categories, weightTypeList] = await Promise.all([
    getCategories(),
    getWeightTypes(),
  ]);

  return (
    <ProductForm
      categories={categories}
      weightTypes={weightTypeList}
      mode="create"
    />
  );
}
