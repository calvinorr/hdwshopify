import { db } from "@/lib/db";
import { AboutSettingsForm } from "./about-form";

export default async function AboutSettingsPage() {
  // Fetch all site settings related to the about page
  const settings = await db.query.siteSettings.findMany();

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    if (s.key.startsWith("about_")) {
      settingsMap[s.key] = s.value;
    }
  });

  return <AboutSettingsForm settings={settingsMap} />;
}
