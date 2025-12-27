import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// Helper to check page loads successfully
async function checkPageLoads(path: string) {
  const response = await fetch(`${BASE_URL}${path}`);
  return {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type"),
  };
}

describe("Admin Pages Load Test", () => {
  describe("Dashboard", () => {
    it("should load /admin", async () => {
      const result = await checkPageLoads("/admin");
      expect(result.ok).toBe(true);
      expect(result.contentType).toContain("text/html");
    });
  });

  describe("Products", () => {
    it("should load /admin/products", async () => {
      const result = await checkPageLoads("/admin/products");
      expect(result.ok).toBe(true);
    });

    it("should load /admin/products/new", async () => {
      const result = await checkPageLoads("/admin/products/new");
      expect(result.ok).toBe(true);
    });

    it("should load /admin/products/1 (existing product)", async () => {
      const result = await checkPageLoads("/admin/products/1");
      // May be 200 or 404 depending on data
      expect([200, 404]).toContain(result.status);
    });
  });

  describe("Collections", () => {
    it("should load /admin/collections", async () => {
      const result = await checkPageLoads("/admin/collections");
      expect(result.ok).toBe(true);
    });

    it("should load /admin/collections/new", async () => {
      const result = await checkPageLoads("/admin/collections/new");
      expect(result.ok).toBe(true);
    });
  });

  describe("Orders", () => {
    it("should load /admin/orders", async () => {
      const result = await checkPageLoads("/admin/orders");
      expect(result.ok).toBe(true);
    });
  });

  describe("Customers", () => {
    it("should load /admin/customers", async () => {
      const result = await checkPageLoads("/admin/customers");
      expect(result.ok).toBe(true);
    });
  });

  describe("Inventory", () => {
    it("should load /admin/inventory", async () => {
      const result = await checkPageLoads("/admin/inventory");
      expect(result.ok).toBe(true);
    });
  });

  describe("Discounts", () => {
    it("should load /admin/discounts", async () => {
      const result = await checkPageLoads("/admin/discounts");
      expect(result.ok).toBe(true);
    });

    it("should load /admin/discounts/new", async () => {
      const result = await checkPageLoads("/admin/discounts/new");
      expect(result.ok).toBe(true);
    });
  });

  describe("Settings", () => {
    it("should load /admin/settings", async () => {
      const result = await checkPageLoads("/admin/settings");
      expect(result.ok).toBe(true);
    });

    it("should load /admin/settings/homepage", async () => {
      const result = await checkPageLoads("/admin/settings/homepage");
      expect(result.ok).toBe(true);
    });

    it("should load /admin/settings/shipping", async () => {
      const result = await checkPageLoads("/admin/settings/shipping");
      expect(result.ok).toBe(true);
    });
  });
});
