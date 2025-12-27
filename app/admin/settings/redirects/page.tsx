import { db } from "@/lib/db";
import { redirects } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { RedirectsForm } from "./redirects-form";

async function getRedirects() {
  return db
    .select()
    .from(redirects)
    .orderBy(desc(redirects.hits), desc(redirects.createdAt));
}

export default async function RedirectsPage() {
  const allRedirects = await getRedirects();

  return <RedirectsForm redirects={allRedirects} />;
}
