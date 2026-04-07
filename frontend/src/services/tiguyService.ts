import { getSessionWithTimeout } from "@/lib/supabase";

const API_BASE = "/api/tiguy";

type TiGuyHistoryMessage = {
  sender: "user" | "tiguy";
  text: string;
};

async function getAuthHeaders() {
  const {
    data: { session },
  } = await getSessionWithTimeout(3000);
  const token = session?.access_token;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Helper to make API calls with consistent error handling
 */
async function tiguyFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: await getAuthHeaders(),
    ...options,
  });
  if (!response.ok) throw new Error("TI-GUY unavailable");
  return response.json();
}

export const tiguyService = {
  async sendMessage(
    message: string,
    image?: string,
    extras?: {
      history?: TiGuyHistoryMessage[];
      context?: Record<string, unknown>;
    },
  ) {
    return tiguyFetch("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        image,
        history: extras?.history,
        context: extras?.context,
      }),
    });
  },

  async getJoke() {
    return tiguyFetch("/joke");
  },

  async checkStatus() {
    const response = await fetch(`${API_BASE}/status`);
    return response.ok;
  },
};
