/**
 * Forgot Password Page
 * Users enter email to receive password reset link
 * Matches luxury Quebec heritage design
 */
import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSent(true);
    } catch (err: any) {
      setError(
        err.message || "Échec de l'envoi du courriel de réinitialisation",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen after email sent
  if (sent) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1510 50%, #0d0b09 100%)",
        }}
      >
        {/* Leather Texture Overlay */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="w-full max-w-md relative z-10">
          <div className="text-center">
            <h1
              className="text-5xl font-black mb-6 tracking-wide"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                background:
                  "linear-gradient(180deg, #FFF8DC 0%, #FFE55C 15%, #FFD700 30%, #DAA520 60%, #B8860B 85%, #8B6914 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter:
                  "drop-shadow(0 0 10px rgba(255,215,0,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.9))",
              }}
            >
              Zyeuté
            </h1>

            <div
              className="rounded-3xl p-8"
              style={{
                background: `linear-gradient(145deg, #3a2a22 0%, #251a15 50%, #1a1210 100%)`,
                border: "1px solid rgba(139, 90, 43, 0.4)",
                boxShadow: `0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(255,191,0,0.1)`,
              }}
            >
              <div className="text-center mb-6">
                <div style={{ fontSize: "64px", marginBottom: "16px" }}>✅</div>
                <h2
                  className="text-2xl font-bold mb-4"
                  style={{ color: "#10b981" }}
                >
                  Vérifie ton courriel
                </h2>
              </div>

              <p className="mb-6" style={{ color: "#E8DCC4" }}>
                Nous avons envoyé un lien de réinitialisation à{" "}
                <strong>{email}</strong>
              </p>

              <p className="mb-6 text-sm" style={{ color: "#B8A88A" }}>
                Clique sur le lien dans ton courriel pour réinitialiser ton mot
                de passe. Le lien expire dans 1 heure.
              </p>

              <p className="mb-6 text-sm" style={{ color: "#8B7355" }}>
                Tu ne l'as pas reçu? Vérifie ton dossier spam ou demande un
                nouveau lien.
              </p>

              <Link
                to="/login"
                className="inline-block w-full py-4 rounded-xl font-bold text-center transition-all duration-300"
                style={{
                  background:
                    "linear-gradient(135deg, #FFD700 0%, #FFC125 50%, #DAA520 100%)",
                  color: "#1a1a1a",
                  boxShadow: "0 4px 20px rgba(255,191,0,0.4)",
                  textDecoration: "none",
                }}
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form to request reset
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1510 50%, #0d0b09 100%)",
      }}
    >
      {/* Leather Texture Overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <h1
            className="text-5xl font-black tracking-wide"
            style={{
              fontFamily: "'Georgia', 'Times New Roman', serif",
              background:
                "linear-gradient(180deg, #FFF8DC 0%, #FFE55C 15%, #FFD700 30%, #DAA520 60%, #B8860B 85%, #8B6914 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter:
                "drop-shadow(0 0 10px rgba(255,215,0,0.6)) drop-shadow(0 3px 6px rgba(0,0,0,0.9))",
            }}
          >
            Zyeuté
          </h1>
        </div>

        <div
          className="rounded-3xl p-8"
          style={{
            background: `linear-gradient(145deg, #3a2a22 0%, #251a15 50%, #1a1210 100%)`,
            border: "1px solid rgba(139, 90, 43, 0.4)",
            boxShadow: `0 25px 50px rgba(0,0,0,0.6), 0 0 30px rgba(255,191,0,0.1)`,
          }}
        >
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#E8DCC4" }}>
            Réinitialiser ton mot de passe
          </h2>

          <p className="mb-6 text-sm" style={{ color: "#B8A88A" }}>
            Entre ton adresse courriel et nous t'enverrons un lien pour
            réinitialiser ton mot de passe.
          </p>

          {error && (
            <div
              className="rounded-xl p-4 mb-6"
              style={{
                background: "rgba(220,38,38,0.1)",
                border: "1px solid rgba(220,38,38,0.3)",
              }}
            >
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "#B8A88A" }}
              >
                Adresse courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                required
                className="w-full rounded-xl px-4 py-4 text-white placeholder-white/30 focus:outline-none transition-all duration-300"
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,191,0,0.2)",
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "white",
                boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? "default" : "pointer",
              }}
            >
              {isLoading
                ? "Envoi en cours..."
                : "Envoyer le lien de réinitialisation"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: "#8B7355" }}>
            <Link
              to="/login"
              className="font-semibold hover:underline transition-colors"
              style={{ color: "#3b82f6" }}
            >
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
