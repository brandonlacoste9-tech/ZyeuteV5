
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
  // AI Generation - FAL AI
  "fal.media",
  "*.fal.media",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
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

  try {
    const rangeHeader = req.headers.range;
    
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Referer": url.includes('mixkit.co') ? "https://mixkit.co/" : "https://www.google.com/",
    };
    
    if (rangeHeader) fetchHeaders["Range"] = rangeHeader;

    console.log(`[MediaProxy] Fetching: ${url.substring(0, 100)}`);

    const resp = await fetch(url, {
      headers: fetchHeaders,
      method: "GET",
    });

    if (!resp.ok) {
      console.error(`[MediaProxy] Upstream error ${resp.status} for ${url}`);
      return res.status(resp.status).json({ error: `Upstream error ${resp.status}` });
    }

    const contentType = resp.headers.get("content-type") || "application/octet-stream";
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
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

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
      res.status(502).json({ error: "Proxy fetch failed", details: err.message });
    }
  }
});

export default router;
