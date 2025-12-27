"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Leaf, Heart, MapPin, Sparkles, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/image-upload";

const ICON_OPTIONS = [
  { value: "Leaf", label: "Leaf", icon: Leaf },
  { value: "Heart", label: "Heart", icon: Heart },
  { value: "MapPin", label: "Location", icon: MapPin },
  { value: "Sparkles", label: "Sparkles", icon: Sparkles },
  { value: "Award", label: "Award", icon: Award },
  { value: "Globe", label: "Globe", icon: Globe },
];

interface Props {
  settings: Record<string, string>;
}

export function AboutSettingsForm({ settings }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Hero section
  const [heroTitle, setHeroTitle] = useState(
    settings.about_hero_title || "About Herbarium Dyeworks"
  );
  const [heroDescription, setHeroDescription] = useState(
    settings.about_hero_description ||
      "We are a small-batch natural dye studio based in Northern Ireland, creating beautiful yarns using traditional botanical dyeing techniques passed down through generations."
  );

  // Story section
  const [storyHeading, setStoryHeading] = useState(
    settings.about_story_heading || "Our Story"
  );
  const [storyParagraph1, setStoryParagraph1] = useState(
    settings.about_story_paragraph1 ||
      "Herbarium Dyeworks was born from a passion for sustainable crafting and the ancient art of natural dyeing. What started as experiments in a small kitchen has grown into a dedicated studio where we transform raw fibres into works of art."
  );
  const [storyParagraph2, setStoryParagraph2] = useState(
    settings.about_story_paragraph2 ||
      "Every skein we produce tells a story of patience and care. We forage locally for many of our dye materials, work with heritage breed wool, and honour the slow traditions that create truly unique colours."
  );
  const [storyParagraph3, setStoryParagraph3] = useState(
    settings.about_story_paragraph3 ||
      "Our yarns are not just materials for your projects — they are a connection to the land, to history, and to the community of makers who share our values."
  );
  const [storyImage, setStoryImage] = useState(settings.about_story_image || "");

  // Values section
  const [value1Title, setValue1Title] = useState(
    settings.about_value1_title || "Sustainability"
  );
  const [value1Description, setValue1Description] = useState(
    settings.about_value1_description ||
      "We use natural dyes, source responsibly, and minimise waste at every step of our process."
  );
  const [value1Icon, setValue1Icon] = useState(
    settings.about_value1_icon || "Leaf"
  );

  const [value2Title, setValue2Title] = useState(
    settings.about_value2_title || "Craftsmanship"
  );
  const [value2Description, setValue2Description] = useState(
    settings.about_value2_description ||
      "Each skein is hand-dyed with care, ensuring unique colours and exceptional quality."
  );
  const [value2Icon, setValue2Icon] = useState(
    settings.about_value2_icon || "Heart"
  );

  const [value3Title, setValue3Title] = useState(
    settings.about_value3_title || "Local Roots"
  );
  const [value3Description, setValue3Description] = useState(
    settings.about_value3_description ||
      "Proudly based in Northern Ireland, we celebrate our local landscape and heritage."
  );
  const [value3Icon, setValue3Icon] = useState(
    settings.about_value3_icon || "MapPin"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/settings/about", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about_hero_title: heroTitle,
          about_hero_description: heroDescription,
          about_story_heading: storyHeading,
          about_story_paragraph1: storyParagraph1,
          about_story_paragraph2: storyParagraph2,
          about_story_paragraph3: storyParagraph3,
          about_story_image: storyImage,
          about_value1_title: value1Title,
          about_value1_description: value1Description,
          about_value1_icon: value1Icon,
          about_value2_title: value2Title,
          about_value2_description: value2Description,
          about_value2_icon: value2Icon,
          about_value3_title: value3Title,
          about_value3_description: value3Description,
          about_value3_icon: value3Icon,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const renderIconSelect = (
    value: string,
    onChange: (val: string) => void,
    label: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {ICON_OPTIONS.map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                value === option.value
                  ? "border-primary bg-primary/10"
                  : "border-stone-200 hover:border-stone-300"
              }`}
              title={option.label}
            >
              <IconComponent className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-semibold text-stone-900">
              About Page Settings
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Configure your About page content
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/about" target="_blank">
              Preview
            </Link>
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Settings saved successfully!
        </div>
      )}

      {/* Hero Section */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-medium text-stone-900">Hero Section</h2>
        <p className="text-sm text-stone-600">
          The main header area at the top of the About page.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="heroTitle">Page Title</Label>
            <Input
              id="heroTitle"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="About Herbarium Dyeworks"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroDescription">Introduction</Label>
            <Textarea
              id="heroDescription"
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              placeholder="A brief introduction to your business..."
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-medium text-stone-900">Our Story Section</h2>
        <p className="text-sm text-stone-600">
          Tell visitors about your journey and what makes your business special.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storyHeading">Section Heading</Label>
              <Input
                id="storyHeading"
                value={storyHeading}
                onChange={(e) => setStoryHeading(e.target.value)}
                placeholder="Our Story"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyParagraph1">Paragraph 1</Label>
              <Textarea
                id="storyParagraph1"
                value={storyParagraph1}
                onChange={(e) => setStoryParagraph1(e.target.value)}
                placeholder="How did your business start?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyParagraph2">Paragraph 2</Label>
              <Textarea
                id="storyParagraph2"
                value={storyParagraph2}
                onChange={(e) => setStoryParagraph2(e.target.value)}
                placeholder="What makes your process unique?"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyParagraph3">Paragraph 3</Label>
              <Textarea
                id="storyParagraph3"
                value={storyParagraph3}
                onChange={(e) => setStoryParagraph3(e.target.value)}
                placeholder="What do your products mean to customers?"
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Studio Image</Label>
              <ImageUpload
                value={storyImage || undefined}
                onChange={(url) => setStoryImage(url || "")}
                aspectRatio="landscape"
              />
              <p className="text-xs text-stone-500">
                Recommended: 800x600 or similar 4:3 aspect ratio
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="font-medium text-stone-900">Our Values Section</h2>
        <p className="text-sm text-stone-600">
          Highlight three core values that define your business.
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Value 1 */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium text-stone-700">Value 1</h3>
            {renderIconSelect(value1Icon, setValue1Icon, "Icon")}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={value1Title}
                onChange={(e) => setValue1Title(e.target.value)}
                placeholder="e.g., Sustainability"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={value1Description}
                onChange={(e) => setValue1Description(e.target.value)}
                placeholder="Describe this value..."
                rows={3}
              />
            </div>
          </div>

          {/* Value 2 */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium text-stone-700">Value 2</h3>
            {renderIconSelect(value2Icon, setValue2Icon, "Icon")}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={value2Title}
                onChange={(e) => setValue2Title(e.target.value)}
                placeholder="e.g., Craftsmanship"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={value2Description}
                onChange={(e) => setValue2Description(e.target.value)}
                placeholder="Describe this value..."
                rows={3}
              />
            </div>
          </div>

          {/* Value 3 */}
          <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-medium text-stone-700">Value 3</h3>
            {renderIconSelect(value3Icon, setValue3Icon, "Icon")}
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={value3Title}
                onChange={(e) => setValue3Title(e.target.value)}
                placeholder="e.g., Local Roots"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={value3Description}
                onChange={(e) => setValue3Description(e.target.value)}
                placeholder="Describe this value..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
