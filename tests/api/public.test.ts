import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Public API", () => {
  describe("GET /api/products", () => {
    it("should return a list of active products", async () => {
      const response = await fetch(`${BASE_URL}/api/products`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("products");
      expect(Array.isArray(data.products)).toBe(true);

      // All returned products should be active
      data.products.forEach((product: any) => {
        expect(product.status).toBe("active");
      });
    });

    it("should include pagination info", async () => {
      const response = await fetch(`${BASE_URL}/api/products`);
      const data = await response.json();

      expect(data).toHaveProperty("pagination");
      expect(data.pagination).toHaveProperty("page");
      expect(data.pagination).toHaveProperty("totalCount");
    });

    it("should include product images", async () => {
      const response = await fetch(`${BASE_URL}/api/products`);
      const data = await response.json();

      if (data.products.length > 0) {
        expect(data.products[0]).toHaveProperty("images");
      }
    });
  });

  describe("GET /api/products/[slug]", () => {
    it("should return a single product with full details", async () => {
      // First get a product slug
      const listResponse = await fetch(`${BASE_URL}/api/products`);
      const { products } = await listResponse.json();

      if (products.length > 0) {
        const response = await fetch(`${BASE_URL}/api/products/${products[0].slug}`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        // Response wraps product in { product: {...} }
        const product = data.product || data;
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("slug");
        expect(product).toHaveProperty("variants");
        expect(product).toHaveProperty("images");
      }
    });

    it("should return 404 for non-existent product", async () => {
      const response = await fetch(`${BASE_URL}/api/products/non-existent-product-slug`);
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/collections", () => {
    it("should return a list of collections", async () => {
      const response = await fetch(`${BASE_URL}/api/collections`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("collections");
      expect(Array.isArray(data.collections)).toBe(true);
    });
  });

  describe("GET /api/collections/[slug]", () => {
    it("should return collection with products", async () => {
      const listResponse = await fetch(`${BASE_URL}/api/collections`);
      const { collections } = await listResponse.json();

      if (collections.length > 0) {
        const response = await fetch(`${BASE_URL}/api/collections/${collections[0].slug}`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        // Response wraps collection in { collection: {...} }
        const collection = data.collection || data;
        expect(collection).toHaveProperty("id");
        expect(collection).toHaveProperty("name");
      }
    });

    it("should return 404 for non-existent collection", async () => {
      const response = await fetch(`${BASE_URL}/api/collections/non-existent-collection`);
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/search", () => {
    it("should return search results for valid query", async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=yarn`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("results");
      expect(Array.isArray(data.results)).toBe(true);
      expect(data).toHaveProperty("query");
    });

    it("should handle empty query", async () => {
      const response = await fetch(`${BASE_URL}/api/search?q=`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("results");
      expect(data.results).toEqual([]);
    });
  });
});
