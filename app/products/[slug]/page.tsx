import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db, products } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { ProductClient } from "./product-client";
import { RelatedProducts } from "@/components/products/related-products";
import { RecentlyViewed } from "@/components/products/recently-viewed";
import { getAvailableStockBatch } from "@/lib/db/stock";
import type { ProductWithRelations } from "@/types/product";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Fetch product by slug with all relations
async function getProduct(slug: string): Promise<ProductWithRelations | null> {
  try {
    const product = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.status, "active")),
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.position)],
        },
        category: true,
      },
    });

    return product as ProductWithRelations | null;
  } catch (error) {
    console.warn("Could not fetch product:", error);
    return null;
  }
}

// Generate static params for all active products
export async function generateStaticParams() {
  try {
    const activeProducts = await db.query.products.findMany({
      where: eq(products.status, "active"),
      columns: {
        slug: true,
      },
    });

    return activeProducts.map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.warn("Could not fetch products for static params:", error);
    return [];
  }
}

// Generate metadata with OG and Twitter cards
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const title = product.metaTitle || product.name;
  const description =
    product.metaDescription ||
    product.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
    `${product.name} - Naturally dyed yarn from Herbarium Dyeworks`;
  const firstImage = product.images[0];

  return {
    title: `${title} | Herbarium Dyeworks`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `/products/${slug}`,
      images: firstImage
        ? [
            {
              url: firstImage.url,
              alt: firstImage.alt || product.name,
              width: 1200,
              height: 630,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: firstImage ? [firstImage.url] : undefined,
    },
  };
}

// Generate JSON-LD structured data for Product schema
function generateProductJsonLd(product: ProductWithRelations) {
  const firstImage = product.images[0];
  const availability =
    (product.stock ?? 0) > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description?.replace(/<[^>]*>/g, "") || undefined,
    image: firstImage?.url,
    brand: {
      "@type": "Brand",
      name: "Herbarium Dyeworks",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      availability,
    },
    ...(product.fiberContent && {
      material: product.fiberContent,
    }),
    ...(product.weight && {
      category: product.weight,
    }),
  };
}

// ISR revalidation - 1 hour
export const revalidate = 3600;

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  // Fetch available stock (accounting for reservations) for this product
  const availableStockMap = await getAvailableStockBatch([product.id]);
  const availableStock = availableStockMap.get(product.id) ?? (product.stock ?? 0);

  const jsonLd = generateProductJsonLd(product);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="flex min-h-screen flex-col">
        <Header />

        <main className="flex-1">
          <div className="container mx-auto px-4 py-8 lg:py-12">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6">
              <ol className="flex items-center gap-2 text-sm font-body text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-primary transition-colors">
                    Home
                  </Link>
                </li>
                <li>/</li>
                {product.category && (
                  <>
                    <li>
                      <Link
                        href={`/collections/${product.category.slug}`}
                        className="hover:text-primary transition-colors"
                      >
                        {product.category.name}
                      </Link>
                    </li>
                    <li>/</li>
                  </>
                )}
                <li className="text-foreground">{product.name}</li>
              </ol>
            </nav>

            {/* Product Content */}
            <ProductClient product={product} availableStock={availableStock} />

            {/* Related Products */}
            <RelatedProducts currentSlug={slug} />

            {/* Recently Viewed */}
            <RecentlyViewed currentSlug={slug} />
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
