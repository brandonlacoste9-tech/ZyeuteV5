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
  const { data } = await apiCall<RoyaleTournament>("/royale/today");
  return data?.id ? data : null;
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
  const { data } = await apiCall<{ tokenBalance: number }>("/royale/wallet");
  return data ? data.tokenBalance : null;
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
