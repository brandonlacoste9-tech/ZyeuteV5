/**
 * Startup migration list — single source of truth.
 * All files are idempotent (IF NOT EXISTS / safe guards) and live in
 * backend/migrations/. Run on every boot and re-runnable via
 * POST /api/seed/migrations.
 */
export const STARTUP_MIGRATIONS = [
  "20260202_add_hls_url.sql",
  "20260221_video_playback_schema.sql",
  "20260224_add_type_column.sql",
  "20260225_bulk_repair_videos.sql",
  "20260608_gifts_nullable_post_id.sql",
  "20260608_grid_rush_matches.sql",
  "20260608_grid_rush_tokens.sql",
  "20260608_grid_rush_bot.sql",
  "20260608_grid_rush_rpc.sql",
  "20260608_grid_rush_rpc_harden.sql",
  "20260608_grid_rush_rpc_postgrest_sig.sql",
  "20260608_grid_rush_rpc_wallet_update.sql",
  "20260608_poutine_royale.sql",
  "20260609_grid_rush_rpc_perform_lock.sql",
  "20260609_poutine_royale_harden.sql",
  "20260609_quiz_daily.sql",
  "20260610_grid_rush_is_bot_column.sql",
  "20260610_carte_sucree_completions.sql",
  "20260617_add_bounty_columns.sql",
];
