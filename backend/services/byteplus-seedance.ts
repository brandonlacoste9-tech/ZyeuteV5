/**
 * BytePlus ModelArk — Seedance text-to-video generation.
 * https://docs.byteplus.com/en/docs/ModelArk/Video_Generation_API
 */
import { fetch } from "undici";

const DEFAULT_BASE = "https://ark.ap-southeast.bytepluses.com/api/v3";

export type SeedanceTaskStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | string;

export type SeedanceCreateResult = {
  taskId: string;
  raw: Record<string, unknown>;
};

export type SeedanceTaskResult = {
  taskId: string;
  status: SeedanceTaskStatus;
  videoUrl: string | null;
  error: string | null;
  raw: Record<string, unknown>;
};

export function isBytePlusArkConfigured(): boolean {
  return Boolean(process.env.ARK_API_KEY?.trim());
}

export function getArkConfig() {
  return {
    apiKey: process.env.ARK_API_KEY?.trim() || "",
    baseUrl: (process.env.ARK_BASE_URL?.trim() || DEFAULT_BASE).replace(
      /\/$/,
      "",
    ),
    model: process.env.ARK_SEEDANCE_MODEL?.trim() || "seedance-1-5-pro-251215",
  };
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

/** Try both API path variants (BytePlus docs use both). */
async function postCreateTask(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; data: Record<string, unknown>; path: string }> {
  const paths = ["/contents/generations/tasks", "/content_generation/tasks"];

  for (const path of paths) {
    const resp = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: authHeaders(apiKey),
      body: JSON.stringify(body),
    });
    const text = await resp.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { raw: text };
    }
    if (resp.ok) return { ok: true, data, path };
    const err = data.error as { code?: string; message?: string } | undefined;
    if (err?.code === "InvalidParameter" && path === paths[0]) continue;
    return { ok: false, data, path };
  }

  return {
    ok: false,
    data: { error: { message: "All create paths failed" } },
    path: "",
  };
}

async function getTask(
  baseUrl: string,
  apiKey: string,
  taskId: string,
): Promise<Record<string, unknown>> {
  const paths = [
    `/contents/generations/tasks/${taskId}`,
    `/content_generation/tasks/${taskId}`,
  ];

  for (const path of paths) {
    const resp = await fetch(`${baseUrl}${path}`, {
      headers: authHeaders(apiKey),
    });
    const text = await resp.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { raw: text };
    }
    if (resp.ok) return data;
  }

  throw new Error(`Failed to retrieve task ${taskId}`);
}

function extractTaskId(data: Record<string, unknown>): string | null {
  const id = data.id ?? data.task_id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function extractVideoUrl(data: Record<string, unknown>): string | null {
  const content = data.content as Record<string, unknown> | undefined;
  if (typeof content?.video_url === "string") return content.video_url;
  if (typeof content?.videoUrl === "string") return content.videoUrl;

  const output = data.output as Record<string, unknown> | undefined;
  if (typeof output?.video_url === "string") return output.video_url;

  const result = data.result as Record<string, unknown> | undefined;
  if (typeof result?.video_url === "string") return result.video_url;

  return null;
}

function extractError(data: Record<string, unknown>): string | null {
  const err = data.error as { message?: string } | string | undefined;
  if (typeof err === "string") return err;
  if (err?.message) return err.message;
  const content = data.content as { error?: string } | undefined;
  if (content?.error) return content.error;
  return null;
}

export type SeedanceGenerateOptions = {
  prompt: string;
  model?: string;
  ratio?: "9:16" | "16:9" | "1:1";
  resolution?: "480p" | "720p" | "1080p";
  duration?: number;
  watermark?: boolean;
  pollIntervalMs?: number;
  maxWaitMs?: number;
};

/**
 * Create task, poll until done, return temporary MP4 URL (download within ~24h).
 */
export async function generateSeedanceVideo(
  options: SeedanceGenerateOptions,
): Promise<SeedanceTaskResult> {
  const { apiKey, baseUrl, model: defaultModel } = getArkConfig();
  if (!apiKey) {
    throw new Error("ARK_API_KEY not configured");
  }

  const model = options.model || defaultModel;
  const duration = Math.min(12, Math.max(4, options.duration ?? 5));
  const ratio = options.ratio ?? "9:16";
  const resolution = options.resolution ?? "720p";

  const promptText = `${options.prompt.trim()} --resolution ${resolution} --duration ${duration} --ratio ${ratio} --camerafixed false`;

  const body = {
    model,
    content: [{ type: "text", text: promptText }],
    ratio,
    resolution,
    duration,
    watermark: options.watermark ?? false,
  };

  const created = await postCreateTask(baseUrl, apiKey, body);
  if (!created.ok) {
    const err = created.data.error as
      | { message?: string; code?: string }
      | undefined;
    throw new Error(
      err?.message || `Seedance create failed (${err?.code ?? "unknown"})`,
    );
  }

  const taskId = extractTaskId(created.data);
  if (!taskId) {
    throw new Error("Seedance create returned no task id");
  }

  const pollInterval = options.pollIntervalMs ?? 8000;
  const maxWait = options.maxWaitMs ?? 600_000;
  let elapsed = 0;

  while (elapsed <= maxWait) {
    const data = await getTask(baseUrl, apiKey, taskId);
    const status = String(data.status ?? "unknown") as SeedanceTaskStatus;

    if (status === "succeeded") {
      return {
        taskId,
        status,
        videoUrl: extractVideoUrl(data),
        error: null,
        raw: data,
      };
    }

    if (status === "failed" || status === "cancelled") {
      return {
        taskId,
        status,
        videoUrl: null,
        error: extractError(data) || status,
        raw: data,
      };
    }

    await new Promise((r) => setTimeout(r, pollInterval));
    elapsed += pollInterval;
  }

  throw new Error(`Seedance task ${taskId} timed out after ${maxWait}ms`);
}

export async function listArkVideoModels(): Promise<string[]> {
  const { apiKey, baseUrl } = getArkConfig();
  if (!apiKey) return [];

  const resp = await fetch(`${baseUrl}/models`, {
    headers: authHeaders(apiKey),
  });
  if (!resp.ok) return [];

  const json = (await resp.json()) as {
    data?: { id?: string; domain?: string; task_type?: string[] }[];
  };

  return (json.data ?? [])
    .filter(
      (m) =>
        m.domain === "VideoGeneration" ||
        m.task_type?.some((t) => /video/i.test(t)),
    )
    .map((m) => m.id ?? "")
    .filter(Boolean);
}
