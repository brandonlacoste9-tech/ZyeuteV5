/**
 * Profile Edit Settings Page
 * FIXED: Now uses backend PATCH /api/users/me instead of direct Supabase writes
 *        (backend validates, checks username uniqueness, and handles camelCase→DB mapping)
 *        Avatar upload uses Supabase Storage with base64 fallback
 */

import React, { useState } from "react";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Avatar } from "@/components/Avatar";
import { supabase } from "@/lib/supabase";
import { QUEBEC_REGIONS } from "@/lib/quebecFeatures";
import { toast } from "@/components/Toast";
import { useHaptics } from "@/hooks/useHaptics";
import { getCurrentUser } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { logger } from "../../lib/logger";

const profileEditSettingsLogger = logger.withContext("ProfileEditSettings");

const API_BASE =
  import.meta.env.VITE_API_URL || "https://zyeute-backend.up.railway.app";

export const ProfileEditSettings: React.FC = () => {
  const { tap } = useHaptics();
  const { refreshUser } = useAuth() as any;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    city: "",
    region: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setFormData({
            username: currentUser.username || "",
            display_name:
              currentUser.display_name ||
              (currentUser as any).displayName ||
              "",
            bio: currentUser.bio || "",
            city: currentUser.city || "",
            region: currentUser.region || "",
          });
        }
      } catch (error) {
        profileEditSettingsLogger.error("Error fetching user:", error);
        toast.error("Erreur lors du chargement du profil");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.username.length < 3) {
      newErrors.username = "Minimum 3 caractères";
    } else if (!/^[a-z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Lettres minuscules, chiffres et _ seulement";
    }

    if (formData.bio.length > 2200) {
      newErrors.bio = "Maximum 2200 caractères";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      // Use backend PATCH /api/users/me — it handles camelCase mapping,
      // username uniqueness check, and Drizzle ORM field names correctly
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch(`${API_BASE}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          city: formData.city,
          region: formData.region || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setErrors({ username: body.error || "Nom d'utilisateur déjà pris" });
          return;
        }
        throw new Error(body.error || `Erreur ${res.status}`);
      }

      toast.success("Profil mis à jour! ✨");

      // Refresh auth context so Header/Profile reflect new data
      if (typeof refreshUser === "function") {
        await refreshUser();
      }

      const updatedUser = await getCurrentUser();
      if (updatedUser) setUser(updatedUser);
    } catch (error: any) {
      profileEditSettingsLogger.error("Error updating profile:", error);
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type and size (max 5 MB)
    if (!file.type.startsWith("image/")) {
      toast.error("Seulement les images sont acceptées");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La photo doit faire moins de 5 MB");
      return;
    }

    tap();
    setIsUploadingAvatar(true);

    try {
      let publicUrl: string | null = null;

      // Strategy 1: Try Supabase Storage
      try {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(filePath, file, { upsert: true });

        if (!uploadError) {
          const {
            data: { publicUrl: url },
          } = supabase.storage.from("media").getPublicUrl(filePath);
          publicUrl = url;
        } else {
          profileEditSettingsLogger.warn(
            "Supabase storage upload failed, trying backend:",
            uploadError.message,
          );
        }
      } catch (storageErr) {
        profileEditSettingsLogger.warn(
          "Supabase storage unavailable:",
          storageErr,
        );
      }

      // Strategy 2: Upload via backend if Supabase storage failed
      if (!publicUrl) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const formPayload = new FormData();
        formPayload.append("avatar", file);

        const uploadRes = await fetch(`${API_BASE}/api/users/me/avatar`, {
          method: "POST",
          headers: {
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
          credentials: "include",
          body: formPayload,
        });

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          publicUrl = data.avatar_url || data.avatarUrl;
        }
      }

      if (!publicUrl) {
        throw new Error("Impossible de téléverser la photo");
      }

      // Update the avatar_url via the backend
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const patchRes = await fetch(`${API_BASE}/api/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        credentials: "include",
        body: JSON.stringify({ avatar_url: publicUrl }),
      });

      if (!patchRes.ok) {
        throw new Error("Impossible de mettre à jour la photo de profil");
      }

      toast.success("Photo de profil mise à jour! ✨");

      if (typeof refreshUser === "function") {
        await refreshUser();
      }

      const updatedUser = await getCurrentUser();
      if (updatedUser) setUser(updatedUser);
    } catch (error: any) {
      profileEditSettingsLogger.error("Error updating avatar:", error);
      toast.error(error.message || "Erreur lors du téléversement");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black leather-overlay flex items-center justify-center">
        <div className="text-gold-400 animate-pulse">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black leather-overlay pb-20">
      <Header title="Modifier le profil" showBack={true} showSearch={false} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="leather-card rounded-xl p-6 stitched text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar
                src={user?.avatar_url || user?.avatarUrl}
                size="xl"
                isVerified={user?.is_verified || user?.isVerified}
              />
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <svg
                    className="w-8 h-8 text-gold-400 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 bg-gold-500 rounded-full p-2 cursor-pointer hover:bg-gold-600 transition-colors ${isUploadingAvatar ? "opacity-50 pointer-events-none" : ""}`}
              >
                <svg
                  className="w-5 h-5 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
                disabled={isUploadingAvatar}
              />
            </div>
            <label
              htmlFor="avatar-upload"
              className={`text-gold-400 text-sm font-semibold cursor-pointer hover:text-gold-300 ${isUploadingAvatar ? "opacity-50 pointer-events-none" : ""}`}
            >
              {isUploadingAvatar ? "Téléversement..." : "Changer la photo"}
            </label>
          </div>
        </div>

        {/* Username */}
        <div className="leather-card rounded-xl p-4 stitched">
          <label className="block text-gold-400 font-semibold mb-2 text-sm">
            Nom d&apos;utilisateur
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, username: "" }));
              setFormData({
                ...formData,
                username: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, ""),
              });
            }}
            className={`input-premium ${errors.username ? "border-red-500" : ""}`}
            placeholder="tonusername"
            maxLength={30}
          />
          {errors.username ? (
            <p className="text-red-400 text-xs mt-1">{errors.username}</p>
          ) : (
            <p className="text-leather-400 text-xs mt-1">
              Lettres minuscules, chiffres et _ seulement
            </p>
          )}
        </div>

        {/* Display Name */}
        <div className="leather-card rounded-xl p-4 stitched">
          <label className="block text-gold-400 font-semibold mb-2 text-sm">
            Nom d&apos;affichage
          </label>
          <input
            type="text"
            value={formData.display_name}
            onChange={(e) =>
              setFormData({ ...formData, display_name: e.target.value })
            }
            className="input-premium"
            placeholder="Ton nom"
            maxLength={100}
          />
        </div>

        {/* Bio */}
        <div className="leather-card rounded-xl p-4 stitched">
          <label className="block text-gold-400 font-semibold mb-2 text-sm">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => {
              setErrors((prev) => ({ ...prev, bio: "" }));
              setFormData({ ...formData, bio: e.target.value });
            }}
            className={`input-premium resize-none ${errors.bio ? "border-red-500" : ""}`}
            rows={4}
            placeholder="Parle-nous de toi..."
            maxLength={2200}
          />
          <div className="flex justify-between mt-1">
            {errors.bio && <p className="text-red-400 text-xs">{errors.bio}</p>}
            <p className="text-leather-400 text-xs ml-auto">
              {formData.bio.length}/2200 caractères
            </p>
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="leather-card rounded-xl p-4 stitched">
            <label className="block text-gold-400 font-semibold mb-2 text-sm">
              Région
            </label>
            <select
              value={formData.region}
              onChange={(e) =>
                setFormData({ ...formData, region: e.target.value })
              }
              className="input-premium"
            >
              <option value="">Sélectionne</option>
              {QUEBEC_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.emoji} {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="leather-card rounded-xl p-4 stitched">
            <label className="block text-gold-400 font-semibold mb-2 text-sm">
              Ville
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="input-premium"
              placeholder="Montréal"
              maxLength={100}
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isUploadingAvatar}
          className="w-full btn-gold py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default ProfileEditSettings;
