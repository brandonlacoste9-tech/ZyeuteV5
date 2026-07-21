import dotenv from "dotenv";
dotenv.config({ path: ".env.local", override: true });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) {
    console.error("Missing Supabase URL/key");
    process.exit(1);
  }
  const sb = createClient(url, key);

  const base = () =>
    sb
      .from("publications")
      .select("id", { count: "exact", head: true })
      .eq("visibility", "public")
      .is("deleted_at", null);

  const { count: pub } = await base();
  const { count: tiktok } = await base().eq("video_source", "tiktok");
  const { count: mux } = await base().not("mux_playback_id", "is", null);
  const { count: playable } = await base()
    .not("media_url", "is", null)
    .or(
      "mux_playback_id.not.is.null,media_url.ilike.%mux.com%,media_url.ilike.%supabase.co%",
    );

  console.log(
    JSON.stringify(
      {
        public: pub ?? 0,
        video_source_tiktok: tiktok ?? 0,
        with_mux: mux ?? 0,
        playable_ish: playable ?? 0,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
