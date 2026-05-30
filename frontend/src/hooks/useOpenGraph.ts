/**
 * useOpenGraph - Dynamically sets Open Graph meta tags for post sharing
 * Call this in PostDetail.tsx with the post data
 */
import { useEffect } from "react";
import type { Post } from "@/types";

export function useOpenGraph(post: Post | null) {
  useEffect(() => {
    if (!post) return;

    const title = post.caption
      ? `${post.caption.slice(0, 60)} — Zyeuté`
      : "Zyeuté — La plateforme québécoise";
    const description =
      post.caption ||
      "Découvrez ce contenu sur Zyeuté, la plateforme vidéo québécoise.";
    const image =
      post.thumbnail_url ||
      `https://image.mux.com/${post.mux_playback_id}/thumbnail.jpg?width=600&height=338&fit_mode=smartcrop`;
    const url = `https://zyeute.com/post/${post.id}`;

    // Helper to set or create meta tag
    const setMeta = (property: string, content: string, attr = "property") => {
      let el = document.querySelector(
        `meta[${attr}="${property}"]`,
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Open Graph
    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:image", image);
    setMeta("og:url", url);
    setMeta("og:type", "video.other");
    setMeta("og:site_name", "Zyeuté");

    // Twitter Card
    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");
    setMeta("twitter:image", image, "name");

    // Page title
    const prevTitle = document.title;
    document.title = title;

    return () => {
      document.title = prevTitle;
    };
  }, [post]);
}
