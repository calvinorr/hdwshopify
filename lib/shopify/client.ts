/**
 * Shopify Admin API Client
 * Used for reading product data and syncing with our database
 */

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!;
const API_VERSION = "2024-01";

interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string | null;
  position: number;
  inventory_quantity: number;
  grams: number;
  weight: number;
  weight_unit: string;
  compare_at_price: string | null;
  image_id: number | null;
}

interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  src: string;
  alt: string | null;
  width: number;
  height: number;
  variant_ids: number[];
}

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  handle: string;
  status: "active" | "draft" | "archived";
  tags: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  image: ShopifyImage | null;
}

export interface ShopifyCollection {
  id: number;
  handle: string;
  title: string;
  body_html: string | null;
  published_at: string | null;
  sort_order: string;
  image?: {
    src: string;
    alt: string | null;
    width: number;
    height: number;
  };
}

interface ShopifyCollect {
  id: number;
  collection_id: number;
  product_id: number;
  position: number;
}

class ShopifyClient {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor() {
    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
      throw new Error("Shopify credentials not configured");
    }
    this.baseUrl = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}`;
    this.headers = {
      "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      "Content-Type": "application/json",
    };
  }

  private async fetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), { headers: this.headers });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get total product count
   */
  async getProductCount(): Promise<number> {
    const data = await this.fetch<{ count: number }>("/products/count.json");
    return data.count;
  }

  /**
   * Get products with pagination
   * @param limit - Number of products per page (max 250)
   * @param pageInfo - Cursor for pagination
   */
  async getProducts(limit = 50, sinceId?: number): Promise<ShopifyProduct[]> {
    const params: Record<string, string> = { limit: limit.toString() };
    if (sinceId) {
      params.since_id = sinceId.toString();
    }

    const data = await this.fetch<{ products: ShopifyProduct[] }>("/products.json", params);
    return data.products;
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: number): Promise<ShopifyProduct> {
    const data = await this.fetch<{ product: ShopifyProduct }>(`/products/${id}.json`);
    return data.product;
  }

  /**
   * Get all products (handles pagination)
   */
  async getAllProducts(onProgress?: (count: number, total: number) => void): Promise<ShopifyProduct[]> {
    const total = await this.getProductCount();
    const allProducts: ShopifyProduct[] = [];
    let sinceId: number | undefined;

    while (allProducts.length < total) {
      const products = await this.getProducts(250, sinceId);
      if (products.length === 0) break;

      allProducts.push(...products);
      sinceId = products[products.length - 1].id;

      if (onProgress) {
        onProgress(allProducts.length, total);
      }
    }

    return allProducts;
  }

  /**
   * Get custom collections
   */
  async getCollections(): Promise<ShopifyCollection[]> {
    const data = await this.fetch<{ custom_collections: ShopifyCollection[] }>("/custom_collections.json");
    return data.custom_collections;
  }

  /**
   * Get smart collections
   */
  async getSmartCollections(): Promise<ShopifyCollection[]> {
    const data = await this.fetch<{ smart_collections: ShopifyCollection[] }>("/smart_collections.json");
    return data.smart_collections;
  }

  /**
   * Get all collections (custom + smart)
   */
  async getAllCollections(): Promise<ShopifyCollection[]> {
    const [custom, smart] = await Promise.all([
      this.getCollections(),
      this.getSmartCollections(),
    ]);
    return [...custom, ...smart];
  }

  /**
   * Get products in a collection
   */
  async getCollectionProducts(collectionId: number): Promise<number[]> {
    const data = await this.fetch<{ collects: ShopifyCollect[] }>(
      "/collects.json",
      { collection_id: collectionId.toString() }
    );
    return data.collects.map((c) => c.product_id);
  }
}

// Export singleton instance
export const shopify = new ShopifyClient();

// Export for testing or custom instances
export { ShopifyClient };
