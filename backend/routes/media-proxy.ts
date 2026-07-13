import { Router, Request, Response } from "express";
import { Readable } from "stream";
import rateLimit from "express-rate-limit";
import { fetch } from "undici";

const router = Router();

const ALLOWED_HOSTS = [
  "assets.mixkit.co",
  "mixkit.co",
  "videos.pexels.com",
  "www.pexels.com",
  "images.pexels.com",
  "images.unsplash.com",
  "unsplash.com",
  "player.vimeo.com",
  "storage.googleapis.com",
  "commondatastorage.googleapis.com",
  "cloudflarestream.com",
  "*.cloudflarestream.com",
  "sample-videos.com",
  "w3schools.com",
  "www.w3schools.com",
  "api.apify.com",
  // AI Generation - FAL AI
  "fal.media",
  "*.fal.media",
  // TikTok CDN (requires Referer — see fetchHeaders below)
  "tiktok.com",
  "tiktokv.com",
  "tiktokcdn.com",
  "byteoversea.com",
  "muscdn.com",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname.includes("tiktok") ||
      hostname.includes("tiktokv") ||
      hostname.includes("tikcdn") ||
      hostname.includes("byteoversea") ||
      hostname.includes("muscdn")
    ) {
      return true;
    }
    return ALLOWED_HOSTS.some(
      (h) => hostname === h || hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

function rewriteHLSManifest(content: string, manifestUrl: string): string {
  let baseDirUrl: string;
  try {
    const urlObj = new URL(manifestUrl);
    const pathname = urlObj.pathname;
    const dirPath = pathname.substring(0, pathname.lastIndexOf("/") + 1);
    baseDirUrl = `${urlObj.protocol}//${urlObj.host}${dirPath}`;
  } catch {
    return content;
  }

  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return line;

      let absoluteUrl: string;
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        absoluteUrl = trimmed;
      } else if (trimmed.startsWith("/")) {
        try {
          const urlObj = new URL(manifestUrl);
          absoluteUrl = `${urlObj.protocol}//${urlObj.host}${trimmed}`;
        } catch {
          return line;
        }
      } else {
        absoluteUrl = `${baseDirUrl}${trimmed}`;
      }

      return `/api/media-proxy?url=${encodeURIComponent(absoluteUrl)}`;
    })
    .join("\n");
}

const proxyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests" },
});

router.get("/", proxyLimiter, async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string;
  if (!rawUrl) {
    return res.status(400).json({ error: "url query required" });
  }

  let url: string;
  try {
    url = decodeURIComponent(rawUrl);
  } catch {
    return res.status(400).json({ error: "Invalid url encoding" });
  }

  if (!isAllowedUrl(url)) {
    console.error(`[MediaProxy] Domain not allowed: ${url}`);
    return res.status(403).json({ error: "Domain not allowed" });
  }

  // Fast-fail expired TikTok signed URLs (x-expires) — avoid hammering CDN + logs
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isTikTok =
      host.includes("tiktok") ||
      host.includes("tiktokv") ||
      host.includes("tikcdn") ||
      host.includes("byteoversea") ||
      host.includes("muscdn");
    if (isTikTok) {
      const expRaw =
        parsed.searchParams.get("x-expires") ||
        parsed.searchParams.get("expires");
      const exp = expRaw ? parseInt(expRaw, 10) : 0;
      if (exp > 1e9 && exp < Math.floor(Date.now() / 1000) - 60) {
        res.setHeader("Cache-Control", "public, max-age=3600");
        res.setHeader("Access-Control-Allow-Origin", "*");
        // 410 = gone; clients should stop retrying this URL
        return res.status(410).json({
          error: "Signed CDN URL expired",
          code: "CDN_URL_EXPIRED",
        });
      }
    }
  } catch {
    /* continue */
  }

  try {
    const rangeHeader = req.headers.range;

    const fetchHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "*/*",
      Referer: url.includes("tiktok")
        ? "https://www.tiktok.com/"
        : url.includes("mixkit.co")
          ? "https://mixkit.co/"
          : "https://www.google.com/",
    };

    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    const resp = await fetch(url, {
      headers: fetchHeaders,
      method: "GET",
    });

    if (!resp.ok) {
      // Soft cache failures for TikTok so browsers/edge don't re-hammer
      const isTikTok = /tiktok|tiktokv|tikcdn|byteoversea|muscdn/i.test(url);
      if (isTikTok && (resp.status === 403 || resp.status === 404)) {
        res.setHeader("Cache-Control", "public, max-age=1800");
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(410).json({
          error: `Upstream ${resp.status}`,
          code: "CDN_UPSTREAM_GONE",
        });
      }
      return res
        .status(resp.status)
        .json({ error: `Upstream error ${resp.status}` });
    }

    const contentType =
      resp.headers.get("content-type") || "application/octet-stream";
    const isHLS = url.includes(".m3u8") || contentType.includes("mpegurl");

    if (isHLS) {
      const text = await resp.text();
      const rewritten = rewriteHLSManifest(text, url);
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.send(rewritten);
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD");
    res.setHeader("Access-Control-Allow-Headers", "Range");
    res.setHeader(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Range, Accept-Ranges",
    );

    const contentRange = resp.headers.get("content-range");
    const contentLength = resp.headers.get("content-length");

    if (contentRange) res.setHeader("Content-Range", contentRange);
    if (contentLength) res.setHeader("Content-Length", contentLength);

    res.status(resp.status);

    if (resp.body) {
      const nodeStream = Readable.fromWeb(resp.body as any);
      nodeStream.pipe(res);
      nodeStream.on("error", (err) => {
        console.error("[MediaProxy] Stream error:", err);
        if (!res.headersSent) res.status(502).end();
      });
    } else {
      res.end();
    }
  } catch (err: any) {
    console.error(`[MediaProxy] Critical error proxying ${url}:`, err.message);
    if (!res.headersSent) {
      res
        .status(502)
        .json({ error: "Proxy fetch failed", details: err.message });
    }
  }
});

export default router;
