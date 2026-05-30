"use client";

/**
 * Route-level error UI — catches errors in this segment and below.
 * User can reset and retry without full reload.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚜️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Oups! Quelque chose a planté
        </h1>
        <p className="text-gray-600 mb-6">
          Une erreur inattendue s&apos;est produite. Tu peux réessayer ou
          recharger la page.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#003399] text-white font-semibold rounded-lg hover:bg-[#002266] transition-colors"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Recharger la page
          </button>
        </div>
        {process.env.NODE_ENV === "development" && error?.message && (
          <p className="mt-6 text-left text-xs text-red-600 font-mono max-h-24 overflow-auto">
            {error.message}
          </p>
        )}
      </div>
    </div>
  );
}
