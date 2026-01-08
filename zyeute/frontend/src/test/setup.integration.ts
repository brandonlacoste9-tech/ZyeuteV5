import { beforeAll, afterAll, afterEach } from "vitest";

// Setup for integration tests
// Add any global setup/teardown here

beforeAll(() => {
  // Setup test database, mock services, etc.
  console.log("Setting up integration test environment...");
});

afterEach(() => {
  // Clean up after each test
});

afterAll(() => {
  // Cleanup test database, close connections, etc.
  console.log("Cleaning up integration test environment...");
});
