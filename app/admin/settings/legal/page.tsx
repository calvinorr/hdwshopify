import { db } from "@/lib/db";
import { LegalSettingsForm } from "./legal-form";

interface PolicyData {
  body: string;
  updatedAt: string;
}

export default async function LegalSettingsPage() {
  const settings = await db.query.siteSettings.findMany({
    where: (siteSettings, { like }) => like(siteSettings.key, "policy_%"),
  });

  const policies: Record<string, PolicyData> = {};

  settings.forEach((s) => {
    try {
      policies[s.key] = JSON.parse(s.value);
    } catch {
      policies[s.key] = { body: s.value, updatedAt: s.updatedAt || "" };
    }
  });

  return <LegalSettingsForm policies={policies} />;
}
