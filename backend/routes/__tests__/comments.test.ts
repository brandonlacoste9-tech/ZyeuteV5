import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import type { Server } from "http";

// --- Supabase REST mock ----------------------------------------------------
// The posts router builds a Supabase client at import time, so we must mock
// `@supabase/supabase-js` BEFORE importing the router and provide the env vars
// that gate `supabaseRest`.
process.env.VITE_SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

const insertedRows: any[] = [];

function makeQuery(table: string) {
  // Chainable query builder that mimics the subset of supabase-js used by the
  // comment routes: insert().select().single(), select().eq().single(), etc.
  const ctx: { table: string; pendingInsert?: any } = { table };
  const builder: any = {
    insert(values: any) {
      ctx.pendingInsert = values;
      return builder;
    },
    select() {
      return builder;
    },
    eq() {
      return builder;
    },
    is() {
      return builder;
    },
    in() {
      return builder;
    },
    order() {
      return Promise.resolve({ data: [], error: null });
    },
    async single() {
      if (ctx.table === "commentaires" && ctx.pendingInsert) {
        const row = {
          id: "comment-1",
          publication_id: ctx.pendingInsert.publication_id,
          user_id: ctx.pendingInsert.user_id,
          content: ctx.pendingInsert.content,
          created_at: "2026-06-11T00:00:00.000Z",
        };
        insertedRows.push(row);
        return { data: row, error: null };
      }
      if (ctx.table === "user_profiles") {
        return {
          data: {
            id: "user-1",
            username: "ti_guy",
            display_name: "Ti-Guy",
            avatar_url: null,
            username_color: "#FFFFFF",
          },
          error: null,
        };
      }
      if (ctx.table === "publications") {
        return { data: { user_id: "author-1" }, error: null };
      }
      return { data: null, error: null };
    },
  };
  return builder;
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (table: string) => makeQuery(table),
  }),
}));

// Avoid pulling real Redis/queue + notification side-effects.
vi.mock("../../queue.js", () => ({
  getModerationQueue: () => ({ add: vi.fn().mockResolvedValue(undefined) }),
  getVideoQueue: () => ({ add: vi.fn() }),
  getHLSVideoQueue: () => ({ add: vi.fn() }),
}));
vi.mock("../../services/pushNotify.js", () => ({
  notifyNewComment: vi.fn().mockResolvedValue(undefined),
}));

describe("POST /api/posts/:id/comments", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const express = (await import("express")).default;
    const postsRoutes = (await import("../posts.js")).default;

    const app = express();
    app.use(express.json());
    // Simulate attachBearerUserId having verified a JWT.
    app.use((req, _res, next) => {
      (req as any).userId = "user-1";
      next();
    });
    app.use("/api", postsRoutes);

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

  it("persists a comment and returns it with snake+camel fields", async () => {
    const res = await fetch(`${baseUrl}/api/posts/post-123/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "Allô la gang!" }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.comment).toBeTruthy();
    expect(json.comment.content).toBe("Allô la gang!");
    // Persisted against the correct FK columns
    expect(insertedRows[0].publication_id).toBe("post-123");
    expect(insertedRows[0].user_id).toBe("user-1");
    // Response carries both naming conventions so any client mapping works
    expect(json.comment.postId).toBe("post-123");
    expect(json.comment.publication_id).toBe("post-123");
    expect(json.comment.userId).toBe("user-1");
    expect(json.comment.created_at).toBeTruthy();
    expect(json.comment.createdAt).toBeTruthy();
    expect(json.comment.user?.username).toBe("ti_guy");
  });

  it("rejects empty content with 400", async () => {
    const res = await fetch(`${baseUrl}/api/posts/post-123/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "   " }),
    });
    expect(res.status).toBe(400);
  });
});
