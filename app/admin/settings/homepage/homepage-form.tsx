"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  X,
  GripVertical,
  Image as ImageIcon,
  Check,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface HeroSlide {
  id?: number;
  title: string | null;
  subtitle: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  imageUrl: string;
  imageAlt: string | null;
  position: number | null;
  active: boolean | null;
}

interface Product {
  id: number;
  name: string;
  images: { url: string }[];
}

interface Props {
  settings: Record<string, string>;
  heroSlides: HeroSlide[];
  products: Product[];
  featuredProductIds: number[];
}

export function HomepageSettingsForm({
  settings,
  heroSlides: initialSlides,
  products,
  featuredProductIds: initialFeatured,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Announcement bar
  const [announcementText, setAnnouncementText] = useState(
    settings.announcement_text || "Free UK shipping on orders over £50"
  );
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    settings.announcement_enabled !== "false"
  );

  // Hero slides
  const [slides, setSlides] = useState<HeroSlide[]>(
    initialSlides.length > 0
      ? initialSlides
      : [
          {
            title: "Naturally Dyed Yarn",
            subtitle: "Hand-dyed with botanical extracts",
            buttonText: "Shop Now",
            buttonLink: "/products",
            imageUrl: "",
            imageAlt: "",
            position: 0,
            active: true,
          },
        ]
  );

  // Featured products
  const [featuredIds, setFeaturedIds] = useState<number[]>(initialFeatured);
  const [productSearch, setProductSearch] = useState("");

  // Slide management
  const addSlide = () => {
    setSlides([
      ...slides,
      {
        title: "",
        subtitle: "",
        buttonText: "Shop Now",
        buttonLink: "/products",
        imageUrl: "",
        imageAlt: "",
        position: slides.length,
        active: true,
      },
    ]);
  };

  const updateSlide = (index: number, field: keyof HeroSlide, value: any) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], [field]: value };
    setSlides(updated);
  };

  const removeSlide = (index: number) => {
    setSlides(slides.filter((_, i) => i !== index));
  };

  const toggleSlideActive = (index: number) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], active: !updated[index].active };
    setSlides(updated);
  };

  // Featured products
  const toggleFeatured = (productId: number) => {
    setFeaturedIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/settings/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcementText,
          announcementEnabled,
          heroSlides: slides,
          featuredProductIds: featuredIds,
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
              Homepage Settings
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Configure your homepage content
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" asChild>
            <Link href="/" target="_blank">
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

      {/* Announcement Bar */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-stone-900">Announcement Bar</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-600">Enabled</span>
          </label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement">Announcement Text</Label>
          <Input
            id="announcement"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="e.g., Free UK shipping on orders over £50"
          />
        </div>

        {/* Preview */}
        <div className="mt-4 p-3 bg-stone-900 text-white text-center text-sm rounded">
          {announcementText || "Your announcement here"}
        </div>
      </div>

      {/* Hero Carousel */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-stone-900">Hero Carousel</h2>
          <Button type="button" variant="outline" size="sm" onClick={addSlide}>
            <Plus className="h-4 w-4 mr-1" />
            Add Slide
          </Button>
        </div>

        <div className="space-y-4">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 space-y-4 ${
                slide.active ? "bg-white" : "bg-stone-50 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-stone-400 cursor-grab" />
                  <span className="font-medium text-stone-700">
                    Slide {index + 1}
                  </span>
                  {!slide.active && (
                    <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleSlideActive(index)}
                    title={slide.active ? "Hide slide" : "Show slide"}
                  >
                    {slide.active ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600"
                    onClick={() => removeSlide(index)}
                    disabled={slides.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Image URL *</Label>
                  <Input
                    value={slide.imageUrl}
                    onChange={(e) =>
                      updateSlide(index, "imageUrl", e.target.value)
                    }
                    placeholder="https://..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image Alt Text</Label>
                  <Input
                    value={slide.imageAlt || ""}
                    onChange={(e) =>
                      updateSlide(index, "imageAlt", e.target.value)
                    }
                    placeholder="Describe the image"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={slide.title || ""}
                    onChange={(e) =>
                      updateSlide(index, "title", e.target.value)
                    }
                    placeholder="e.g., Naturally Dyed Yarn"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={slide.subtitle || ""}
                    onChange={(e) =>
                      updateSlide(index, "subtitle", e.target.value)
                    }
                    placeholder="e.g., Hand-dyed with botanical extracts"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Text</Label>
                  <Input
                    value={slide.buttonText || ""}
                    onChange={(e) =>
                      updateSlide(index, "buttonText", e.target.value)
                    }
                    placeholder="e.g., Shop Now"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Link</Label>
                  <Input
                    value={slide.buttonLink || ""}
                    onChange={(e) =>
                      updateSlide(index, "buttonLink", e.target.value)
                    }
                    placeholder="/products"
                  />
                </div>
              </div>

              {/* Preview */}
              {slide.imageUrl && (
                <div className="mt-2 aspect-[21/9] max-w-md rounded-lg overflow-hidden bg-stone-100 relative">
                  <img
                    src={slide.imageUrl}
                    alt={slide.imageAlt || ""}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="text-center text-white">
                      {slide.title && (
                        <p className="text-lg font-heading">{slide.title}</p>
                      )}
                      {slide.subtitle && (
                        <p className="text-sm opacity-90">{slide.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-stone-900">Featured Products</h2>
          <span className="text-sm text-stone-500">
            {featuredIds.length} selected
          </span>
        </div>

        <p className="text-sm text-stone-600">
          Select products to feature on the homepage. These appear in the
          "Featured" section below the hero.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-10"
          />
        </div>

        {/* Selected products */}
        {featuredIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {featuredIds.map((id) => {
              const product = products.find((p) => p.id === id);
              if (!product) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm"
                >
                  <span>{product.name}</span>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(id)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Product list */}
        <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
          {filteredProducts.length === 0 ? (
            <div className="p-4 text-center text-stone-500">
              No products found
            </div>
          ) : (
            filteredProducts.map((product) => {
              const isSelected = featuredIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleFeatured(product.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-stone-50 transition-colors ${
                    isSelected ? "bg-primary/5" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-stone-300"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>

                  {/* Image */}
                  <div className="h-8 w-8 rounded bg-stone-100 overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
                      <img
                        src={product.images[0].url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-3 w-3 text-stone-300" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-sm font-medium text-stone-900 truncate">
                    {product.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </form>
  );
}
