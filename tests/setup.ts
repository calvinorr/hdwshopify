import { beforeAll, afterAll, afterEach } from "vitest";

// Base URL for API tests
export const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

// Mock fetch for API tests if needed
beforeAll(() => {
  // Setup code
});

afterAll(() => {
  // Cleanup code
});

afterEach(() => {
  // Reset between tests
});
