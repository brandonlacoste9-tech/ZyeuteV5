import { apiCall } from "./api";
import { getSessionWithTimeout } from "@/lib/supabase";

async function arcadeFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<{ data: T | null; error: string | null }> {
  const { data, error } = await apiCall<T>(endpoint, options);
  if (data) return { data, error: null };
  if (error) {
    console.warn(`[GridRush] ${endpoint} failed via apiCall:`, error);
  }

  try {
    const {
      data: { session },
    } = await getSessionWithTimeout(3000);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        data: null,
        error: body?.error || `Request failed (${res.status})`,
      };
    }
    return { data: body as T, error: null };
  } catch {
    return { data: null, error: error || "Network error" };
  }
}

export interface GridRushMatch {
  id: string;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  player1Id: string;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  stakeTokens: number;
  isBot: boolean;
  winnerId: string | null;
  startedAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getWallet() {
  return apiCall<{ tokenBalance: number }>("/grid-rush/wallet");
}

export async function quickMatch(stakeTokens: number) {
  return arcadeFetch<GridRushMatch>("/grid-rush/queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stakeTokens }),
  });
}

export async function createInvite(stakeTokens: number) {
  return arcadeFetch<GridRushMatch>("/grid-rush/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stakeTokens }),
  });
}

export async function createBotMatch() {
  return arcadeFetch<GridRushMatch>("/grid-rush/bot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ practice: true }),
  });
}

export async function joinMatch(matchId: string) {
  return apiCall<GridRushMatch>(`/grid-rush/join/${matchId}`, {
    method: "POST",
  });
}

export async function getMatch(matchId: string) {
  return apiCall<GridRushMatch>(`/grid-rush/match/${matchId}`);
}

export async function submitRoundScore(matchId: string) {
  return apiCall<GridRushMatch>(`/grid-rush/score/${matchId}`, {
    method: "POST",
  });
}

export async function finishMatch(matchId: string) {
  return apiCall<GridRushMatch>(`/grid-rush/finish/${matchId}`, {
    method: "POST",
  });
}

export async function cancelMatch(matchId: string) {
  return apiCall<GridRushMatch>(`/grid-rush/cancel/${matchId}`, {
    method: "POST",
  });
}
