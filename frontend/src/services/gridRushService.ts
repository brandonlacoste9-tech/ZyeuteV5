import { apiCall } from "./api";

export interface GridRushMatch {
  id: string;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  player1Id: string;
  player2Id: string | null;
  player1Score: number;
  player2Score: number;
  stakeCennes: number;
  winnerId: string | null;
  startedAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function quickMatch(stakeCennes: number) {
  return apiCall<GridRushMatch>("/grid-rush/queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stakeCennes }),
  });
}

export async function createInvite(stakeCennes: number) {
  return apiCall<GridRushMatch>("/grid-rush/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stakeCennes }),
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
