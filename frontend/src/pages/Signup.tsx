/**
 * Signup Page - Premium Quebec Heritage Design
 * Matching the luxury login aesthetic
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/Button";
import { Logo } from "@/components/Logo";
import { signUp, signInWithGoogle } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/Toast";
import {
  GUEST_MODE_KEY,
  GUEST_TIMESTAMP_KEY,
  GUEST_VIEWS_KEY,
} from "@/lib/constants";
import {
  useHive,
  HIVES,
  HiveId,
  detectHiveFromLocale,
} from "@/contexts/HiveContext";
import { detectLanguageFromBrowser } from "@/lib/geoDetect";

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const isMountedRef = React.useRef(true);
  const navigationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const { enterGuestMode } = useAuth();
  const { switchHive } = useHive();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  // Hive selection — auto-detect locale on mount
  const [selectedHive, setSelectedHive] = React.useState<HiveId>(() =>
    detectHiveFromLocale(),
  );

  // Cleanup on unmount to prevent state updates after navigation
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMountedRef.current) return;

    setError("");

    // Validation
    if (username.length < 3) {
      setError("Le nom d'utilisateur doit avoir au moins 3 caractères");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit avoir au moins 8 caractères");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, username, selectedHive);

      if (error) throw error;

      // Check if component is still mounted before updating state
      if (!isMountedRef.current) return;

      // Apply selected hive
      switchHive(selectedHive);
      localStorage.setItem("zyeute_hive_id", selectedHive);

      // Detect and persist language (fire-and-forget)
      const detectedLang = detectLanguageFromBrowser();
      localStorage.setItem("zyeute_language", detectedLang);

      // Clear guest mode on successful signup
      localStorage.removeItem(GUEST_MODE_KEY);
      localStorage.removeItem(GUEST_TIMESTAMP_KEY);
      localStorage.removeItem(GUEST_VIEWS_KEY);

      // Show success toast (non-blocking)
      const successMsg =
        selectedHive === "mexico"
          ? "¡Cuenta creada! Revisa tu correo para confirmar."
          : selectedHive === "brazil"
            ? "Conta criada! Verifique seu e-mail para confirmar."
            : selectedHive === "argentina"
              ? "¡Cuenta creada, pibe! Revisá tu correo para confirmar."
              : "Compte créé! Vérifie ton courriel pour confirmer ton compte.";
      toast.success(successMsg);

      // Redirect to onboarding for first-time users, feed if already onboarded
      // (Supabase creates the session even before email confirmation unless
      //  "Confirm email" is enforced in the Supabase dashboard)
      navigationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          const alreadyOnboarded =
            localStorage.getItem("zyeute_onboarded") === "1";
          window.location.href = alreadyOnboarded ? "/feed" : "/onboarding";
        }
      }, 150);
    } catch (err: any) {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(err.message || "Erreur lors de l'inscription");
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // OAuth redirect happens via Supabase; nothing else to do here.
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err?.message || "Erreur de connexion avec Google");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative leather-bg fur-overlay">
      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center animate-fade-in">
          <Logo size="xl" showText={true} linkTo={null} className="mb-4" />
          <p className="text-gold-400 text-sm font-semibold tracking-wider mb-1 embossed">
            REJOINS LA COMMUNAUTÉ QUÉBÉCOISE
          </p>
          <p className="text-white/80 text-sm embossed">
            Fait au Québec, pour vous autres ⚜️
          </p>
        </div>

        {/* Signup Form */}
        <div className="leather-card rounded-2xl p-8 stitched animate-fade-in">
          <h2 className="text-2xl font-bold text-gold-400 mb-6 embossed">
            Inscription
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500 rounded-xl p-3 mb-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                required
                placeholder="tonusername"
                className="input-premium"
              />
              <p className="text-leather-400 text-xs mt-1">
                Lettres minuscules, chiffres et _ seulement
              </p>
            </div>

            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                Courriel
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ton@email.com"
                className="input-premium"
              />
            </div>

            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                Mot de passe
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input-premium"
                  style={{ paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "20px",
                    color: "#B8A88A",
                    padding: "4px",
                  }}
                  title={
                    showPassword
                      ? "Cacher le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  aria-label={
                    showPassword
                      ? "Cacher le mot de passe"
                      : "Afficher le mot de passe"
                  }
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <p className="text-leather-400 text-xs mt-1">
                Minimum 8 caractères
              </p>
            </div>

            {/* Hive / Region selector */}
            <div>
              <label className="block text-gold-400 font-semibold mb-2 text-sm embossed">
                {selectedHive === "mexico" ? "Tu región" : "Ta région"}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  Object.values(HIVES) as (typeof HIVES)[keyof typeof HIVES][]
                ).map((hive) => (
                  <button
                    key={hive.id}
                    type="button"
                    onClick={() => setSelectedHive(hive.id as HiveId)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                      selectedHive === hive.id
                        ? "border-gold-500 bg-gold-500/10 text-gold-400"
                        : "border-leather-600 bg-transparent text-leather-300 hover:border-gold-500/50"
                    }`}
                  >
                    <span className="text-xl">{hive.flag}</span>
                    <span>{hive.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full btn-gold"
              isLoading={isLoading}
            >
              {selectedHive === "mexico"
                ? "Crear mi cuenta"
                : "Créer mon compte"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-leather-400" />
            <span className="mx-3 text-leather-400 text-xs">ou</span>
            <div className="flex-grow border-t border-leather-400" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 mb-4"
            style={{
              background: "#ffffff",
              border: "2px solid #dadce0",
              color: "#3c4043",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            }}
            aria-label="Continuer avec Google"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </button>

          {/* Continue as Guest Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full border-2 border-[rgba(244,196,48,0.3)] bg-transparent text-gold-400 hover:bg-[rgba(244,196,48,0.1)]"
            onClick={() => {
              enterGuestMode();
              const alreadyOnboarded =
                localStorage.getItem("zyeute_onboarded") === "1";
              navigate(alreadyOnboarded ? "/feed" : "/onboarding");
            }}
            aria-label="Continuer en tant qu'invité"
          >
            Continuer en tant qu'invité
          </Button>

          {/* Terms */}
          <p className="text-center text-leather-400 text-xs mt-6">
            En t&apos;inscrivant, tu acceptes nos{" "}
            <Link to="/legal/terms" className="text-gold-400 hover:underline">
              Conditions d&apos;utilisation
            </Link>{" "}
            et notre{" "}
            <Link to="/legal/privacy" className="text-gold-400 hover:underline">
              Politique de confidentialité
            </Link>
          </p>

          {/* Login link */}
          <p className="text-center text-white/80 text-sm mt-6 embossed">
            Déjà un compte?{" "}
            <Link
              to="/login"
              className="text-gold-400 hover:underline font-semibold"
            >
              Connecte-toi
            </Link>
          </p>
        </div>

        {/* Quebec Pride */}
        <div className="text-center mt-6 text-leather-400 text-sm">
          <p className="flex items-center justify-center gap-2 embossed">
            <span className="text-gold-500">⚜️</span>
            <span>Bienvenue dans la famille québécoise</span>
            <span className="text-gold-500">⚜️</span>
          </p>
        </div>

        {/* Legal Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center space-y-1">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Zyeuté™ — Tous droits réservés.{" "}
            <a
              href="mailto:zyeutequebec@gmail.com"
              className="hover:text-gold-400 transition-colors"
            >
              zyeutequebec@gmail.com
            </a>
          </p>
          <p className="text-xs text-white/20 px-4 leading-relaxed">
            Zyeuté™ est une marque de commerce. Zyeuté n&apos;est pas
            responsable du contenu publié par les utilisateurs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
