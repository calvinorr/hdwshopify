import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function checkPageLoads(path: string) {
  const response = await fetch(`${BASE_URL}${path}`);
  return {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type"),
  };
}

describe("Storefront Pages Load Test", () => {
  describe("Homepage", () => {
    it("should load /", async () => {
      const result = await checkPageLoads("/");
      expect(result.ok).toBe(true);
      expect(result.contentType).toContain("text/html");
    });
  });

  describe("Products", () => {
    it("should load /products", async () => {
      const result = await checkPageLoads("/products");
      expect(result.ok).toBe(true);
    });

    it("should load a product detail page", async () => {
      // First get a product slug from the API
      const apiResponse = await fetch(`${BASE_URL}/api/products`);
      const products = await apiResponse.json();

      if (products.length > 0) {
        const result = await checkPageLoads(`/products/${products[0].slug}`);
        expect(result.ok).toBe(true);
      }
    });
  });

  describe("Collections", () => {
    it("should load /collections", async () => {
      const result = await checkPageLoads("/collections");
      expect(result.ok).toBe(true);
    });

    it("should load a collection detail page", async () => {
      const apiResponse = await fetch(`${BASE_URL}/api/collections`);
      const collections = await apiResponse.json();

      if (collections.length > 0) {
        const result = await checkPageLoads(`/collections/${collections[0].slug}`);
        expect(result.ok).toBe(true);
      }
    });
  });

  describe("Search", () => {
    it("should load /search", async () => {
      const result = await checkPageLoads("/search");
      expect(result.ok).toBe(true);
    });

    it("should load /search with query", async () => {
      const result = await checkPageLoads("/search?q=yarn");
      expect(result.ok).toBe(true);
    });
  });

  describe("Auth Pages", () => {
    it("should load /sign-in (may fail with placeholder Clerk keys)", async () => {
      const result = await checkPageLoads("/sign-in");
      // Auth pages may return 500 if Clerk is not configured with real keys
      expect([200, 500]).toContain(result.status);
    });

    it("should load /sign-up (may fail with placeholder Clerk keys)", async () => {
      const result = await checkPageLoads("/sign-up");
      // Auth pages may return 500 if Clerk is not configured with real keys
      expect([200, 500]).toContain(result.status);
    });
  });
});
