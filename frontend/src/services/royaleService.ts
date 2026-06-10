import { apiCall } from "./api";

export interface RoyaleTournament {
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

export interface RoyaleLeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  score: number;
  layers: number;
  submittedAt: string;
}

export interface RoyaleMyRank {
  rank: number | null;
  score: number | null;
  layers: number | null;
}

export interface RoyaleSubmitResult {
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

/** Today's daily tournament (auto-created server-side). */
export async function getTodayTournament(): Promise<RoyaleTournament | null> {
  const { data, error, code } =
    await apiCall<RoyaleTournament>("/royale/today");
  if (data?.id) return data;

  if (error) {
    console.warn("[Royale] /today failed:", error, code);
  }

  // Bypass apiCall dedupe/circuit-breaker for a direct retry (feed 429s must not brick arcade)
  try {
    const res = await fetch("/api/royale/today", {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      const body = (await res.json()) as RoyaleTournament;
      if (body?.id) return body;
    }
  } catch (directErr) {
    console.warn("[Royale] /today direct fetch failed:", directErr);
  }

  return null;
}

export async function getLeaderboard(
  tournamentId: string,
  limit = 10,
): Promise<RoyaleLeaderboardEntry[]> {
  const { data } = await apiCall<RoyaleLeaderboardEntry[]>(
    `/royale/leaderboard/${tournamentId}?limit=${limit}`,
  );
  return Array.isArray(data) ? data : [];
}

export async function getMyRank(
  tournamentId: string,
): Promise<RoyaleMyRank | null> {
  const { data } = await apiCall<RoyaleMyRank>(
    `/royale/my-rank/${tournamentId}`,
  );
  return data ?? null;
}

export async function getWallet(): Promise<number | null> {
  const { data, error } = await apiCall<{ tokenBalance: number }>(
    "/royale/wallet",
  );
  if (data) return data.tokenBalance;
  if (error) {
    const fallback = await apiCall<{ tokenBalance: number }>(
      "/grid-rush/wallet",
    );
    if (fallback.data) return fallback.data.tokenBalance;
  }
  return null;
}

export async function submitScore(params: {
  tournamentId: string;
  score: number;
  layers: number;
  metadata?: Record<string, unknown>;
}): Promise<{ result: RoyaleSubmitResult | null; error: string | null }> {
  const { data, error } = await apiCall<RoyaleSubmitResult>("/royale/submit", {
    method: "POST",
    body: JSON.stringify({
      tournamentId: params.tournamentId,
      score: params.score,
      layers: params.layers,
      metadata: params.metadata ?? {},
    }),
  });
  return { result: data, error };
}
