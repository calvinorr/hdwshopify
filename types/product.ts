import type {
  Product,
  ProductVariant,
  ProductImage,
  Category,
} from "@/lib/db/schema";

export type { Product, ProductVariant, ProductImage, Category };

export interface ProductWithRelations extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
  category?: Category | null;
}

export type YarnWeight = "Laceweight" | "4ply" | "DK" | "Aran";

export type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

export interface ProductFilters {
  weight: YarnWeight[];
  fiberContent: string[];
  availability: ("in-stock" | "low-stock" | "sold-out")[];
}

export interface FilterOptions {
  weights: YarnWeight[];
  fiberContents: string[];
}
