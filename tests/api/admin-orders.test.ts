import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin Orders API", () => {
  describe("GET /api/admin/orders", () => {
    it("should return a list of orders", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/orders`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("orders");
      expect(Array.isArray(data.orders)).toBe(true);
    });

    it("should support status filtering", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/orders?status=pending`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("orders");
    });

    it("should support payment status filtering", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/orders?payment=paid`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("orders");
    });
  });

  describe("GET /api/admin/orders/[id]", () => {
    it("should return 404 for non-existent order", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/orders/99999`);
      expect(response.status).toBe(404);
    });
  });
});
