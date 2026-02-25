const API_BASE = "/api/tiguy";

/**
 * Helper to make API calls with consistent error handling
 */
async function tiguyFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) throw new Error("TI-GUY unavailable");
  return response.json();
}

export const tiguyService = {
  async sendMessage(message: string, image?: string) {
    return tiguyFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ message, image }),
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
