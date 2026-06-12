import { describe, it, expect, vi, beforeEach } from "vitest";

// The Mux webhook handler writes through the Supabase JS client (service role)
// because the direct Postgres pool times out in production. We mock the
// supabase-auth module so `supabaseAdmin` is a controllable fake and assert the
// helper issues the correct PostgREST update against the `publications` table.

type UpdateCall = { table: string; values: any; eqCol?: string; eqVal?: any };
const updateCalls: UpdateCall[] = [];
let updateError: { message: string } | null = null;

function makeSupabaseStub() {
  return {
    from(table: string) {
      const call: UpdateCall = { table, values: undefined };
      const builder: any = {
        update(values: any) {
          call.values = values;
          return builder;
        },
        eq(col: string, val: any) {
          call.eqCol = col;
          call.eqVal = val;
          updateCalls.push(call);
          return Promise.resolve({ error: updateError });
        },
      };
      return builder;
    },
  };
}

vi.mock("../../supabase-auth.js", () => ({
  supabaseAdmin: makeSupabaseStub(),
  requireAuth: (_req: any, _res: any, next: any) => next(),
}));

// Avoid constructing a real Mux client at import time.
vi.mock("@mux/mux-node", () => ({
  default: class {
    video = {};
    webhooks = { verifySignature: vi.fn() };
  },
}));

function makeVideo(asset: any) {
  return {
    assets: {
      retrieve: vi.fn().mockResolvedValue(asset),
    },
  } as any;
}

describe("applyMuxWebhookEvent", () => {
  beforeEach(() => {
    updateCalls.length = 0;
    updateError = null;
  });

  it("video.asset.ready writes completed status + mux fields by mux_asset_id", async () => {
    const { applyMuxWebhookEvent } = await import("../mux.js");
    const video = makeVideo({
      id: "asset-1",
      playback_ids: [{ id: "pb-123" }],
      duration: 12.6,
    });

    await applyMuxWebhookEvent(
      { type: "video.asset.ready", data: { id: "asset-1" } },
      video,
    );

    expect(updateCalls).toHaveLength(1);
    const call = updateCalls[0];
    expect(call.table).toBe("publications");
    expect(call.eqCol).toBe("mux_asset_id");
    expect(call.eqVal).toBe("asset-1");
    expect(call.values).toMatchObject({
      mux_playback_id: "pb-123",
      media_url: "https://stream.mux.com/pb-123.m3u8",
      hls_url: "https://stream.mux.com/pb-123.m3u8",
      thumbnail_url: "https://image.mux.com/pb-123/thumbnail.jpg",
      duration: 13,
      processing_status: "completed",
    });
    expect(call.values.enhance_finished_at).toBeTruthy();
  });

  it("video.asset.ready with no playback id does not write", async () => {
    const { applyMuxWebhookEvent } = await import("../mux.js");
    const video = makeVideo({ id: "asset-2", playback_ids: [] });

    await applyMuxWebhookEvent(
      { type: "video.asset.ready", data: { id: "asset-2" } },
      video,
    );

    expect(updateCalls).toHaveLength(0);
  });

  it("video.asset.errored flips processing_status to failed", async () => {
    const { applyMuxWebhookEvent } = await import("../mux.js");

    await applyMuxWebhookEvent(
      { type: "video.asset.errored", data: { id: "asset-3" } },
      makeVideo({}),
    );

    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].table).toBe("publications");
    expect(updateCalls[0].eqCol).toBe("mux_asset_id");
    expect(updateCalls[0].eqVal).toBe("asset-3");
    expect(updateCalls[0].values).toEqual({ processing_status: "failed" });
  });

  it("video.asset.created is a no-op write", async () => {
    const { applyMuxWebhookEvent } = await import("../mux.js");

    await applyMuxWebhookEvent(
      { type: "video.asset.created", data: { id: "asset-4" } },
      makeVideo({}),
    );

    expect(updateCalls).toHaveLength(0);
  });

  it("surfaces a Supabase update error as a thrown error", async () => {
    const { applyMuxWebhookEvent } = await import("../mux.js");
    updateError = { message: "boom" };

    await expect(
      applyMuxWebhookEvent(
        { type: "video.asset.errored", data: { id: "asset-5" } },
        makeVideo({}),
      ),
    ).rejects.toThrow(/boom/);
  });
});
