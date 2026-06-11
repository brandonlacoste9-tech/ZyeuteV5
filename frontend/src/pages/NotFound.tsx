/**
 * 404 — Page introuvable (French).
 * Replaces the silent redirect-to-feed on unknown routes.
 */

import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black leather-overlay flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl mb-4">⚜️</div>
        <h1 className="text-5xl font-black text-gold-500 mb-2">404</h1>
        <h2 className="text-xl font-bold text-white mb-3">Page introuvable</h2>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          Oups! Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/feed"
          className="inline-block px-6 py-3 rounded-xl font-bold text-black bg-gradient-to-br from-gold-400 to-gold-600 hover:opacity-90 transition"
        >
          Retour au fil
        </Link>
      </div>
    </div>
  );
}
