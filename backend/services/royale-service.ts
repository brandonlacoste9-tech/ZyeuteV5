import { db } from "../storage.js";
import { royaleScores, users } from "../../shared/schema.js";
import { eq, desc, and, sql } from "drizzle-orm";
import { supabaseAdmin } from "../supabase-auth.js";
import { createDirectClient, type PgQueryable } from "../db-direct.js";
import {
  creditTokenBalance,
  fetchProfilesByIds,
  getTokenBalance,
} from "../supabase-arcade-db.js";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  layers: number;
  submittedAt: string;
}

export interface TournamentWithStats {
  id: string;
  title: string;
  entryFee: number;
  prizePool: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  entryCount: number;
  topScore: number | null;
  timeRemainingMs: number;
}

const DAILY_ENTRY_FEE = 0; // Free to play — rewards are "GG gifts", not buy-ins
const DAILY_PRIZE_POOL = 0;
const DEFAULT_WALLET_TOKENS = 1000;

// Virtual-token "GG gift" awarded when a player sets a NEW personal best for the
// day. Play-Store-compliant framing: a celebratory gift, never a cash payout.
// Scales with score so better stacks feel rewarding, capped to avoid inflation.
const REWARD_PER_POINT = 5;
const MAX_REWARD = 200;

export function computeReward(score: number): number {
  if (score <= 0) return 0;
  return Math.min(score * REWARD_PER_POINT, MAX_REWARD);
}

// ─── Direct-client helpers (Supabase pooler rejects Drizzle db.transaction) ───
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

async function lockWalletRow(
  client: PgQueryable,
  userId: string,
): Promise<void> {
  await client.query(
    `INSERT INTO user_wallets (user_id, token_balance)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, DEFAULT_WALLET_TOKENS],
  );
  const locked = await client.query(
    `SELECT user_id FROM user_wallets WHERE user_id = $1 FOR UPDATE`,
    [userId],
  );
  if (!locked.rows.length) {
    throw new Error("Portefeuille introuvable — contacte le support.");
  }
}

async function creditTokens(
  client: PgQueryable,
  userId: string,
  amount: number,
): Promise<number> {
  await lockWalletRow(client, userId);
  const result = await client.query<{ token_balance: number }>(
    `UPDATE user_wallets
     SET token_balance = token_balance + $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING token_balance`,
    [amount, userId],
  );
  return Number(result.rows[0]?.token_balance ?? DEFAULT_WALLET_TOKENS);
}

async function getWalletBalanceDirect(
  client: PgQueryable,
  userId: string,
): Promise<number> {
  await client.query(
    `INSERT INTO user_wallets (user_id, token_balance)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, DEFAULT_WALLET_TOKENS],
  );
  const result = await client.query<{ token_balance: number }>(
    `SELECT token_balance FROM user_wallets WHERE user_id = $1`,
    [userId],
  );
  return Number(result.rows[0]?.token_balance ?? DEFAULT_WALLET_TOKENS);
}

interface TournamentRow {
  id: string;
  title: string;
  entry_fee: number;
  prize_pool: number;
  status: string;
  expires_at: string;
  created_at: string;
}

function mapTournamentRow(
  row: TournamentRow,
  entryCount: number,
  topScore: number | null,
): TournamentWithStats {
  const expiresAt = new Date(row.expires_at);
  return {
    id: row.id,
    title: row.title,
    entryFee: Number(row.entry_fee),
    prizePool: Number(row.prize_pool),
    status: row.status,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    entryCount,
    topScore,
    timeRemainingMs: Math.max(0, expiresAt.getTime() - Date.now()),
  };
}

async function loadTournamentStats(tournamentId: string): Promise<{
  entryCount: number;
  topScore: number | null;
}> {
  if (supabaseAdmin) {
    const { data: scores, error } = await supabaseAdmin
      .from("royale_scores")
      .select("user_id, score")
      .eq("tournament_id", tournamentId);
    if (error) throw new Error(error.message);
    const rows = scores ?? [];
    const entryCount = new Set(rows.map((r) => r.user_id)).size;
    const topScore =
      rows.length > 0
        ? Math.max(...rows.map((r) => Number(r.score ?? 0)))
        : null;
    return { entryCount, topScore };
  }

  const client = createDirectClient();
  await client.connect();
  try {
    const stats = await client.query<{
      entry_count: number;
      top_score: number | null;
    }>(
      `SELECT COUNT(DISTINCT user_id)::int AS entry_count,
              MAX(score) AS top_score
       FROM royale_scores
       WHERE tournament_id = $1`,
      [tournamentId],
    );
    const s = stats.rows[0];
    return {
      entryCount: s?.entry_count ?? 0,
      topScore: s?.top_score != null ? Number(s.top_score) : null,
    };
  } finally {
    await client.end().catch(() => {});
  }
}

async function getOrCreateDailyTournamentViaAdmin(
  now: Date,
): Promise<TournamentWithStats> {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client not configured");
  }

  await supabaseAdmin
    .from("tournaments")
    .update({ status: "completed" })
    .eq("status", "active")
    .lt("expires_at", now.toISOString());

  const { data: existing, error: selectErr } = await supabaseAdmin
    .from("tournaments")
    .select("id, title, entry_fee, prize_pool, status, expires_at, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectErr) throw new Error(selectErr.message);

  let row = existing as TournamentRow | null;
  if (!row) {
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("tournaments")
      .insert({
        title: formatDailyTitle(now),
        entry_fee: DAILY_ENTRY_FEE,
        prize_pool: DAILY_PRIZE_POOL,
        status: "active",
        expires_at: midnight.toISOString(),
      })
      .select(
        "id, title, entry_fee, prize_pool, status, expires_at, created_at",
      )
      .single();
    if (insertErr) throw new Error(insertErr.message);
    row = created as TournamentRow;
  }

  const stats = await loadTournamentStats(row.id);
  return mapTournamentRow(row, stats.entryCount, stats.topScore);
}

async function getOrCreateDailyTournamentViaSql(
  now: Date,
): Promise<TournamentWithStats> {
  const client = createDirectClient();
  await client.connect();
  try {
    await client.query(
      `UPDATE tournaments SET status = 'completed'
       WHERE status = 'active' AND expires_at < $1`,
      [now],
    );

    const existing = await client.query<TournamentRow>(
      `SELECT id, title, entry_fee, prize_pool, status, expires_at, created_at
       FROM tournaments
       WHERE status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
    );

    let row = existing.rows[0];
    if (!row) {
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 999);
      const created = await client.query<TournamentRow>(
        `INSERT INTO tournaments (title, entry_fee, prize_pool, status, expires_at)
         VALUES ($1, $2, $3, 'active', $4)
         RETURNING id, title, entry_fee, prize_pool, status, expires_at, created_at`,
        [formatDailyTitle(now), DAILY_ENTRY_FEE, DAILY_PRIZE_POOL, midnight],
      );
      row = created.rows[0];
    }

    const stats = await loadTournamentStats(row.id);
    return mapTournamentRow(row, stats.entryCount, stats.topScore);
  } finally {
    await client.end().catch(() => {});
  }
}

/**
 * Get or auto-create today's daily Poutine Royale tournament.
 * Prefer Supabase HTTP (service role) — Render often has pooler DATABASE_URL issues.
 */
export async function getOrCreateDailyTournament(): Promise<TournamentWithStats> {
  const now = new Date();
  if (supabaseAdmin) {
    try {
      return await getOrCreateDailyTournamentViaAdmin(now);
    } catch (err) {
      console.warn("[Royale] supabaseAdmin tournament path failed:", err);
    }
  }
  return getOrCreateDailyTournamentViaSql(now);
}

function formatDailyTitle(date: Date): string {
  const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const months = [
    "Jan",
    "Fév",
    "Mar",
    "Avr",
    "Mai",
    "Juin",
    "Juil",
    "Août",
    "Sep",
    "Oct",
    "Nov",
    "Déc",
  ];
  return `Poutine Royale — ${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

export interface SubmitResult {
  entry: {
    id: string;
    userId: string;
    tournamentId: string;
    score: number;
    layers: number;
  };
  rank: number;
  isNewBest: boolean;
  reward: number;
  tokenBalance: number;
}

/**
 * Submit a score — keeps only the player's best score for this tournament and,
 * on a NEW personal best, settles a virtual-token "GG gift" into their wallet.
 *
 * Runs on a dedicated pg.Client transaction (the Supabase pooler rejects
 * Drizzle's db.transaction()). The score upsert + wallet credit are atomic:
 * the row is locked FOR UPDATE so the reward can never double-settle.
 */
async function submitScoreViaAdmin(
  userId: string,
  tournamentId: string,
  score: number,
  layers: number,
  metadata: Record<string, unknown>,
): Promise<Omit<SubmitResult, "rank">> {
  if (!supabaseAdmin) throw new Error("Supabase admin client not configured");

  const { data: tournament, error: tourErr } = await supabaseAdmin
    .from("tournaments")
    .select("status")
    .eq("id", tournamentId)
    .maybeSingle();
  if (tourErr) throw new Error(tourErr.message);
  if (!tournament) throw new Error("Tournoi introuvable");
  if (tournament.status !== "active") throw new Error("Ce tournoi est terminé");

  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("royale_scores")
    .select("id, score, layers")
    .eq("user_id", userId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();
  if (existingErr) throw new Error(existingErr.message);

  let entryId: string;
  let bestScore: number;
  let bestLayers: number;
  let isNewBest = false;

  if (existing) {
    if (score <= Number(existing.score)) {
      entryId = existing.id;
      bestScore = Number(existing.score);
      bestLayers = Number(existing.layers);
    } else {
      const { data: updated, error: updateErr } = await supabaseAdmin
        .from("royale_scores")
        .update({
          score,
          layers,
          metadata,
          created_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id, layers")
        .single();
      if (updateErr) throw new Error(updateErr.message);
      entryId = updated.id;
      bestScore = score;
      bestLayers = Number(updated.layers);
      isNewBest = true;
    }
  } else {
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("royale_scores")
      .insert({
        user_id: userId,
        tournament_id: tournamentId,
        score,
        layers,
        metadata,
      })
      .select("id, layers")
      .single();
    if (insertErr) throw new Error(insertErr.message);
    entryId = created.id;
    bestScore = score;
    bestLayers = Number(created.layers);
    isNewBest = true;
  }

  const reward = isNewBest ? computeReward(score) : 0;
  const tokenBalance =
    reward > 0
      ? await creditTokenBalance(userId, reward)
      : await getTokenBalance(userId);

  return {
    entry: {
      id: entryId,
      userId,
      tournamentId,
      score: bestScore,
      layers: bestLayers,
    },
    isNewBest,
    reward,
    tokenBalance,
  };
}

export async function submitScore(
  userId: string,
  tournamentId: string,
  score: number,
  layers: number,
  metadata: Record<string, unknown> = {},
): Promise<SubmitResult> {
  // Basic anti-cheat validation
  if (score < 0 || score > 200) throw new Error("Score invalide");
  if (layers < 0 || layers > score + 5) throw new Error("Données invalides");

  if (supabaseAdmin) {
    const result = await submitScoreViaAdmin(
      userId,
      tournamentId,
      score,
      layers,
      metadata ?? {},
    );
    const rank = await getPlayerRank(userId, tournamentId, result.entry.score);
    return { ...result, rank };
  }

  const metadataJson = JSON.stringify(metadata ?? {});

  const result = await withTx(async (client) => {
    // Tournament must exist and be active (lock it so it can't expire mid-write)
    const tour = await client.query<{ status: string }>(
      `SELECT status FROM tournaments WHERE id = $1 LIMIT 1 FOR UPDATE`,
      [tournamentId],
    );
    if (!tour.rows.length) throw new Error("Tournoi introuvable");
    if (tour.rows[0].status !== "active") {
      throw new Error("Ce tournoi est terminé");
    }

    // Lock the player's existing best (if any) for this tournament
    const existing = await client.query<{ id: string; score: number }>(
      `SELECT id, score FROM royale_scores
       WHERE user_id = $1 AND tournament_id = $2
       LIMIT 1 FOR UPDATE`,
      [userId, tournamentId],
    );

    let entryId: string;
    let bestScore: number;
    let bestLayers: number;
    let isNewBest: boolean;

    if (existing.rows.length) {
      const prev = existing.rows[0];
      if (score <= prev.score) {
        // Not a new best — keep the existing entry, no reward
        entryId = prev.id;
        bestScore = prev.score;
        isNewBest = false;
        const layersRow = await client.query<{ layers: number }>(
          `SELECT layers FROM royale_scores WHERE id = $1`,
          [prev.id],
        );
        bestLayers = Number(layersRow.rows[0]?.layers ?? layers);
      } else {
        const updated = await client.query<{ id: string; layers: number }>(
          `UPDATE royale_scores
           SET score = $1, layers = $2, metadata = $3::jsonb, created_at = NOW()
           WHERE id = $4
           RETURNING id, layers`,
          [score, layers, metadataJson, prev.id],
        );
        entryId = updated.rows[0].id;
        bestScore = score;
        bestLayers = Number(updated.rows[0].layers);
        isNewBest = true;
      }
    } else {
      const created = await client.query<{ id: string; layers: number }>(
        `INSERT INTO royale_scores (user_id, tournament_id, score, layers, metadata)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING id, layers`,
        [userId, tournamentId, score, layers, metadataJson],
      );
      entryId = created.rows[0].id;
      bestScore = score;
      bestLayers = Number(created.rows[0].layers);
      isNewBest = true;
    }

    // Settle the GG-gift reward only when the player beat their own best
    const reward = isNewBest ? computeReward(score) : 0;
    const tokenBalance =
      reward > 0
        ? await creditTokens(client, userId, reward)
        : await getWalletBalanceDirect(client, userId);

    return {
      entry: {
        id: entryId,
        userId,
        tournamentId,
        score: bestScore,
        layers: bestLayers,
      },
      isNewBest,
      reward,
      tokenBalance,
    };
  });

  const rank = await getPlayerRank(userId, tournamentId, result.entry.score);
  return { ...result, rank };
}

async function getPlayerRank(
  _userId: string,
  tournamentId: string,
  playerScore: number,
): Promise<number> {
  if (supabaseAdmin) {
    const { count, error } = await supabaseAdmin
      .from("royale_scores")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId)
      .gt("score", playerScore);
    if (error) throw new Error(error.message);
    return (count ?? 0) + 1;
  }

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(royaleScores)
    .where(
      and(
        eq(royaleScores.tournamentId, tournamentId),
        sql`${royaleScores.score} > ${playerScore}`,
      ),
    );
  return (result[0]?.count ?? 0) + 1;
}

export async function getLeaderboard(
  tournamentId: string,
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (supabaseAdmin) {
    const { data: rows, error } = await supabaseAdmin
      .from("royale_scores")
      .select("user_id, score, layers, created_at")
      .eq("tournament_id", tournamentId)
      .order("score", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);

    const profiles = await fetchProfilesByIds(
      (rows ?? []).map((r) => r.user_id as string),
    );

    return (rows ?? []).map((r, i) => {
      const profile = profiles.get(r.user_id as string);
      return {
        rank: i + 1,
        userId: r.user_id as string,
        username: profile?.username ?? null,
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
        score: Number(r.score),
        layers: Number(r.layers),
        submittedAt: r.created_at as string,
      };
    });
  }

  const rows = await db
    .select({
      userId: royaleScores.userId,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      score: royaleScores.score,
      layers: royaleScores.layers,
      submittedAt: royaleScores.createdAt,
    })
    .from(royaleScores)
    .leftJoin(users, eq(royaleScores.userId, users.id))
    .where(eq(royaleScores.tournamentId, tournamentId))
    .orderBy(desc(royaleScores.score))
    .limit(limit);

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    username: r.username,
    displayName: r.displayName,
    avatarUrl: r.avatarUrl,
    score: r.score,
    layers: r.layers,
    submittedAt: r.submittedAt.toISOString(),
  }));
}

export async function getMyRank(
  userId: string,
  tournamentId: string,
): Promise<{ rank: number; score: number; layers: number } | null> {
  if (supabaseAdmin) {
    const { data: entry, error } = await supabaseAdmin
      .from("royale_scores")
      .select("score, layers")
      .eq("user_id", userId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!entry) return null;

    const { count, error: rankErr } = await supabaseAdmin
      .from("royale_scores")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", tournamentId)
      .gt("score", entry.score);
    if (rankErr) throw new Error(rankErr.message);

    return {
      rank: (count ?? 0) + 1,
      score: Number(entry.score),
      layers: Number(entry.layers),
    };
  }

  const [entry] = await db
    .select()
    .from(royaleScores)
    .where(
      and(
        eq(royaleScores.userId, userId),
        eq(royaleScores.tournamentId, tournamentId),
      ),
    )
    .limit(1);

  if (!entry) return null;

  const rank = await getPlayerRank(userId, tournamentId, entry.score);
  return { rank, score: entry.score, layers: entry.layers };
}

/** Read (auto-seeding) the player's virtual-token wallet balance. */
export async function getWalletBalance(userId: string): Promise<number> {
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

  const client = createDirectClient();
  await client.connect();
  try {
    return await getWalletBalanceDirect(client, userId);
  } finally {
    await client.end().catch(() => {});
  }
}

// Legacy compat
export class RoyaleService {
  static getActiveTournaments = getOrCreateDailyTournament;
  static getLeaderboard = getLeaderboard;
  static async joinTournament(_userId: string, _tournamentId: string) {
    return { success: true };
  }
  static submitScore = submitScore;
}
