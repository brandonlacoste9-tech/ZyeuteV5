"use client";

/**
 * Root-level error UI — catches errors in the root layout.
 * Must define its own <html>/<body> because root layout is not rendered.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr-CA">
      <body className="bg-white text-gray-900 antialiased min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚜️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Oups! L&apos;app a planté
          </h1>
          <p className="text-gray-600 mb-6">
            Une erreur inattendue s&apos;est produite. Recharge la page pour
            réessayer.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-[#003399] text-white font-semibold rounded-lg hover:bg-[#002266] transition-colors"
          >
            Recharger la page
          </button>
          {process.env.NODE_ENV === "development" && error?.message && (
            <p className="mt-6 text-left text-xs text-red-600 font-mono max-h-24 overflow-auto">
              {error.message}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
