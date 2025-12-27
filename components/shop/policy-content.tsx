import { db } from "@/lib/db";
import { siteSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import DOMPurify from "isomorphic-dompurify";

interface PolicyContentProps {
  policyKey: string;
  fallbackContent: React.ReactNode;
}

interface PolicyData {
  body: string;
  updatedAt: string;
}

export async function PolicyContent({
  policyKey,
  fallbackContent,
}: PolicyContentProps) {
  const setting = await db.query.siteSettings.findFirst({
    where: eq(siteSettings.key, policyKey),
  });

  if (!setting) {
    return <>{fallbackContent}</>;
  }

  try {
    const policy: PolicyData = JSON.parse(setting.value);
    const lastUpdated = new Date(policy.updatedAt).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="policy-content">
        <p className="text-muted-foreground mb-8">Last updated: {lastUpdated}</p>
        <div
          className="prose prose-stone max-w-none font-body
            prose-headings:font-heading prose-headings:font-medium prose-headings:text-foreground
            prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
            prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-muted-foreground prose-p:mb-4
            prose-ul:text-muted-foreground prose-ul:my-4 prose-ul:pl-6
            prose-li:my-1
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(policy.body) }}
        />
      </div>
    );
  } catch {
    return <>{fallbackContent}</>;
  }
}
