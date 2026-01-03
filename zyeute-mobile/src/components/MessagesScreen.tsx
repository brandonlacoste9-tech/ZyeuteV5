import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, MessageSquare, Plus, MoreVertical } from "lucide-react-native";
import { Colors } from "../theme/colors";

export const MessagesScreen = () => {
  const CHATS = [
    {
      id: "1",
      name: "Jean-Pascal",
      lastMsg: "T'as vu ma nouvelle poutine?",
      time: "14:20",
      unread: 2,
      avatar:
        "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100",
      online: true,
    },
    {
      id: "2",
      name: "Sébastien V.",
      lastMsg: "Rendez-vous à la Ruche ce soir.",
      time: "10:15",
      unread: 0,
      avatar:
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
      online: false,
    },
    {
      id: "3",
      name: "Marie-Lou",
      lastMsg: "⚜️ Le Swarm est en feu!",
      time: "Hier",
      unread: 0,
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      online: true,
    },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.leatherDark]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>DIRECTS</Text>
            <TouchableOpacity style={styles.newChatButton}>
              <Plus size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Search size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Chercher une discussion..."
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.chatList}>
        {CHATS.map((chat) => (
          <TouchableOpacity key={chat.id} style={styles.chatItem}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: chat.avatar }} style={styles.avatar} />
              {chat.online && <View style={styles.onlineDot} />}
            </View>

            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>
              <View style={styles.chatFooter}>
                <Text style={styles.lastMsg} numberOfLines={1}>
                  {chat.lastMsg}
                </Text>
                {chat.unread > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Ti-Guy Promo inside DMs */}
        <TouchableOpacity style={styles.tiguyPromo}>
          <LinearGradient
            colors={["rgba(255,191,0,0.1)", "transparent"]}
            style={styles.promoGradient}
          >
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
              }}
              style={[styles.avatar, { borderColor: Colors.primary }]}
            />
            <View style={styles.promoTextContainer}>
              <Text style={styles.promoTitle}>Besoins d'aide?</Text>
              <Text style={styles.promoSubtitle}>
                Ti-Guy est prêt à jaser avec toi.
              </Text>
            </View>
            <TouchableOpacity style={styles.chatTiGuyBtn}>
              <MessageSquare size={16} color="#000" />
            </TouchableOpacity>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,191,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBarWrapper: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.text,
    fontSize: 14,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: "row",
    padding: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  chatTime: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastMsg: {
    color: Colors.textMuted,
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  unreadText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "800",
  },
  tiguyPromo: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.2)",
  },
  promoGradient: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  promoTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  promoTitle: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  promoSubtitle: {
    color: Colors.text,
    fontSize: 12,
    opacity: 0.7,
  },
  chatTiGuyBtn: {
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
