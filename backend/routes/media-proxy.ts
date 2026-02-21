/**
 * Media Proxy - Stream external video/image URLs through backend
 * Fixes 403 (Mixkit) and ORB (Unsplash) blocking when loading in <video>/<img>
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
