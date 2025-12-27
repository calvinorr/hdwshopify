import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin Products API", () => {
  describe("GET /api/admin/products", () => {
    it("should return a list of products", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/products`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("products");
      expect(Array.isArray(data.products)).toBe(true);
    });

    it("should support pagination", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/products?page=1&limit=5`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("products");
      expect(data.products.length).toBeLessThanOrEqual(5);
    });

    it("should support status filtering", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/products?status=active`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("products");
      data.products.forEach((product: any) => {
        expect(product.status).toBe("active");
      });
    });
  });

  describe("GET /api/admin/products/[id]", () => {
    it("should return a single product with variants", async () => {
      // First get a product ID from the list
      const listResponse = await fetch(`${BASE_URL}/api/admin/products`);
      const { products } = await listResponse.json();

      if (products.length > 0) {
        const response = await fetch(`${BASE_URL}/api/admin/products/${products[0].id}`);
        expect(response.ok).toBe(true);

        const data = await response.json();
        // Response wraps product in { product: {...} }
        const product = data.product || data;
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("variants");
        expect(Array.isArray(product.variants)).toBe(true);
      }
    });

    it("should return 404 for non-existent product", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/products/99999`);
      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/admin/products", () => {
    it("should require name, slug, and basePrice", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("should create a product with valid data", async () => {
      const timestamp = Date.now();
      const testProduct = {
        name: `Test Product ${timestamp}`,
        slug: `test-product-${timestamp}`,
        description: "Test description",
        basePrice: 19.99,
        status: "draft",
      };

      const response = await fetch(`${BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testProduct),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("product");
      expect(data.product.name).toBe(testProduct.name);
      expect(data.product.basePrice).toBe(testProduct.basePrice);
    });
  });
});
