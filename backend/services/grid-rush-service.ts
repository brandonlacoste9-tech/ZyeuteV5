import type pg from "pg";
import { db } from "../storage.js";
import { gridRushMatches } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "../supabase-auth.js";
import { createDirectClient, type PgQueryable } from "../db-direct.js";
import {
  creditTokenBalance,
  deductTokenBalance,
  ensurePlayableTokenBalance,
} from "../supabase-arcade-db.js";

export const GRID_RUSH_DURATION_SEC = 45;
export const ALLOWED_STAKES = [100, 250, 500] as const;
export const DEFAULT_WALLET_TOKENS = 1000;
/** Bot practice matches never touch the wallet. */
export const BOT_PRACTICE_STAKE = 0;
// Minimum seconds between score submissions (tapping 1→16 at world-record speed ~3s)
const MIN_SCORE_INTERVAL_MS = 2800;

export type StakeTokens = (typeof ALLOWED_STAKES)[number];
export type GridRushMatch = typeof gridRushMatches.$inferSelect;

const INSUFFICIENT_TOKENS =
  "Pas assez de jetons! Tu repartiras avec 1000 jetons gratuits.";

// ─── Per-match score rate limiting ───────────────────────────────────────────
// matchId → Map<userId, lastSubmitTimestamp>
const lastScoreSubmit = new Map<string, Map<string, number>>();

function checkScoreRateLimit(matchId: string, userId: string): void {
  if (!lastScoreSubmit.has(matchId)) {
    lastScoreSubmit.set(matchId, new Map());
  }
  const matchMap = lastScoreSubmit.get(matchId)!;
  const last = matchMap.get(userId) ?? 0;
  const now = Date.now();
  if (now - last < MIN_SCORE_INTERVAL_MS) {
    throw new Error("Trop rapide! Attends avant de soumettre un autre score.");
  }
  matchMap.set(userId, now);
}

function cleanScoreRateLimit(matchId: string): void {
  lastScoreSubmit.delete(matchId);
}

function assertStake(stake: number): StakeTokens {
  if (!ALLOWED_STAKES.includes(stake as StakeTokens)) {
    throw new Error(
      `Mise invalide. Choix: ${ALLOWED_STAKES.join(", ")} jetons`,
    );
  }
  return stake as StakeTokens;
}

async function createBotMatchDirect(userId: string): Promise<GridRushMatch> {
  const now = new Date();
  const endsAt = new Date(now.getTime() + GRID_RUSH_DURATION_SEC * 1000);

  const match = await withTx(async (client) => {
    const created = await client.query(
      `INSERT INTO grid_rush_matches
         (player_1_id, stake_tokens, status, is_bot, started_at, ends_at)
       VALUES ($1, $2, 'ACTIVE', true, $3, $4)
       RETURNING *`,
      [userId, BOT_PRACTICE_STAKE, now, endsAt],
    );
    return mapRow(created.rows[0]);
  });

  scheduleBotTick(match.id, endsAt, userId);
  return match;
}

async function withTx<T>(fn: (client: PgQueryable) => Promise<T>): Promise<T> {
  const client = createDirectClient();
  await client.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function queryDirect(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult> {
  const client = createDirectClient();
  await client.connect();
  try {
    return await client.query(text, params);
  } finally {
    await client.end().catch(() => {});
  }
}

async function ensureWallet(
  client: PgQueryable,
  userId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO user_wallets (user_id, token_balance)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, DEFAULT_WALLET_TOKENS],
  );
}

async function lockWalletRow(
  client: PgQueryable,
  userId: string,
): Promise<void> {
  await ensureWallet(client, userId);
  const locked = await client.query(
    `SELECT user_id FROM user_wallets WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );
  if (!locked.rows.length) {
    throw new Error("Portefeuille introuvable — contacte le support.");
  }
}

async function deductTokens(
  client: PgQueryable,
  userId: string,
  amount: number,
): Promise<void> {
  await lockWalletRow(client, userId);
  const result = await client.query(
    `UPDATE user_wallets
     SET token_balance = token_balance - $1, updated_at = NOW()
     WHERE user_id = $2 AND token_balance >= $1
     RETURNING user_id`,
    [amount, userId],
  );
  if (!result.rows.length) {
    throw new Error(INSUFFICIENT_TOKENS);
  }
}

async function creditTokens(
  client: PgQueryable,
  userId: string,
  amount: number,
): Promise<void> {
  await lockWalletRow(client, userId);
  await client.query(
    `UPDATE user_wallets
     SET token_balance = token_balance + $1, updated_at = NOW()
     WHERE user_id = $2`,
    [amount, userId],
  );
}

function activateMatch(now: Date) {
  const endsAt = new Date(now.getTime() + GRID_RUSH_DURATION_SEC * 1000);
  return { startedAt: now, endsAt, status: "ACTIVE" as const };
}

/** Explicit columns — prod may lack is_bot; PostgREST rejects select("*") when cache is stale. */
const GRID_RUSH_MATCH_COLUMNS =
  "id, status, player_1_id, player_2_id, player_1_score, player_2_score, stake_cennes, stake_tokens, winner_id, started_at, ends_at, created_at, updated_at";

type MatchRow = Record<string, unknown>;

function inferIsBot(row: Record<string, unknown>): boolean {
  if (row.is_bot != null || row.isBot != null) {
    return Boolean(row.is_bot ?? row.isBot);
  }
  return (
    row.status === "ACTIVE" &&
    (row.player_2_id == null || row.player2Id == null) &&
    (row.started_at != null || row.startedAt != null)
  );
}

async function fetchMatchRow(matchId: string): Promise<MatchRow | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin
    .from("grid_rush_matches")
    .select(GRID_RUSH_MATCH_COLUMNS)
    .eq("id", matchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Close blocking ACTIVE matches so the per-player unique index does not block replays. */
async function cleanupBlockingMatchesForUser(
  userId: string,
  opts?: { forceSoloBot?: boolean },
): Promise<void> {
  if (!supabaseAdmin) return;

  const nowIso = new Date().toISOString();

  const { data: expired, error: expiredErr } = await supabaseAdmin
    .from("grid_rush_matches")
    .select("id, player_1_id")
    .eq("status", "ACTIVE")
    .lt("ends_at", nowIso)
    .or(`player_1_id.eq.${userId},player_2_id.eq.${userId}`);
  if (expiredErr) throw new Error(expiredErr.message);

  for (const row of expired ?? []) {
    const finisherId = (row.player_1_id as string) ?? userId;
    await finishMatchAdmin(finisherId, row.id as string, { force: true }).catch(
      (err) => {
        console.warn("[GridRush] expired match cleanup failed:", row.id, err);
      },
    );
  }

  if (!opts?.forceSoloBot) return;

  const { data: soloBots, error: botErr } = await supabaseAdmin
    .from("grid_rush_matches")
    .select("id")
    .eq("status", "ACTIVE")
    .eq("player_1_id", userId)
    .is("player_2_id", null)
    .not("started_at", "is", null);
  if (botErr) throw new Error(botErr.message);

  for (const row of soloBots ?? []) {
    const finished = await finishMatchAdmin(userId, row.id as string, {
      force: true,
    }).catch((err) => {
      console.warn("[GridRush] solo bot cleanup failed:", row.id, err);
      return null;
    });
    if (!finished && supabaseAdmin) {
      clearBotTimer(row.id as string);
      await supabaseAdmin
        .from("grid_rush_matches")
        .update({
          status: "COMPLETED",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id as string)
        .eq("status", "ACTIVE");
    }
  }
}

async function createBotMatchAdmin(userId: string): Promise<GridRushMatch> {
  await cleanupBlockingMatchesForUser(userId, { forceSoloBot: true });

  const now = new Date();
  const endsAt = new Date(now.getTime() + GRID_RUSH_DURATION_SEC * 1000);

  const { data, error } = await supabaseAdmin!
    .from("grid_rush_matches")
    .insert({
      player_1_id: userId,
      stake_tokens: BOT_PRACTICE_STAKE,
      stake_cennes: BOT_PRACTICE_STAKE,
      status: "ACTIVE",
      started_at: now.toISOString(),
      ends_at: endsAt.toISOString(),
    })
    .select(GRID_RUSH_MATCH_COLUMNS)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error(
        "Tu as déjà une manche en cours. Attends la fin ou réessaie dans un instant.",
      );
    }
    throw new Error(error.message);
  }

  const match = mapRow({ ...data, is_bot: true });
  scheduleBotTick(match.id, endsAt, userId);
  return match;
}

async function incrementBotScoreAdmin(matchId: string): Promise<void> {
  if (!supabaseAdmin) return;
  const match = await fetchMatchRow(matchId);
  if (!match || match.status !== "ACTIVE") return;
  await supabaseAdmin!
    .from("grid_rush_matches")
    .update({
      player_2_score: Number(match.player_2_score ?? 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .eq("status", "ACTIVE");
}

async function incrementScoreAdmin(
  userId: string,
  matchId: string,
): Promise<GridRushMatch> {
  const match = await fetchMatchRow(matchId);
  if (!match) throw new Error("Partie introuvable");
  if (match.player_1_id !== userId && match.player_2_id !== userId) {
    throw new Error("Tu n'es pas dans cette partie");
  }
  if (match.status !== "ACTIVE") throw new Error("La partie n'est pas active");
  if (match.ends_at && new Date(match.ends_at as string) <= new Date()) {
    throw new Error("Le temps est écoulé");
  }

  const isPlayer1 = match.player_1_id === userId;
  const updatePayload = isPlayer1
    ? {
        player_1_score: Number(match.player_1_score ?? 0) + 1,
        updated_at: new Date().toISOString(),
      }
    : {
        player_2_score: Number(match.player_2_score ?? 0) + 1,
        updated_at: new Date().toISOString(),
      };

  const { data, error } = await supabaseAdmin!
    .from("grid_rush_matches")
    .update(updatePayload)
    .eq("id", matchId)
    .eq("status", "ACTIVE")
    .select(GRID_RUSH_MATCH_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Le temps est écoulé");
  return mapRow(data);
}

async function finishMatchAdmin(
  userId: string,
  matchId: string,
  opts?: { force?: boolean },
): Promise<GridRushMatch> {
  const now = new Date();
  const match = await fetchMatchRow(matchId);
  if (!match) throw new Error("Partie introuvable");
  if (match.status === "COMPLETED") return mapRow(match);
  if (match.status !== "ACTIVE") {
    throw new Error("La partie ne peut pas être terminée");
  }
  if (match.player_1_id !== userId && match.player_2_id !== userId) {
    throw new Error("Tu n'es pas dans cette partie");
  }
  const endsMs = match.ends_at
    ? new Date(match.ends_at as string).getTime()
    : 0;
  if (!opts?.force && endsMs > now.getTime() + 1500) {
    throw new Error("La partie n'est pas encore terminée");
  }

  clearBotTimer(matchId);

  const p1Score = Number(match.player_1_score ?? 0);
  const p2Score = Number(match.player_2_score ?? 0);
  let winnerId: string | null = null;
  if (p1Score > p2Score) winnerId = match.player_1_id as string;
  else if (p2Score > p1Score) winnerId = match.player_2_id as string | null;

  const { data: updated, error } = await supabaseAdmin!
    .from("grid_rush_matches")
    .update({
      status: "COMPLETED",
      winner_id: winnerId,
      updated_at: now.toISOString(),
    })
    .eq("id", matchId)
    .select(GRID_RUSH_MATCH_COLUMNS)
    .single();
  if (error) throw new Error(error.message);

  const stake = Number(match.stake_tokens ?? 0);
  if (stake > 0) {
    if (winnerId) {
      await creditTokenBalance(winnerId, stake * 2);
    } else if (p1Score === p2Score) {
      await creditTokenBalance(match.player_1_id as string, stake);
      if (match.player_2_id) {
        await creditTokenBalance(match.player_2_id as string, stake);
      }
    }
  }

  cleanScoreRateLimit(matchId);
  return mapRow(updated);
}

async function createInviteAdmin(
  userId: string,
  stake: StakeTokens,
): Promise<GridRushMatch> {
  await cleanupBlockingMatchesForUser(userId, { forceSoloBot: true });
  await deductTokenBalance(userId, stake);
  const { data, error } = await supabaseAdmin!
    .from("grid_rush_matches")
    .insert({
      player_1_id: userId,
      stake_tokens: stake,
      stake_cennes: stake,
      status: "WAITING",
    })
    .select(GRID_RUSH_MATCH_COLUMNS)
    .single();
  if (error) {
    await creditTokenBalance(userId, stake).catch(() => {});
    throw new Error(error.message);
  }
  return mapRow(data);
}

async function quickMatchAdmin(
  userId: string,
  stake: StakeTokens,
): Promise<GridRushMatch> {
  await cleanupBlockingMatchesForUser(userId, { forceSoloBot: true });
  const now = new Date();
  const { data: waiting } = await supabaseAdmin!
    .from("grid_rush_matches")
    .select(GRID_RUSH_MATCH_COLUMNS)
    .eq("status", "WAITING")
    .is("player_2_id", null)
    .eq("stake_tokens", stake)
    .neq("player_1_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (waiting) {
    const { startedAt, endsAt, status } = activateMatch(now);
    const { data: joined, error } = await supabaseAdmin!
      .from("grid_rush_matches")
      .update({
        player_2_id: userId,
        status,
        started_at: startedAt.toISOString(),
        ends_at: endsAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", waiting.id)
      .eq("status", "WAITING")
      .is("player_2_id", null)
      .select(GRID_RUSH_MATCH_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (joined) {
      await deductTokenBalance(userId, stake);
      return mapRow(joined);
    }
  }

  await deductTokenBalance(userId, stake);
  const { data: created, error: createErr } = await supabaseAdmin!
    .from("grid_rush_matches")
    .insert({
      player_1_id: userId,
      stake_tokens: stake,
      stake_cennes: stake,
      status: "WAITING",
    })
    .select(GRID_RUSH_MATCH_COLUMNS)
    .single();
  if (createErr) {
    await creditTokenBalance(userId, stake).catch(() => {});
    throw new Error(createErr.message);
  }
  return mapRow(created);
}

async function joinMatchAdmin(
  userId: string,
  matchId: string,
): Promise<GridRushMatch> {
  const now = new Date();
  const match = await fetchMatchRow(matchId);
  if (!match) throw new Error("Partie introuvable");
  if (match.status !== "WAITING") {
    throw new Error("Cette partie n'est plus disponible");
  }
  if (match.player_2_id) throw new Error("Cette partie est déjà pleine");
  if (match.player_1_id === userId) {
    throw new Error("Tu ne peux pas rejoindre ta propre partie");
  }

  const { startedAt, endsAt, status } = activateMatch(now);
  const { data, error } = await supabaseAdmin!
    .from("grid_rush_matches")
    .update({
      player_2_id: userId,
      status,
      started_at: startedAt.toISOString(),
      ends_at: endsAt.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", matchId)
    .eq("status", "WAITING")
    .is("player_2_id", null)
    .select(GRID_RUSH_MATCH_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  await deductTokenBalance(userId, Number(match.stake_tokens ?? 0));
  return mapRow(data);
}

async function cancelMatchAdmin(
  userId: string,
  matchId: string,
): Promise<GridRushMatch> {
  const match = await fetchMatchRow(matchId);
  if (!match) throw new Error("Partie introuvable");
  if (match.player_1_id !== userId) {
    throw new Error("Seul l'hôte peut annuler");
  }
  if (match.status !== "WAITING" || match.player_2_id) {
    throw new Error("Cette partie ne peut pas être annulée");
  }
  const createdAt = new Date(match.created_at as string);
  if (Date.now() - createdAt.getTime() > 5 * 60 * 1000) {
    throw new Error(
      "Invitation expirée (plus de 5 minutes). Crée une nouvelle partie.",
    );
  }

  await creditTokenBalance(userId, Number(match.stake_tokens ?? 0));
  const { data, error } = await supabaseAdmin!
    .from("grid_rush_matches")
    .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
    .eq("id", matchId)
    .select(GRID_RUSH_MATCH_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data);
}

// ─── Bot opponent ─────────────────────────────────────────────────────────────
const BOT_MIN_TICK_MS = 6000;
const BOT_MAX_TICK_MS = 10000;
const botTimers = new Map<string, NodeJS.Timeout>();

function clearBotTimer(matchId: string): void {
  const timer = botTimers.get(matchId);
  if (timer) {
    clearTimeout(timer);
    botTimers.delete(matchId);
  }
}

function scheduleBotTick(
  matchId: string,
  endsAt: Date,
  player1Id: string,
): void {
  const delay =
    BOT_MIN_TICK_MS + Math.random() * (BOT_MAX_TICK_MS - BOT_MIN_TICK_MS);

  const timer = setTimeout(async () => {
    try {
      if (Date.now() >= endsAt.getTime()) {
        clearBotTimer(matchId);
        cleanScoreRateLimit(matchId);
        await GridRushService.finishMatch(player1Id, matchId).catch(() => {});
        return;
      }

      if (supabaseAdmin) {
        await incrementBotScoreAdmin(matchId);
      } else {
        await queryDirect(
          `UPDATE grid_rush_matches
           SET player_2_score = player_2_score + 1, updated_at = NOW()
           WHERE id = $1 AND status = 'ACTIVE'`,
          [matchId],
        );
      }
      scheduleBotTick(matchId, endsAt, player1Id);
    } catch {
      clearBotTimer(matchId);
    }
  }, delay);

  botTimers.set(matchId, timer);
}

/**
 * On server startup: find all ACTIVE bot matches and either finish them
 * (if time already expired) or reschedule the bot tick (if still running).
 * Prevents matches from hanging forever after a server restart.
 */
export async function recoverBotMatches(): Promise<void> {
  try {
    let rows: Array<{ id: string; ends_at: string; player_1_id: string }> = [];

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from("grid_rush_matches")
        .select("id, ends_at, player_1_id")
        .eq("status", "ACTIVE")
        .is("player_2_id", null)
        .not("started_at", "is", null);
      if (error) throw error;
      rows = (data ?? []) as typeof rows;
    } else {
      const result = await queryDirect(
        `SELECT id, ends_at, player_1_id
         FROM grid_rush_matches
         WHERE status = 'ACTIVE' AND is_bot = true`,
      );
      rows = result.rows as typeof rows;
    }

    for (const row of rows) {
      const matchId = row.id as string;
      const endsAt = new Date(row.ends_at as string);
      const player1Id = row.player_1_id as string;

      if (Date.now() >= endsAt.getTime()) {
        // Already expired — finish immediately
        GridRushService.finishMatch(player1Id, matchId).catch(() => {});
      } else {
        // Still running — reschedule bot
        scheduleBotTick(matchId, endsAt, player1Id);
      }
    }

    if (rows.length > 0) {
      console.log(
        `[GridRush] Recovered ${rows.length} active bot match(es) after restart.`,
      );
    }
  } catch (err) {
    console.warn("[GridRush] Bot match recovery failed:", err);
  }
}

export class GridRushService {
  static async getMatch(matchId: string): Promise<GridRushMatch | null> {
    if (supabaseAdmin) {
      const row = await fetchMatchRow(matchId);
      return row ? mapRow(row) : null;
    }

    const [match] = await db
      .select()
      .from(gridRushMatches)
      .where(eq(gridRushMatches.id, matchId))
      .limit(1);
    return match ?? null;
  }

  static async quickMatch(
    userId: string,
    stakeTokens: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeTokens);
    if (supabaseAdmin) {
      return quickMatchAdmin(userId, stake);
    }

    const now = new Date();

    return withTx(async (client) => {
      const waiting = await client.query<{
        id: string;
        player_1_id: string;
        stake_tokens: number;
      }>(
        `SELECT id, player_1_id, stake_tokens
         FROM grid_rush_matches
         WHERE status = 'WAITING'
           AND player_2_id IS NULL
           AND stake_tokens = $1
           AND player_1_id != $2
         ORDER BY created_at ASC
         LIMIT 1
         FOR UPDATE SKIP LOCKED`,
        [stake, userId],
      );

      if (waiting.rows.length > 0) {
        const row = waiting.rows[0];
        await deductTokens(client, userId, stake);

        const { startedAt, endsAt, status } = activateMatch(now);
        const updated = await client.query(
          `UPDATE grid_rush_matches
           SET player_2_id = $1,
               status = $2,
               started_at = $3,
               ends_at = $4,
               updated_at = NOW()
           WHERE id = $5
           RETURNING *`,
          [userId, status, startedAt, endsAt, row.id],
        );
        return mapRow(updated.rows[0]);
      }

      await deductTokens(client, userId, stake);

      const created = await client.query(
        `INSERT INTO grid_rush_matches (player_1_id, stake_tokens, status)
         VALUES ($1, $2, 'WAITING')
         RETURNING *`,
        [userId, stake],
      );
      return mapRow(created.rows[0]);
    });
  }

  static async getWalletBalance(userId: string): Promise<number> {
    if (supabaseAdmin) {
      return ensurePlayableTokenBalance(userId, ALLOWED_STAKES[0]);
    }

    await queryDirect(
      `INSERT INTO user_wallets (user_id, token_balance)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, DEFAULT_WALLET_TOKENS],
    );
    const result = await queryDirect(
      `SELECT token_balance FROM user_wallets WHERE user_id = $1`,
      [userId],
    );
    const row = result.rows[0] as { token_balance?: number } | undefined;
    return Number(row?.token_balance ?? DEFAULT_WALLET_TOKENS);
  }

  static async createBotMatch(
    userId: string,
    _stakeTokens?: number,
  ): Promise<GridRushMatch> {
    if (supabaseAdmin) {
      return createBotMatchAdmin(userId);
    }

    return createBotMatchDirect(userId);
  }

  static async createInvite(
    userId: string,
    stakeTokens: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeTokens);
    if (supabaseAdmin) {
      return createInviteAdmin(userId, stake);
    }

    return withTx(async (client) => {
      await deductTokens(client, userId, stake);

      const created = await client.query(
        `INSERT INTO grid_rush_matches (player_1_id, stake_tokens, status)
         VALUES ($1, $2, 'WAITING')
         RETURNING *`,
        [userId, stake],
      );
      return mapRow(created.rows[0]);
    });
  }

  static async joinMatch(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    if (supabaseAdmin) {
      return joinMatchAdmin(userId, matchId);
    }

    const now = new Date();

    return withTx(async (client) => {
      const sel = await client.query(
        `SELECT * FROM grid_rush_matches WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [matchId],
      );
      const match = sel.rows[0];

      if (!match) throw new Error("Partie introuvable");
      if (match.status !== "WAITING")
        throw new Error("Cette partie n'est plus disponible");
      if (match.player_2_id) throw new Error("Cette partie est déjà pleine");
      if (match.player_1_id === userId) {
        throw new Error("Tu ne peux pas rejoindre ta propre partie");
      }

      await deductTokens(client, userId, match.stake_tokens);

      const { startedAt, endsAt, status } = activateMatch(now);
      const updated = await client.query(
        `UPDATE grid_rush_matches
         SET player_2_id = $1, status = $2, started_at = $3, ends_at = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [userId, status, startedAt, endsAt, matchId],
      );
      return mapRow(updated.rows[0]);
    });
  }

  static async incrementScore(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    // Rate limit: one completed grid takes at least ~3s even for a fast player
    checkScoreRateLimit(matchId, userId);

    if (supabaseAdmin) {
      return incrementScoreAdmin(userId, matchId);
    }

    const result = await queryDirect(
      `UPDATE grid_rush_matches
       SET player_1_score = player_1_score + (CASE WHEN player_1_id = $1 THEN 1 ELSE 0 END),
           player_2_score = player_2_score + (CASE WHEN player_2_id = $1 THEN 1 ELSE 0 END),
           updated_at = NOW()
       WHERE id = $2
         AND status = 'ACTIVE'
         AND ends_at > NOW()
         AND (player_1_id = $1 OR player_2_id = $1)
       RETURNING *`,
      [userId, matchId],
    );

    if (result.rows.length) {
      return mapRow(result.rows[0]);
    }

    const cur = await queryDirect(
      `SELECT status, ends_at, player_1_id, player_2_id
       FROM grid_rush_matches WHERE id = $1 LIMIT 1`,
      [matchId],
    );
    const m = cur.rows[0];
    if (!m) throw new Error("Partie introuvable");
    if (m.player_1_id !== userId && m.player_2_id !== userId) {
      throw new Error("Tu n'es pas dans cette partie");
    }
    if (m.status !== "ACTIVE") throw new Error("La partie n'est pas active");
    throw new Error("Le temps est écoulé");
  }

  static async finishMatch(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    if (supabaseAdmin) {
      return finishMatchAdmin(userId, matchId);
    }

    const now = new Date();

    return withTx(async (client) => {
      const sel = await client.query(
        `SELECT * FROM grid_rush_matches WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [matchId],
      );
      const match = sel.rows[0];

      if (!match) throw new Error("Partie introuvable");
      if (match.status === "COMPLETED") return mapRow(match);
      if (match.status !== "ACTIVE") {
        throw new Error("La partie ne peut pas être terminée");
      }

      const isParticipant =
        match.player_1_id === userId || match.player_2_id === userId;
      if (!isParticipant) throw new Error("Tu n'es pas dans cette partie");

      const endsMs = match.ends_at
        ? new Date(match.ends_at as string).getTime()
        : 0;
      if (endsMs > now.getTime() + 1500) {
        throw new Error("La partie n'est pas encore terminée");
      }

      let winnerId: string | null = null;
      if (match.player_1_score > match.player_2_score) {
        winnerId = match.player_1_id;
      } else if (match.player_2_score > match.player_1_score) {
        winnerId = match.player_2_id;
      }
      const isTie = match.player_1_score === match.player_2_score;

      const updated = await client.query(
        `UPDATE grid_rush_matches
         SET status = 'COMPLETED', winner_id = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [winnerId, matchId],
      );

      if (Number(match.stake_tokens ?? 0) > 0) {
        if (winnerId) {
          await creditTokens(client, winnerId, match.stake_tokens * 2);
        } else if (isTie) {
          await creditTokens(client, match.player_1_id, match.stake_tokens);
          if (match.player_2_id) {
            await creditTokens(client, match.player_2_id, match.stake_tokens);
          }
        }
      }

      cleanScoreRateLimit(matchId);
      return mapRow(updated.rows[0]);
    });
  }

  static async cancelMatch(
    userId: string,
    matchId: string,
  ): Promise<GridRushMatch> {
    if (supabaseAdmin) {
      return cancelMatchAdmin(userId, matchId);
    }

    return withTx(async (client) => {
      const sel = await client.query(
        `SELECT * FROM grid_rush_matches WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [matchId],
      );
      const match = sel.rows[0];

      if (!match) throw new Error("Partie introuvable");
      if (match.player_1_id !== userId) {
        throw new Error("Seul l'hôte peut annuler");
      }
      if (match.status !== "WAITING" || match.player_2_id) {
        throw new Error("Cette partie ne peut pas être annulée");
      }

      const createdAt = new Date(match.created_at as string);
      const ageMs = Date.now() - createdAt.getTime();
      if (ageMs > 5 * 60 * 1000) {
        throw new Error(
          "Invitation expirée (plus de 5 minutes). Crée une nouvelle partie.",
        );
      }

      await creditTokens(client, userId, match.stake_tokens);

      const updated = await client.query(
        `UPDATE grid_rush_matches
         SET status = 'CANCELLED', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [matchId],
      );
      return mapRow(updated.rows[0]);
    });
  }
}

function mapRow(row: Record<string, unknown>): GridRushMatch {
  return {
    id: row.id as string,
    status: row.status as GridRushMatch["status"],
    player1Id: row.player_1_id as string,
    player2Id: (row.player_2_id as string) ?? null,
    player1Score: Number(row.player_1_score ?? 0),
    player2Score: Number(row.player_2_score ?? 0),
    stakeCennes: Number(row.stake_cennes ?? row.stakeCennes ?? 500),
    stakeTokens: Number(row.stake_tokens ?? row.stakeTokens ?? 500),
    isBot: inferIsBot(row),
    winnerId: (row.winner_id as string) ?? null,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    endsAt: row.ends_at ? new Date(row.ends_at as string) : null,
    createdAt: new Date((row.created_at ?? row.createdAt) as string),
    updatedAt: new Date((row.updated_at ?? row.updatedAt) as string),
  };
}
