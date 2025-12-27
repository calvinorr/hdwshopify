import { describe, it, expect } from "vitest";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin Collections API", () => {
  describe("GET /api/admin/collections", () => {
    it("should return a list of collections", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/collections`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data).toHaveProperty("collections");
      expect(Array.isArray(data.collections)).toBe(true);
    });
  });

  describe("GET /api/admin/collections/[id]", () => {
    it("should return a single collection", async () => {
      // First get a collection ID
      const listResponse = await fetch(`${BASE_URL}/api/admin/collections`);
      const { collections } = await listResponse.json();

      if (collections.length > 0) {
        const response = await fetch(`${BASE_URL}/api/admin/collections/${collections[0].id}`);

        if (response.ok) {
          const data = await response.json();
          // Response wraps collection in { collection: {...} }
          const collection = data.collection || data;
          expect(collection).toHaveProperty("id");
          expect(collection).toHaveProperty("name");
          expect(collection).toHaveProperty("slug");
        }
      }
    });

    it("should return 404 for non-existent collection", async () => {
      const response = await fetch(`${BASE_URL}/api/admin/collections/99999`);
      expect(response.status).toBe(404);
    });
  });
});
