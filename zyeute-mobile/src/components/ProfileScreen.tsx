import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Flame,
  Coins,
  Settings,
  ChevronRight,
  LayoutGrid,
  Bookmark,
  Users,
  ShieldCheck,
  Trophy,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { getCurrentUser } from "../services/api";
import { User } from "../types";

const { width } = Dimensions.get("window");

export const ProfileScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "vault">("posts");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const userData = await getCurrentUser();
    // For demo purposes, if no user is logged in, show a prestige mock
    setUser(
      userData || {
        id: "demo",
        username: "Souverain_Alpha",
        displayName: "Brandon Lacoste",
        avatarUrl:
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
        karmaCredits: 12500,
        cashCredits: 4500,
        bio: "Bâtisseur du Swarm. 🦫\nSouveraineté Digitale ou rien. ⚜️",
      },
    );
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Background Gradient */}
      <LinearGradient
        colors={[Colors.leatherDark, Colors.background]}
        style={styles.headerBackground}
      >
        <SafeAreaView>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconButton}>
              <ShieldCheck size={24} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Settings size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarStitching} />
              <Image
                source={{
                  uri: user?.avatarUrl || "https://via.placeholder.com/150",
                }}
                style={styles.avatar}
              />
              <View style={styles.trophyBadge}>
                <Trophy size={12} color="#000" />
              </View>
            </View>

            <Text style={styles.displayName}>{user?.displayName}</Text>
            <Text style={styles.username}>@{user?.username}</Text>
            <Text style={styles.bio}>{user?.bio}</Text>

            {/* Economy Cards */}
            <View style={styles.economyRow}>
              <BlurView intensity={40} tint="dark" style={styles.statsCard}>
                <LinearGradient
                  colors={["rgba(255,191,0,0.1)", "transparent"]}
                  style={styles.statsGradient}
                >
                  <Flame
                    size={20}
                    color={Colors.primary}
                    fill={Colors.primary}
                  />
                  <Text style={styles.statsValue}>
                    {user?.karmaCredits?.toLocaleString()}
                  </Text>
                  <Text style={styles.statsLabel}>SCORE FEU</Text>
                </LinearGradient>
              </BlurView>

              <BlurView intensity={40} tint="dark" style={styles.statsCard}>
                <LinearGradient
                  colors={["rgba(255,215,0,0.1)", "transparent"]}
                  style={styles.statsGradient}
                >
                  <Coins size={20} color="#FFD700" />
                  <Text style={styles.statsValue}>
                    {((user?.cashCredits || 0) / 100).toFixed(2)}$
                  </Text>
                  <Text style={styles.statsLabel}>ZYEUTÉ COINS</Text>
                </LinearGradient>
              </BlurView>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Main Content Areas */}
      <View style={styles.content}>
        {/* Progress Bar (Experience) */}
        <View style={styles.levelContainer}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelText}>CITOYEN RANG 12</Text>
            <Text style={styles.levelProgress}>840 / 1000 XP</Text>
          </View>
          <View style={styles.progressBarBg}>
            <LinearGradient
              colors={[Colors.primary, "#DAA520"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressBarFill, { width: "84%" }]}
            />
          </View>
        </View>

        {/* Action Grid */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "posts" && styles.activeTab]}
            onPress={() => setActiveTab("posts")}
          >
            <LayoutGrid
              size={24}
              color={activeTab === "posts" ? Colors.primary : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "posts" && styles.activeTabText,
              ]}
            >
              MES POSTS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "vault" && styles.activeTab]}
            onPress={() => setActiveTab("vault")}
          >
            <Bookmark
              size={24}
              color={activeTab === "vault" ? Colors.primary : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "vault" && styles.activeTabText,
              ]}
            >
              MA VOÛTE
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty State / Grid Placeholder */}
        <View style={styles.gridPlaceholder}>
          <View style={styles.emptyStitching} />
          <Text style={styles.emptyText}>
            Bientôt : Vos publications précieuses apparaîtront ici.
          </Text>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>PUBLIER DANS LE SWARM</Text>
          </TouchableOpacity>
        </View>

        {/* System Settings Links */}
        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsLeft}>
              <Users size={20} color={Colors.textMuted} />
              <Text style={styles.settingsText}>Gérer mon Hive</Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsLeft}>
              <ShieldCheck size={20} color={Colors.textMuted} />
              <Text style={styles.settingsText}>Sécurité & Souveraineté</Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  headerBackground: {
    paddingBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  topActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  profileHeader: {
    alignItems: "center",
    marginTop: 10,
  },
  avatarWrapper: {
    position: "relative",
    padding: 8,
  },
  avatarStitching: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 60,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.leatherDark,
  },
  trophyBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.leatherDark,
  },
  displayName: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "900",
    marginTop: 15,
    letterSpacing: 1,
  },
  username: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
    opacity: 0.8,
  },
  bio: {
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
    marginTop: 12,
    lineHeight: 20,
    fontSize: 14,
  },
  economyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: width - 40,
    marginTop: 25,
  },
  statsCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  statsGradient: {
    padding: 15,
    alignItems: "center",
  },
  statsValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 8,
  },
  statsLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
    letterSpacing: 1,
  },
  content: {
    padding: 20,
  },
  levelContainer: {
    marginBottom: 30,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  levelText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  levelProgress: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 5,
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 8,
  },
  activeTabText: {
    color: Colors.primary,
  },
  gridPlaceholder: {
    height: 200,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    position: "relative",
    marginBottom: 30,
  },
  emptyStitching: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderStyle: "dashed",
    borderRadius: 15,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
  },
  ctaButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 12,
  },
  settingsSection: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    padding: 10,
  },
  settingsItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 15,
  },
});
