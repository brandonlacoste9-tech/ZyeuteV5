import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { Server } from "http";
import {
  buildCorsOptions,
  resolveAllowedOrigins,
  DEFAULT_ALLOWED_ORIGINS,
} from "../cors.js";

const PROD_ORIGIN = "https://zyeute-v5.vercel.app";

// Build a minimal app that mirrors index.ts: cors middleware in front of a
// /api/health route. This reproduces the production hotfix scenario where any
// request carrying an Origin header returned 500.
describe("CORS regression: 500 on any request with Origin header", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const express = (await import("express")).default;
    const cors = (await import("cors")).default;
    const app = express();
    const opts = buildCorsOptions(resolveAllowedOrigins());
    app.use(cors(opts));
    app.options(/.*/, cors(opts));
    app.get("/api/health", (_req, res) => {
      res.status(200).json({ status: "ok" });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("production Vercel origin is in the default allowlist", () => {
    expect(DEFAULT_ALLOWED_ORIGINS).toContain(PROD_ORIGIN);
  });

  it("allowed Origin → 2xx with access-control-allow-origin", async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: PROD_ORIGIN },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(PROD_ORIGIN);
  });

  it("no Origin header → 2xx", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  it("unknown Origin → not 500 (denied cleanly, no CORS header)", async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: "https://evil.example.com" },
    });
    expect(res.status).not.toBe(500);
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("preflight OPTIONS from allowed origin → no 500", async () => {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: "OPTIONS",
      headers: {
        Origin: PROD_ORIGIN,
        "Access-Control-Request-Method": "POST",
      },
    });
    expect(res.status).not.toBe(500);
    expect(res.headers.get("access-control-allow-origin")).toBe(PROD_ORIGIN);
  });

  it("CORS_ALLOWED_ORIGINS env extends, never shrinks, the default baseline", () => {
    const resolved = resolveAllowedOrigins({
      CORS_ALLOWED_ORIGINS: "https://custom.example.com",
    } as NodeJS.ProcessEnv);
    expect(resolved).toContain("https://custom.example.com");
    expect(resolved).toContain(PROD_ORIGIN);
  });

  it("missing CORS env still yields the safe default allowlist", () => {
    const resolved = resolveAllowedOrigins({} as NodeJS.ProcessEnv);
    expect(resolved).toEqual([...DEFAULT_ALLOWED_ORIGINS]);
  });
});
