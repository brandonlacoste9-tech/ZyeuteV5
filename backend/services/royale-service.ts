import { db } from "../storage.js";
import { tournaments, royaleScores, users } from "../../shared/schema.js";
import { eq, desc, and, sql, lt } from "drizzle-orm";
import { supabaseAdmin } from "../supabase-auth.js";

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

const DAILY_ENTRY_FEE = 0; // Free to play for now
const DAILY_PRIZE_POOL = 0;

/**
 * Get or auto-create today's daily Poutine Royale tournament.
 * One tournament per calendar day (America/Toronto timezone).
 */
export async function getOrCreateDailyTournament(): Promise<TournamentWithStats> {
  const now = new Date();

  // Expire any stale active tournaments
  await db
    .update(tournaments)
    .set({ status: "completed" })
    .where(
      and(eq(tournaments.status, "active"), lt(tournaments.expiresAt, now)),
    );

  // Look for today's active tournament
  const existing = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.status, "active"))
    .orderBy(desc(tournaments.createdAt))
    .limit(1);

  let tournament = existing[0];

  if (!tournament) {
    // Create a new daily tournament expiring at midnight tonight (ET)
    const midnight = new Date(now);
    midnight.setHours(23, 59, 59, 999);

    const title = formatDailyTitle(now);
    const [created] = await db
      .insert(tournaments)
      .values({
        title,
        entryFee: DAILY_ENTRY_FEE,
        prizePool: DAILY_PRIZE_POOL,
        status: "active",
        expiresAt: midnight,
      })
      .returning();
    tournament = created;
  }

  return enrichTournament(tournament);
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

async function enrichTournament(
  t: typeof tournaments.$inferSelect,
): Promise<TournamentWithStats> {
  const stats = await db
    .select({
      entryCount: sql<number>`count(distinct ${royaleScores.userId})::int`,
      topScore: sql<number>`max(${royaleScores.score})`,
    })
    .from(royaleScores)
    .where(eq(royaleScores.tournamentId, t.id));

  const s = stats[0];
  return {
    id: t.id,
    title: t.title,
    entryFee: t.entryFee,
    prizePool: t.prizePool,
    status: t.status,
    expiresAt: t.expiresAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
    entryCount: s?.entryCount ?? 0,
    topScore: s?.topScore ?? null,
    timeRemainingMs: Math.max(0, t.expiresAt.getTime() - Date.now()),
  };
}

/**
 * Submit a score — keeps only the player's best score for this tournament.
 * Returns the entry + the player's new rank.
 */
export async function submitScore(
  userId: string,
  tournamentId: string,
  score: number,
  layers: number,
  metadata: Record<string, unknown> = {},
): Promise<{ entry: typeof royaleScores.$inferSelect; rank: number }> {
  // Basic validation
  if (score < 0 || score > 200) throw new Error("Score invalide");
  if (layers < 0 || layers > score + 5) throw new Error("Données invalides");

  // Check tournament exists and is active
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(eq(tournaments.id, tournamentId))
    .limit(1);
  if (!tournament) throw new Error("Tournoi introuvable");
  if (tournament.status !== "active") throw new Error("Ce tournoi est terminé");

  // Upsert: only keep the player's best score
  const existing = await db
    .select()
    .from(royaleScores)
    .where(
      and(
        eq(royaleScores.userId, userId),
        eq(royaleScores.tournamentId, tournamentId),
      ),
    )
    .limit(1);

  let entry: typeof royaleScores.$inferSelect;

  if (existing[0]) {
    if (score <= existing[0].score) {
      // Not a new best — return existing entry with current rank
      entry = existing[0];
    } else {
      // New best — update
      const [updated] = await db
        .update(royaleScores)
        .set({ score, layers, metadata, createdAt: new Date() })
        .where(eq(royaleScores.id, existing[0].id))
        .returning();
      entry = updated;
    }
  } else {
    // First submission
    const [created] = await db
      .insert(royaleScores)
      .values({ userId, tournamentId, score, layers, metadata })
      .returning();
    entry = created;
  }

  const rank = await getPlayerRank(userId, tournamentId, entry.score);
  return { entry, rank };
}

async function getPlayerRank(
  userId: string,
  tournamentId: string,
  playerScore: number,
): Promise<number> {
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

// Legacy compat
export class RoyaleService {
  static getActiveTournaments = getOrCreateDailyTournament;
  static getLeaderboard = getLeaderboard;
  static async joinTournament(_userId: string, _tournamentId: string) {
    return { success: true };
  }
  static submitScore = submitScore;
}
