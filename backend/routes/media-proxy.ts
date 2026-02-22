/**
 * Media Proxy - Stream external video/image URLs through backend
 * Fixes 403 (Mixkit) and ORB (Unsplash) blocking when loading in <video>/<img>
 * Also rewrites HLS manifest relative URIs so HLS.js can load all segments.
 */

import { Router, Request, Response } from "express";
import { Readable } from "stream";
import rateLimit from "express-rate-limit";

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
  "supabase.co",
  "supabase.in",
];

function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

/**
 * Rewrite URI lines in an HLS manifest (master or variant) so that all
 * relative references become absolute proxied URLs.
 *
 * HLS.js resolves segment/playlist URIs relative to the URL it fetched the
 * manifest from.  When the manifest is served via `/api/media-proxy?url=…`,
 * the "base URL" for HLS.js is the proxy path — so relative paths like
 * `360p/360p.m3u8` would resolve to `/api/media-proxy360p/360p.m3u8`
 * instead of the correct GCS location.  We fix this by rewriting every URI
 * line to a fully-qualified proxy URL before sending the manifest to the
 * client.
 */
function rewriteHLSManifest(content: string, manifestUrl: string): string {
  let baseDirUrl: string;
  try {
    const urlObj = new URL(manifestUrl);
    // Keep everything up to (and including) the last slash before the filename
    const pathname = urlObj.pathname;
    const dirPath = pathname.substring(0, pathname.lastIndexOf("/") + 1);
    baseDirUrl = `${urlObj.protocol}//${urlObj.host}${dirPath}`;
  } catch {
    // If URL parsing fails, return content unchanged
    return content;
  }

  return content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // Pass through empty lines and HLS tag / comment lines unchanged
      if (!trimmed || trimmed.startsWith("#")) return line;

      // Resolve to an absolute GCS URL
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

      // Route the absolute GCS URL back through the proxy
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
    return res.status(403).json({ error: "Domain not allowed" });
  }

  try {
    const rangeHeader = req.headers.range;
    const fetchHeaders: Record<string, string> = {
      "User-Agent": "Mozilla/5.0 (compatible; ZyeuteMediaProxy/1.0)",
      Accept: "*/*",
    };
    if (rangeHeader) fetchHeaders.Range = rangeHeader;

    const resp = await fetch(url, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    if (!resp.ok) {
      return res.status(resp.status).json({ error: "Upstream fetch failed" });
    }

    const contentType =
      resp.headers.get("content-type") || "application/octet-stream";

    // HLS manifests (master or variant .m3u8): rewrite relative URI lines to
    // absolute proxied URLs so HLS.js can fetch all segments through the proxy.
    const isHLS =
      contentType.includes("mpegurl") ||
      url.endsWith(".m3u8") ||
      url.includes(".m3u8?");

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
    const contentRange = resp.headers.get("content-range");
    const contentLength = resp.headers.get("content-length");
    if (resp.status === 206 && contentRange) {
      res.status(206);
      res.setHeader("Content-Range", contentRange);
      res.setHeader("Accept-Ranges", "bytes");
      if (contentLength) res.setHeader("Content-Length", contentLength);
    }

    const body = resp.body;
    if (body) {
      const nodeStream = Readable.fromWeb(body as any);
      nodeStream.pipe(res);
      nodeStream.on("error", (err) => {
        console.error("[MediaProxy] Stream error:", err);
        if (!res.headersSent)
          res.status(502).json({ error: "Proxy stream failed" });
        else res.end();
      });
    } else {
      res.status(502).json({ error: "No response body" });
    }
  } catch (err: unknown) {
    console.error("[MediaProxy] Error:", err);
    if (!res.headersSent) {
      res.status(502).json({ error: "Proxy fetch failed" });
    }
  }
});

export default router;
