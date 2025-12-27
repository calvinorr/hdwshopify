import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin Discounts API", () => {
  describe("GET /api/admin/discounts", () => {
    it("should return a list of discount codes", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/discounts`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("POST /api/admin/discounts", () => {
    it("should require code and type", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it("should create a valid discount code", async () => {
      const discount = {
        code: `TEST${Date.now()}`,
        type: "percentage",
        value: 10,
        isActive: true,
      };

      const response = await fetch(`${BASE_URL}/api/admin/discounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discount),
      });

      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.code).toBe(discount.code);
      expect(data.type).toBe(discount.type);
    });
  });

  describe("GET /api/admin/discounts/[id]", () => {
    it("should return 404 for non-existent discount", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/discounts/99999`);
      expect(response.status).toBe(404);
    });
  });
});
