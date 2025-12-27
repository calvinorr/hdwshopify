import Link from "next/link";
import Image from "next/image";
import { eq, desc } from "drizzle-orm";
import { db, products, categories, heroSlides as heroSlidesTable, siteSettings } from "@/lib/db";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { HeroCarousel, type CarouselSlide } from "@/components/home";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Truck, Recycle, Award } from "lucide-react";
import type { ProductWithRelations } from "@/types/product";

export const revalidate = 60; // Revalidate every minute for dynamic content

async function getFeaturedProducts(): Promise<ProductWithRelations[]> {
  try {
    const featuredProducts = await db.query.products.findMany({
      where: eq(products.featured, true),
      with: {
        variants: true,
        images: true,
        category: true,
      },
      orderBy: [desc(products.createdAt)],
      limit: 4,
    });
    return featuredProducts;
  } catch {
    console.warn("Could not fetch featured products");
    return [];
  }
}

async function getCategories() {
  try {
    return await db.query.categories.findMany({
      orderBy: [categories.position],
      limit: 4,
    });
  } catch {
    return [];
  }
}

async function getHeroSlides(): Promise<CarouselSlide[]> {
  try {
    const slides = await db.query.heroSlides.findMany({
      where: eq(heroSlidesTable.active, true),
      orderBy: [heroSlidesTable.position],
    });

    if (slides.length === 0) {
      // Return default slides if none configured
      return defaultHeroSlides;
    }

    return slides.map((slide) => ({
      id: `hero-${slide.id}`,
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      description: "",
      cta: slide.buttonText ? { text: slide.buttonText, href: slide.buttonLink || "/products" } : undefined,
      image: slide.imageUrl,
      imageAlt: slide.imageAlt || "",
    }));
  } catch {
    return defaultHeroSlides;
  }
}

async function getSettings(): Promise<Record<string, string>> {
  try {
    const settings = await db.query.siteSettings.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return settingsMap;
  } catch {
    return {};
  }
}

// Default hero slides (fallback)
const defaultHeroSlides: CarouselSlide[] = [
  {
    id: "hero-1",
    title: "Naturally\nDyed Yarn",
    subtitle: "New Collection",
    description: "Discover our latest botanical colorways, hand-dyed on the coast of Northern Ireland using traditional plant-based methods.",
    cta: { text: "Shop Collection", href: "/products" },
    secondaryCta: { text: "Our Process", href: "/about" },
    image: "https://cdn.shopify.com/s/files/1/0838/1127/0999/files/20240716_122642964_iOS.jpg?v=1721203146",
    imageAlt: "Hand-dyed yarn skeins in natural botanical colors",
  },
  {
    id: "hero-2",
    title: "Soft\nPastels",
    subtitle: "Artisan Dyed",
    description: "Gentle hues from nature's palette. Each skein tells a story of ancient craft and modern sustainability.",
    cta: { text: "Explore Collection", href: "/collections/dk" },
    image: "https://cdn.shopify.com/s/files/1/0838/1127/0999/files/20240717_055855463_iOS.jpg?v=1721203170",
    imageAlt: "Soft pastel yarn skeins in cream, pink and green",
  },
];

export default async function HomePage() {
  const [featuredProducts, categoryList, heroSlides, settings] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
    getHeroSlides(),
    getSettings(),
  ]);

  const announcementText = settings.announcement_text || "Free UK shipping on orders over £50";
  const announcementEnabled = settings.announcement_enabled !== "false";
  const backgroundImage = settings.homepage_background_image;
  const backgroundOverlay = settings.homepage_background_overlay || "rgba(0,0,0,0.4)";

  const collections = categoryList.length > 0
    ? categoryList
    : [
        { name: "Laceweight", slug: "laceweight", description: "Delicate yarns" },
        { name: "4 Ply", slug: "4ply", description: "Versatile sock weight" },
        { name: "DK", slug: "dk", description: "Classic workhorse" },
        { name: "Aran", slug: "aran", description: "Chunky comfort" },
      ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Floating Header - overlays the carousel */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header
          announcementText={announcementText}
          announcementEnabled={announcementEnabled}
        />
      </div>

      <main className="flex-1">
        {/* Full-viewport Hero Carousel */}
        <HeroCarousel
          slides={heroSlides}
          autoPlayInterval={7000}
          backgroundImage={backgroundImage}
          backgroundOverlay={backgroundOverlay}
        />

        {/* Trust Bar - visible without scrolling on most devices */}
        <section className="relative z-10 -mt-1 bg-stone-900 text-white">
          <div className="container mx-auto px-6 py-5">
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm">
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span>100% Natural Dyes</span>
              </div>
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <Truck className="w-4 h-4 text-sky-400" />
                <span>Free UK Shipping £50+</span>
              </div>
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <Recycle className="w-4 h-4 text-green-400" />
                <span>Eco-Friendly Process</span>
              </div>
              <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                <Award className="w-4 h-4 text-amber-400" />
                <span>Handcrafted in Ireland</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Shop - Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="py-16 md:py-24 bg-gradient-to-b from-white to-stone-50/50">
            <div className="container mx-auto px-6">
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
                <div>
                  <span className="text-sm font-medium tracking-widest text-stone-500 uppercase">
                    Curated Selection
                  </span>
                  <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl text-stone-900 mt-2">
                    Featured Yarns
                  </h2>
                </div>
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <span className="font-medium">View All</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {featuredProducts.map((product, index) => {
                  const primaryImage = product.images?.[0];
                  const minPrice = product.variants?.length
                    ? Math.min(...product.variants.map(v => v.price))
                    : product.basePrice;

                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      className="group relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Image */}
                      <div className="aspect-[3/4] relative overflow-hidden rounded-lg bg-stone-100">
                        {primaryImage ? (
                          <Image
                            src={primaryImage.url}
                            alt={primaryImage.alt || product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Leaf className="w-12 h-12 text-stone-300" />
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Quick view button */}
                        <div className="absolute inset-x-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <Button
                            size="sm"
                            className="w-full bg-white/90 text-stone-900 hover:bg-white backdrop-blur-sm"
                          >
                            Quick View
                          </Button>
                        </div>

                        {/* Badge */}
                        {product.featured && (
                          <span className="absolute top-3 left-3 px-2 py-1 text-xs font-medium bg-stone-900 text-white rounded">
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="mt-4 space-y-1">
                        <p className="text-xs text-stone-500 uppercase tracking-wide">
                          {product.category?.name || product.weight}
                        </p>
                        <h3 className="font-heading text-lg text-stone-900 group-hover:text-primary transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="font-medium text-stone-700">
                          From £{minPrice.toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Collections Strip */}
        <section className="py-16 md:py-24 bg-stone-900 text-white overflow-hidden">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <span className="text-sm font-medium tracking-widest text-stone-400 uppercase">
                Shop by Weight
              </span>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl text-white mt-2">
                Collections
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {collections.map((collection, index) => (
                <Link
                  key={collection.slug}
                  href={`/collections/${collection.slug}`}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-stone-800"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-emerald-900/20 group-hover:opacity-75 transition-opacity" />

                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Leaf className="w-8 h-8 text-white/70" />
                    </div>
                    <h3 className="font-heading text-xl md:text-2xl text-white">
                      {collection.name}
                    </h3>
                    <p className="text-sm text-stone-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      Browse Collection →
                    </p>
                  </div>

                  {/* Hover border */}
                  <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-xl transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter - Compact */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-amber-50 to-white">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <span className="text-sm font-medium tracking-widest text-stone-500 uppercase">
                Stay Updated
              </span>
              <h2 className="font-heading text-3xl md:text-4xl text-stone-900 mt-2 mb-4">
                Join Our Flock
              </h2>
              <p className="text-stone-600 mb-8">
                Be the first to know about new colorways, restock alerts, and exclusive offers.
              </p>
              <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 px-5 py-3 rounded-full border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <Button
                  type="submit"
                  className="px-8 py-3 rounded-full bg-stone-900 hover:bg-stone-800 text-white"
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
