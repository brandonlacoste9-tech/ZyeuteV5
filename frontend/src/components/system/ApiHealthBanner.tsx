import { useEffect, useState } from "react";
import { featureFlags } from "@/lib/featureFlags";

/**
 * Shows a dismissible banner when /api/health is not OK (e.g. Render cold start).
 */
export function ApiHealthBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!featureFlags.apiHealthBannerDefault) return;

    let cancelled = false;
    const run = async () => {
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        const j = await r.json().catch(() => ({}));
        if (cancelled) return;
        const ok =
          r.ok &&
          (j.status === "ok" || j.stage === "ready" || j.stage === "initializing");
        if (!ok || j.stage === "initializing") {
          setVisible(true);
        }
      } catch {
        if (!cancelled) setVisible(true);
      }
    };

    run();
    const t = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] bg-amber-900/95 text-amber-100 text-center text-xs py-2 px-4 border-b border-amber-600/50"
      role="status"
    >
      <span>
        Connexion au serveur lente ou en cours de réveil — réessaie dans un
        instant.
      </span>
      <button
        type="button"
        className="ml-3 underline font-semibold text-white"
        onClick={() => setDismissed(true)}
      >
        Fermer
      </button>
    </div>
  );
}
