import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search as SearchIcon,
  MapPin,
  Globe,
  TrendingUp,
  Users,
} from "lucide-react-native";
import { Colors } from "../theme/colors";

const { width } = Dimensions.get("window");

const HIVES = [
  {
    id: "quebec",
    name: "Québec Hive",
    flag: "⚜️",
    tagline: "Le Social Premium",
  },
  {
    id: "mexico",
    name: "Ritual México",
    flag: "🇲🇽",
    tagline: "El Swarm Azteca",
  },
  {
    id: "brazil",
    name: "Conexão Brasil",
    flag: "🇧🇷",
    tagline: "O Ritmo do Brasil",
  },
  {
    id: "argentina",
    name: "Zarpado AR",
    flag: "🇦🇷",
    tagline: "Pasión Digital",
  },
];

export const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeHive, setActiveHive] = useState("quebec");

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.leatherDark, Colors.background]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBarStitching} />
            <View style={styles.searchBar}>
              <SearchIcon size={20} color={Colors.primary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Explorer le Swarm..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hive Switcher (The Chameleon Core) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>CHANGER DE HIVE</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.hiveList}
          >
            {HIVES.map((hive) => (
              <TouchableOpacity
                key={hive.id}
                style={[
                  styles.hiveCard,
                  activeHive === hive.id && styles.activeHiveCard,
                ]}
                onPress={() => setActiveHive(hive.id)}
              >
                <Text style={styles.hiveFlag}>{hive.flag}</Text>
                <Text style={styles.hiveName}>{hive.name}</Text>
                <Text style={styles.hiveTagline}>{hive.tagline}</Text>
                {activeHive === hive.id && <View style={styles.activeDot} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Trending Sections */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>TENDANCES ACTUELLES</Text>
          </View>
          <View style={styles.trendingGrid}>
            <TouchableOpacity style={styles.trendingItem}>
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.trendingGradient}
              >
                <Text style={styles.trendingTag}>#SwarmVibe</Text>
              </LinearGradient>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=200",
                }}
                style={styles.trendingImage}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.trendingItem}>
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.trendingGradient}
              >
                <Text style={styles.trendingTag}>#PrestigeQC</Text>
              </LinearGradient>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1504917595217-d4dc5f9c4739?auto=format&fit=crop&q=80&w=200",
                }}
                style={styles.trendingImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearby Swarm */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>SWARM À PROXIMITÉ</Text>
          </View>
          <View style={styles.nearbyCard}>
            <View style={styles.nearbyStitching} />
            <Users size={24} color={Colors.primary} />
            <View style={styles.nearbyInfo}>
              <Text style={styles.nearbyTitle}>12 Citoyens actifs</Text>
              <Text style={styles.nearbySubtitle}>
                Dans un rayon de 5km de vous.
              </Text>
            </View>
            <TouchableOpacity style={styles.mapButton}>
              <Text style={styles.mapButtonText}>VOIR CARTE</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.stitching,
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,
    position: "relative",
  },
  searchBarStitching: {
    position: "absolute",
    top: -5,
    left: 15,
    right: 15,
    bottom: -5,
    borderWidth: 1,
    borderColor: Colors.stitching,
    borderStyle: "dashed",
    borderRadius: 25,
    pointerEvents: "none",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingHorizontal: 15,
    height: 45,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.text,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 10,
    letterSpacing: 2,
  },
  hiveList: {
    flexDirection: "row",
  },
  hiveCard: {
    width: 140,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
  },
  activeHiveCard: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  hiveFlag: {
    fontSize: 32,
    marginBottom: 10,
  },
  hiveName: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  hiveTagline: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: "center",
  },
  activeDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  trendingGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  trendingItem: {
    width: (width - 55) / 2,
    height: 150,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  trendingImage: {
    width: "100%",
    height: "100%",
  },
  trendingGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    justifyContent: "flex-end",
    padding: 12,
    zIndex: 1,
  },
  trendingTag: {
    color: Colors.text,
    fontWeight: "800",
    fontSize: 14,
  },
  nearbyCard: {
    backgroundColor: "rgba(255,191,0,0.05)",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.1)",
    position: "relative",
  },
  nearbyStitching: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.1)",
    borderStyle: "dashed",
    borderRadius: 15,
  },
  nearbyInfo: {
    marginLeft: 15,
    flex: 1,
  },
  nearbyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  nearbySubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  mapButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  mapButtonText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
});
