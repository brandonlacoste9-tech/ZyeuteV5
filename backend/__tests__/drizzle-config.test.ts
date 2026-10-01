import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Drizzle configuration", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("DIRECT_DATABASE_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("loads without database credentials for migration generation", async () => {
    const { default: config } = await import("../../drizzle.config");

    expect(config.dialect).toBe("postgresql");
    expect(config.schema).toBe("./shared/schema.ts");
    expect(config.out).toBe("./migrations");
    expect(config.dbCredentials).toBeUndefined();
  });

  it("uses the database URL when a connection is configured", async () => {
    const databaseUrl = "postgresql://localhost/test_database";
    vi.stubEnv("DATABASE_URL", databaseUrl);
    const { default: config } = await import("../../drizzle.config");

    expect(config.dbCredentials).toEqual({ url: databaseUrl });
  });

  it("accepts a direct connection without requiring a pooled connection", async () => {
    const databaseUrl = "postgresql://localhost/direct_database";
    vi.stubEnv("DIRECT_DATABASE_URL", databaseUrl);
    const { default: config } = await import("../../drizzle.config");

    expect(config.dbCredentials).toEqual({ url: databaseUrl });
  });

  it("prefers the direct connection when both URLs are configured", async () => {
    const databaseUrl = "postgresql://localhost/direct_database";
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/pooled_database");
    vi.stubEnv("DIRECT_DATABASE_URL", databaseUrl);
    const { default: config } = await import("../../drizzle.config");

    expect(config.dbCredentials).toEqual({ url: databaseUrl });
  });
});
