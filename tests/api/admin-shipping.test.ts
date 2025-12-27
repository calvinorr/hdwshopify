import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin Shipping API", () => {
  describe("GET /api/admin/settings/shipping", () => {
    it("should return shipping zones and settings", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/settings/shipping`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("zones");
      expect(data).toHaveProperty("freeShippingThreshold");
      expect(Array.isArray(data.zones)).toBe(true);
    });
  });

  describe("POST /api/admin/settings/shipping", () => {
    it("should update free shipping threshold", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/settings/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeShippingThreshold: 50,
          zones: [],
        }),
      });

      expect(response.ok).toBe(true);
    });
  });
});
