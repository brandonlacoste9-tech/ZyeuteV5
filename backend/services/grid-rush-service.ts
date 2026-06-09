import pg from "pg";
import { db } from "../storage.js";
import { gridRushMatches } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "../supabase-auth.js";

type PgQueryable = Pick<pg.Client, "query">;

export const GRID_RUSH_DURATION_SEC = 45;
export const ALLOWED_STAKES = [100, 250, 500] as const;
export const DEFAULT_WALLET_TOKENS = 1000;
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

function createDirectClient(): pg.Client {
  return new pg.Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
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

// ─── Bot opponent ─────────────────────────────────────────────────────────────
const BOT_MIN_TICK_MS = 6000;
const BOT_MAX_TICK_MS = 10000;
const botTimers = new Map<string, NodeJS.Timeout>();

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
        botTimers.delete(matchId);
        cleanScoreRateLimit(matchId);
        await GridRushService.finishMatch(player1Id, matchId).catch(() => {});
        return;
      }

      await queryDirect(
        `UPDATE grid_rush_matches
         SET player_2_score = player_2_score + 1, updated_at = NOW()
         WHERE id = $1 AND status = 'ACTIVE'`,
        [matchId],
      );
      scheduleBotTick(matchId, endsAt, player1Id);
    } catch {
      botTimers.delete(matchId);
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
    const result = await queryDirect(
      `SELECT id, ends_at, player_1_id
       FROM grid_rush_matches
       WHERE status = 'ACTIVE' AND is_bot = true`,
    );

    for (const row of result.rows) {
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

    if (result.rows.length > 0) {
      console.log(
        `[GridRush] Recovered ${result.rows.length} active bot match(es) after restart.`,
      );
    }
  } catch (err) {
    console.warn("[GridRush] Bot match recovery failed:", err);
  }
}

export class GridRushService {
  static async getMatch(matchId: string): Promise<GridRushMatch | null> {
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
      const { data: existing } = await supabaseAdmin
        .from("user_wallets")
        .select("token_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) return Number(existing.token_balance);

      const { error: insertErr } = await supabaseAdmin
        .from("user_wallets")
        .insert({ user_id: userId, token_balance: DEFAULT_WALLET_TOKENS });
      if (insertErr && insertErr.code !== "23505") throw insertErr;
      return DEFAULT_WALLET_TOKENS;
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
    stakeTokens: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeTokens);

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin.rpc(
        "grid_rush_create_bot_match",
        { p_stake: stake, p_user_id: userId },
      );
      if (error) throw new Error(error.message);
      const row = (Array.isArray(data) ? data[0] : data) as Record<
        string,
        unknown
      >;
      const match = mapRow(row);
      scheduleBotTick(
        match.id,
        match.endsAt ?? new Date(Date.now() + GRID_RUSH_DURATION_SEC * 1000),
        userId,
      );
      return match;
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + GRID_RUSH_DURATION_SEC * 1000);

    const match = await withTx(async (client) => {
      await deductTokens(client, userId, stake);

      const created = await client.query(
        `INSERT INTO grid_rush_matches
           (player_1_id, stake_tokens, status, is_bot, started_at, ends_at)
         VALUES ($1, $2, 'ACTIVE', true, $3, $4)
         RETURNING *`,
        [userId, stake, now, endsAt],
      );
      return mapRow(created.rows[0]);
    });

    scheduleBotTick(match.id, endsAt, userId);
    return match;
  }

  static async createInvite(
    userId: string,
    stakeTokens: number,
  ): Promise<GridRushMatch> {
    const stake = assertStake(stakeTokens);

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

      if (match.ends_at && new Date(match.ends_at) > now) {
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

      if (winnerId) {
        await creditTokens(client, winnerId, match.stake_tokens * 2);
      } else if (isTie) {
        await creditTokens(client, match.player_1_id, match.stake_tokens);
        if (match.player_2_id) {
          await creditTokens(client, match.player_2_id, match.stake_tokens);
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
    isBot: Boolean(row.is_bot ?? row.isBot ?? false),
    winnerId: (row.winner_id as string) ?? null,
    startedAt: row.started_at ? new Date(row.started_at as string) : null,
    endsAt: row.ends_at ? new Date(row.ends_at as string) : null,
    createdAt: new Date((row.created_at ?? row.createdAt) as string),
    updatedAt: new Date((row.updated_at ?? row.updatedAt) as string),
  };
}
