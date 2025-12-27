import { Metadata } from "next";
import Image from "next/image";
import { Leaf, Heart, MapPin, Sparkles, Award, Globe, LucideIcon } from "lucide-react";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Herbarium Dyeworks - small batch, naturally dyed yarn from Northern Ireland using traditional botanical dyeing techniques.",
};

// Map icon names to components
const ICON_MAP: Record<string, LucideIcon> = {
  Leaf,
  Heart,
  MapPin,
  Sparkles,
  Award,
  Globe,
};

// Default values if not set in database
const DEFAULTS = {
  about_hero_title: "About Herbarium Dyeworks",
  about_hero_description:
    "We are a small-batch natural dye studio based in Northern Ireland, creating beautiful yarns using traditional botanical dyeing techniques passed down through generations.",
  about_story_heading: "Our Story",
  about_story_paragraph1:
    "Herbarium Dyeworks was born from a passion for sustainable crafting and the ancient art of natural dyeing. What started as experiments in a small kitchen has grown into a dedicated studio where we transform raw fibres into works of art.",
  about_story_paragraph2:
    "Every skein we produce tells a story of patience and care. We forage locally for many of our dye materials, work with heritage breed wool, and honour the slow traditions that create truly unique colours.",
  about_story_paragraph3:
    "Our yarns are not just materials for your projects — they are a connection to the land, to history, and to the community of makers who share our values.",
  about_story_image: "",
  about_value1_title: "Sustainability",
  about_value1_description:
    "We use natural dyes, source responsibly, and minimise waste at every step of our process.",
  about_value1_icon: "Leaf",
  about_value2_title: "Craftsmanship",
  about_value2_description:
    "Each skein is hand-dyed with care, ensuring unique colours and exceptional quality.",
  about_value2_icon: "Heart",
  about_value3_title: "Local Roots",
  about_value3_description:
    "Proudly based in Northern Ireland, we celebrate our local landscape and heritage.",
  about_value3_icon: "MapPin",
};

async function getAboutSettings(): Promise<Record<string, string>> {
  const settings = await db.query.siteSettings.findMany();
  const settingsMap: Record<string, string> = { ...DEFAULTS };

  settings.forEach((s) => {
    if (s.key.startsWith("about_") && s.value) {
      settingsMap[s.key] = s.value;
    }
  });

  return settingsMap;
}

export default async function AboutPage() {
  const settings = await getAboutSettings();

  const Value1Icon = ICON_MAP[settings.about_value1_icon] || Leaf;
  const Value2Icon = ICON_MAP[settings.about_value2_icon] || Heart;
  const Value3Icon = ICON_MAP[settings.about_value3_icon] || MapPin;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/30 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <h1 className="font-heading text-4xl md:text-5xl font-medium text-foreground mb-6">
                {settings.about_hero_title}
              </h1>
              <p className="font-body text-lg text-muted-foreground leading-relaxed">
                {settings.about_hero_description}
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div>
                <h2 className="font-heading text-2xl md:text-3xl font-medium text-foreground mb-6">
                  {settings.about_story_heading}
                </h2>
                <div className="space-y-4 font-body text-muted-foreground leading-relaxed">
                  {settings.about_story_paragraph1 && (
                    <p>{settings.about_story_paragraph1}</p>
                  )}
                  {settings.about_story_paragraph2 && (
                    <p>{settings.about_story_paragraph2}</p>
                  )}
                  {settings.about_story_paragraph3 && (
                    <p>{settings.about_story_paragraph3}</p>
                  )}
                </div>
              </div>
              <div className="aspect-[4/3] bg-secondary rounded-lg overflow-hidden flex items-center justify-center">
                {settings.about_story_image ? (
                  <Image
                    src={settings.about_story_image}
                    alt="Our studio"
                    width={800}
                    height={600}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground font-body">
                    Studio Image
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-secondary/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="font-heading text-2xl md:text-3xl font-medium text-foreground mb-12 text-center">
              Our Values
            </h2>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Value1Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-medium text-foreground mb-2">
                  {settings.about_value1_title}
                </h3>
                <p className="font-body text-muted-foreground">
                  {settings.about_value1_description}
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Value2Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-medium text-foreground mb-2">
                  {settings.about_value2_title}
                </h3>
                <p className="font-body text-muted-foreground">
                  {settings.about_value2_description}
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Value3Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-medium text-foreground mb-2">
                  {settings.about_value3_title}
                </h3>
                <p className="font-body text-muted-foreground">
                  {settings.about_value3_description}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
