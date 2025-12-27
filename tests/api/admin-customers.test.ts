import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin Customers API", () => {
  describe("GET /api/admin/customers", () => {
    it("should return a list of customers", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/customers`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("customers");
      expect(Array.isArray(data.customers)).toBe(true);
    });

    it("should support search", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/customers?search=test`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("customers");
    });

    it("should support pagination", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/customers?page=1&limit=10`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("customers");
      expect(data.customers.length).toBeLessThanOrEqual(10);
    });
  });

  describe("GET /api/admin/customers/[id]", () => {
    it("should return 404 for non-existent customer", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/customers/99999`);
      expect(response.status).toBe(404);
    });
  });
});
