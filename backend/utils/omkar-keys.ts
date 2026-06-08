import axios, { type AxiosRequestConfig } from "axios";

/** Primary + optional backup Omkar API keys (never log full values). */
export function getOmkarApiKeys(): string[] {
  const keys: string[] = [];
  const push = (raw: string | undefined) => {
    const k = raw?.trim();
    if (k && !keys.includes(k)) keys.push(k);
  };
  push(process.env.TIKTOK_SCRAPER_API_KEY);
  push(process.env.TIKTOK_SCRAPER_API_KEY_BACKUP);
  return keys;
}

export function isOmkarKeyConfigured(): boolean {
  return getOmkarApiKeys().length > 0;
}

function shouldTryNextKey(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  if (status === 401 || status === 403 || status === 429) return true;
  const body = String(err.response?.data ?? "").toLowerCase();
  return (
    body.includes("quota") ||
    body.includes("limit") ||
    body.includes("exceeded") ||
    body.includes("invalid") ||
    body.includes("unauthorized")
  );
}

/** Run an Omkar HTTP call; rotate to backup key on auth/quota errors. */
export async function omkarRequest<T>(
  buildConfig: (apiKey: string) => AxiosRequestConfig,
): Promise<T> {
  const keys = getOmkarApiKeys();
  if (keys.length === 0) {
    throw new Error("TIKTOK_SCRAPER_API_KEY missing");
  }

  let lastErr: unknown;
  for (let i = 0; i < keys.length; i++) {
    try {
      const res = await axios.request<T>(buildConfig(keys[i]));
      if (i > 0) {
        console.warn(
          `[Omkar] Succeeded with backup key #${i + 1} (ok_${keys[i].slice(3, 7)}…)`,
        );
      }
      return res.data;
    } catch (err) {
      lastErr = err;
      if (i < keys.length - 1 && shouldTryNextKey(err)) {
        console.warn(
          `[Omkar] Key #${i + 1} failed — trying backup (ok_${keys[i + 1]?.slice(3, 7) ?? "?"}…)`,
        );
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
