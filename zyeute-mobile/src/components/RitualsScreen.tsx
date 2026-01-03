import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { getCurrentUser } from "../services/api";
import { LinearGradient } from "expo-linear-gradient";
import {
  Trophy,
  Gamepad2,
  Zap,
  Coins,
  History,
  ArrowUpRight,
  Flame,
} from "lucide-react-native";
import { Alert } from "react-native";
import { Colors } from "../theme/colors";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");

export const RitualsScreen = () => {
  const [balance, setBalance] = React.useState({ cash: 0, karma: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadEconomy();
  }, []);

  const loadEconomy = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setBalance({
          cash: user.cashCredits || 0,
          karma: user.karmaCredits || 0,
        });
      }
    } catch (e) {
      console.warn("Economy sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.leatherDark, Colors.background]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>SALLE DES RITUELS</Text>
            <View style={styles.balanceContainer}>
              <Coins size={16} color={Colors.primary} />
              <Text style={styles.balanceValue}>
                {balance.cash.toLocaleString()}$
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Ritual Buttons */}
        <View style={styles.ritualGrid}>
          <TouchableOpacity
            style={styles.ritualCard}
            onPress={() =>
              Alert.alert(
                "Poutine Stack",
                "Lancement du moteur Royale... Préparez-vous à empiler!",
              )
            }
          >
            <View style={styles.cardStitching} />
            <LinearGradient
              colors={["rgba(255,191,0,0.15)", "transparent"]}
              style={styles.cardGradient}
            >
              <Gamepad2 size={32} color={Colors.primary} />
              <Text style={styles.ritualName}>POUTINE STACK</Text>
              <Text style={styles.ritualDesc}>Gagnez du Score Feu</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ritualCard}
            onPress={() =>
              Alert.alert(
                "HiveTap",
                "Mode NFC activé. Approchez votre téléphone d'un Beacon Zyeuté.",
              )
            }
          >
            <View style={styles.cardStitching} />
            <LinearGradient
              colors={["rgba(255,191,0,0.15)", "transparent"]}
              style={styles.cardGradient}
            >
              <Zap size={32} color={Colors.primary} />
              <Text style={styles.ritualName}>HIVETAP</Text>
              <Text style={styles.ritualDesc}>Activer un Beacon</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* The Ledger Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <History size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>LE GRAND LIVRE (LEDGER)</Text>
          </View>

          <BlurView intensity={30} tint="dark" style={styles.ledgerCard}>
            <View style={styles.ledgerStitching} />

            <View style={styles.ledgerItem}>
              <View
                style={[
                  styles.ledgerIcon,
                  { backgroundColor: "rgba(68, 255, 68, 0.1)" },
                ]}
              >
                <ArrowUpRight size={16} color={Colors.success} />
              </View>
              <View style={styles.ledgerInfo}>
                <Text style={styles.ledgerType}>Récompense Quotidienne</Text>
                <Text style={styles.ledgerDate}>Aujourd'hui, 08:30</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: Colors.success }]}>
                +50$
              </Text>
            </View>

            <View style={styles.ledgerItem}>
              <View
                style={[
                  styles.ledgerIcon,
                  { backgroundColor: "rgba(255, 191, 0, 0.1)" },
                ]}
              >
                <Flame size={16} color={Colors.primary} />
              </View>
              <View style={styles.ledgerInfo}>
                <Text style={styles.ledgerType}>Bonus Karma (Viralité)</Text>
                <Text style={styles.ledgerDate}>Hier, 22:15</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: Colors.primary }]}>
                +125 Pts
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewFullLedger}
              onPress={() =>
                Alert.alert(
                  "Audit",
                  "Génération du rapport de souveraineté en cours...",
                )
              }
            >
              <Text style={styles.viewFullLedgerText}>
                VOIR TOUTES LES TRANSACTIONS
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Tournament Banner */}
        <TouchableOpacity
          style={styles.tournamentBanner}
          onPress={() =>
            Alert.alert(
              "Tournoi",
              "Inscription confirmée pour le prochain Tournoi Prestige.",
            )
          }
        >
          <View style={styles.bannerStitching} />
          <Trophy size={40} color={Colors.primary} style={styles.bannerIcon} />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>TOURNOI PRESTIGE</Text>
            <Text style={styles.bannerSubtitle}>
              Cagnotte de 2,500$ à gagner
            </Text>
          </View>
          <View style={styles.joinButton}>
            <Text style={styles.joinButtonText}>REJOINDRE</Text>
          </View>
        </TouchableOpacity>

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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.3)",
  },
  balanceValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 6,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ritualGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  ritualCard: {
    width: (width - 60) / 2,
    backgroundColor: Colors.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    elevation: 5,
  },
  cardGradient: {
    padding: 20,
    alignItems: "center",
  },
  cardStitching: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderColor: Colors.stitching,
    borderStyle: "dashed",
    borderRadius: 12,
    pointerEvents: "none",
  },
  ritualName: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginTop: 15,
    letterSpacing: 1,
  },
  ritualDesc: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: "center",
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
  ledgerCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  ledgerStitching: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.1)",
    borderStyle: "dashed",
    borderRadius: 12,
  },
  ledgerItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  ledgerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  ledgerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  ledgerType: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  ledgerDate: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  ledgerAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  viewFullLedger: {
    marginTop: 10,
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  viewFullLedgerText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  tournamentBanner: {
    backgroundColor: "rgba(255,191,0,0.05)",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.2)",
    position: "relative",
  },
  bannerStitching: {
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
  bannerIcon: {
    marginRight: 15,
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
  },
  bannerSubtitle: {
    color: Colors.text,
    fontSize: 12,
    opacity: 0.7,
  },
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  joinButtonText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "900",
  },
});
