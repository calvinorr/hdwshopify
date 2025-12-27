import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin Inventory API", () => {
  describe("GET /api/admin/inventory", () => {
    it("should return inventory stats and variants", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/inventory`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("variants");
      expect(data).toHaveProperty("stats");
      expect(data.stats).toHaveProperty("total");
      expect(data.stats).toHaveProperty("outOfStock");
      expect(data.stats).toHaveProperty("lowStock");
    });

    it("should filter by out of stock status", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/inventory?status=out`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("variants");
    });

    it("should filter by low stock status", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/inventory?status=low`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("variants");
    });
  });

  describe("PATCH /api/admin/inventory", () => {
    it("should require variantId", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: 10 }),
      });

      expect(response.status).toBe(400);
    });

    it("should require valid stock value", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/inventory`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: 1, stock: -5 }),
      });

      expect(response.status).toBe(400);
    });
  });
});
