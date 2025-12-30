/**
 * Profile Edit Settings Page
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
import { logger } from "../../lib/logger";

const profileEditSettingsLogger = logger.withContext("ProfileEditSettings");

export const ProfileEditSettings: React.FC = () => {
  const { tap } = useHaptics();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    bio: "",
    city: "",
    region: "",
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setFormData({
            username: currentUser.username || "",
            display_name: currentUser.display_name || "",
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

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          city: formData.city,
          region: formData.region,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profil mis à jour! ✨");
      // Refresh user data
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

    tap();
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Photo de profil mise à jour! ✨");
      const updatedUser = await getCurrentUser();
      if (updatedUser) setUser(updatedUser);
    } catch (error: any) {
      profileEditSettingsLogger.error("Error updating avatar:", error);
      toast.error("Erreur lors du téléversement");
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
                src={user?.avatar_url}
                size="xl"
                isVerified={user?.is_verified}
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-gold-500 rounded-full p-2 cursor-pointer hover:bg-gold-600 transition-colors"
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
              />
            </div>
            <label
              htmlFor="avatar-upload"
              className="text-gold-400 text-sm font-semibold cursor-pointer hover:text-gold-300"
            >
              Changer la photo
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
            onChange={(e) =>
              setFormData({
                ...formData,
                username: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, ""),
              })
            }
            className="input-premium"
            placeholder="tonusername"
          />
          <p className="text-leather-400 text-xs mt-1">
            Lettres minuscules, chiffres et _ seulement
          </p>
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
            maxLength={50}
          />
        </div>

        {/* Bio */}
        <div className="leather-card rounded-xl p-4 stitched">
          <label className="block text-gold-400 font-semibold mb-2 text-sm">
            Bio
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            className="input-premium resize-none"
            rows={4}
            placeholder="Parle-nous de toi..."
            maxLength={2200}
          />
          <p className="text-leather-400 text-xs mt-1">
            {formData.bio.length}/2200 caractères
          </p>
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
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
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
