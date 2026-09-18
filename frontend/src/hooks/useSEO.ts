/**
 * useSEO — Dynamic per-page meta tags
 *
 * Updates document.title + meta tags on the fly so Google/AI search
 * engines see meaningful content for each page.
 *
 * Usage:
 *   useSEO({ title: "Profil de @brandon", description: "..." })
 */

import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile" | "video.other";
  /** JSON-LD structured data object — will be injected as <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown>;
  noIndex?: boolean;
}

const DEFAULT_TITLE = "Zyeuté — Quessé qui se passe icitte?";
const DEFAULT_DESC =
  "L'app vidéo du Québec. Clips de ta rue — Montréal, Québec, Gatineau. En français.";
const DEFAULT_IMAGE = "https://www.zyeute.ca/zyeute_og_image.png";
/** Prefer www — DNS is moving to zyeute.ca */
const BASE_URL = "https://www.zyeute.ca";

function setMeta(property: string, content: string, isName = false) {
  const attr = isName ? "name" : "property";
  let el = document.querySelector<HTMLMetaElement>(
    `meta[${attr}="${property}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSEO({
  title,
  description,
  image,
  url,
  type = "website",
  jsonLd,
  noIndex = false,
}: SEOProps = {}) {
  const fullTitle = title ? `${title} | Zyeute` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;
  const img = image || DEFAULT_IMAGE;
  const pageUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    // Title
    document.title = fullTitle;

    // Primary
    setMeta("description", desc, true);
    setMeta(
      "robots",
      noIndex ? "noindex, nofollow" : "index, follow, max-image-preview:large",
      true,
    );

    // Canonical
    setLink("canonical", pageUrl);

    // Open Graph
    setMeta("og:title", fullTitle);
    setMeta("og:description", desc);
    setMeta("og:image", img);
    setMeta("og:url", pageUrl);
    setMeta("og:type", type);
    setMeta("og:site_name", "Zyeute");
    setMeta("og:locale", "fr_CA");

    // Twitter
    setMeta("twitter:card", "summary_large_image", true);
    setMeta("twitter:title", fullTitle, true);
    setMeta("twitter:description", desc, true);
    setMeta("twitter:image", img, true);

    // JSON-LD
    const JSON_LD_ID = "zyeute-page-jsonld";
    let ldScript = document.getElementById(
      JSON_LD_ID,
    ) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.id = JSON_LD_ID;
        ldScript.type = "application/ld+json";
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    } else if (ldScript) {
      ldScript.remove();
    }

    // Reset on unmount
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [fullTitle, desc, img, pageUrl, type, noIndex, jsonLd]);
}

export default useSEO;
