import React from "react";
import { useNavigate } from "react-router-dom";
import { useSettingsPreferences } from "@/hooks/useSettingsPreferences";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import { useTranslation } from "@/i18n";

export const LanguageSettings: React.FC = () => {
  const navigate = useNavigate();
  const { preferences, setPreference } = useSettingsPreferences();
  const { tap, success } = useHaptics();
  const { t } = useTranslation();

  const handleLanguageSelect = (lang: "fr" | "en") => {
    tap();
    setPreference("language", lang);
    success();

    toast.success(
      `${lang === "fr" ? "Langue changée en Français" : "Language changed to English"}! ✨`,
    );

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-gold-500/30">
        <div className="max-w-2xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => {
              tap();
              navigate(-1);
            }}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-leather-900 border border-gold-500/20 text-gold-500 hover:bg-gold-500 hover:text-black transition-all"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 bg-clip-text text-transparent embossed flex-1">
            {preferences.language === "en" ? "Language" : "Langue"}
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Quebec Pride Banner */}
        <div className="listItem-premium rounded-3xl p-8 border border-gold-500/20 shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent pointer-events-none"></div>
          <div className="relative text-center">
            <div className="text-6xl mb-6 filter drop-shadow-[0_0_15px_rgba(255,191,0,0.4)]">
              ⚜️
            </div>
            <h2 className="text-2xl font-black text-gold-400 mb-3 tracking-tight">
              {preferences.language === "en"
                ? "Zyeuté is French First!"
                : "Zyeuté, c'est en français!"}
            </h2>
            <p className="text-leather-200 text-lg leading-relaxed max-w-sm mx-auto">
              {preferences.language === "en"
                ? "The social app of Quebec, made here for our people."
                : "L'app sociale du Québec, fait ici pour nous autres."}
            </p>
          </div>
        </div>

        {/* Selection Area */}
        <div className="space-y-4">
          <p className="text-gold-500/60 text-xs font-bold uppercase tracking-[0.2em] px-2 mb-4">
            {preferences.language === "en"
              ? "Select Language"
              : "Choisir la langue"}
          </p>

          {/* French Option */}
          <button
            onClick={() => handleLanguageSelect("fr")}
            className={`w-full group relative flex items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-300 ${
              preferences.language === "fr"
                ? "bg-gold-500/10 border-gold-500 shadow-[0_0_30px_rgba(255,191,0,0.2)]"
                : "bg-leather-900/40 border-gold-500/10 hover:border-gold-500/30"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-leather-800 flex items-center justify-center text-4xl shadow-inner border border-gold-500/10 group-hover:scale-110 transition-transform">
              🇨🇦
            </div>
            <div className="flex-1 text-left">
              <p className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors">
                Français québécois
              </p>
              <p className="text-leather-400 font-medium">
                La langue de chez nous! ⚜️
              </p>
            </div>
            {preferences.language === "fr" && (
              <div className="text-gold-500">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>

          {/* English Option */}
          <button
            onClick={() => handleLanguageSelect("en")}
            className={`w-full group relative flex items-center gap-6 p-6 rounded-3xl border-2 transition-all duration-300 ${
              preferences.language === "en"
                ? "bg-gold-500/10 border-gold-500 shadow-[0_0_30px_rgba(255,191,0,0.2)]"
                : "bg-leather-900/40 border-gold-500/10 hover:border-gold-500/30"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-leather-800 flex items-center justify-center text-4xl shadow-inner border border-gold-500/10 group-hover:scale-110 transition-transform">
              🇺🇸
            </div>
            <div className="flex-1 text-left">
              <p className="text-xl font-bold text-white group-hover:text-gold-400 transition-colors">
                English Interface
              </p>
              <p className="text-leather-400 font-medium">
                International version
              </p>
            </div>
            {preferences.language === "en" && (
              <div className="text-gold-500">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Info Card */}
        <div className="leather-card rounded-2xl p-6 stitched-subtle opacity-60">
          <p className="text-leather-300 text-sm italic text-center">
            &ldquo;Ti-Guy te parlera toujours en joual, peu importe la langue
            choisie. C&apos;est son identité!&rdquo; 🦫✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSettings;
