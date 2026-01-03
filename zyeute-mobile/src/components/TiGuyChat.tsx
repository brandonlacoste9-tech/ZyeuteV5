import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  SafeAreaView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Send,
  Menu,
  X,
  Zap,
  MessageSquare,
  History,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { chatWithTiGuy } from "../services/api";

interface Message {
  id: string;
  text: string;
  sender: "user" | "tiguy";
  timestamp: Date;
}

export const TiGuyChat = () => {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Salut mon chum! C'est Ti-Guy. Prêt pour une poutine de contenu? 🦫",
      sender: "tiguy",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const menuAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    const toValue = showHistory ? 0 : 1;
    Animated.spring(menuAnim, {
      toValue,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
    setShowHistory(!showHistory);
  };

  const sendMessage = async () => {
    if (inputText.trim() === "") return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    try {
      const response = await chatWithTiGuy(inputText);
      const tiguyMsg: Message = {
        id: Date.now().toString(),
        text: response.response || response.text || "C'est du prestige!",
        sender: "tiguy",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, tiguyMsg]);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.messageWrapper,
          isUser ? styles.userMessageWrapper : styles.tiguyMessageWrapper,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
              }}
              style={styles.avatar}
            />
            <View style={styles.avatarStitching} />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.tiguyBubble,
          ]}
        >
          {/* Internal stitching for bubbles */}
          <View style={styles.bubbleStitching} />

          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {item.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.tanLeather, Colors.tanAccent]}
        style={styles.background}
      >
        {/* Main Leather Stitching */}
        <View style={styles.globalStitching} />

        <SafeAreaView style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={toggleMenu}>
              <History size={24} color={Colors.tanStitching} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>TI-GUY</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>AU POSTE</Text>
              </View>
            </View>
            <TouchableOpacity>
              <MessageSquare size={24} color={Colors.tanStitching} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Tiny Menu / History Mock */}
        {showHistory && (
          <Animated.View
            style={[
              styles.historyMenu,
              {
                opacity: menuAnim,
                transform: [
                  {
                    translateY: menuAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.historyTitle}>DERNIERS ÉCHANGES</Text>
            <TouchableOpacity style={styles.historyItem}>
              <Text style={styles.historyItemText}>
                • Discussion sur la poutine...
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.historyItem}>
              <Text style={styles.historyItemText}>
                • Le secret du castor...
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View
            style={[
              styles.inputContainer,
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.inputStitching} />
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Dis-moi de quoi, mon chum..."
                placeholderTextColor="rgba(62, 39, 35, 0.4)"
                multiline
              />
              <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                <LinearGradient
                  colors={[Colors.tanStitching, Colors.tanText]}
                  style={styles.sendButtonGradient}
                >
                  <Send size={18} color={Colors.tanLeather} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <Text style={styles.footerBranding}>⚜️ MANUFACTURE ZYEUTÉ 🦫</Text>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  globalStitching: {
    position: "absolute",
    top: 60,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 2,
    borderColor: "rgba(139, 94, 60, 0.2)",
    borderStyle: "dashed",
    borderRadius: 40,
    pointerEvents: "none",
  },
  header: {
    backgroundColor: "rgba(236, 217, 197, 0.8)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.tanStitching,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    paddingVertical: 12,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.tanText,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 3,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  statusText: {
    color: Colors.tanStitching,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  historyMenu: {
    backgroundColor: "rgba(215, 181, 141, 0.95)",
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.tanStitching,
    zIndex: 100,
  },
  historyTitle: {
    color: Colors.tanText,
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 10,
    opacity: 0.7,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(139, 94, 60, 0.2)",
  },
  historyItemText: {
    color: Colors.tanText,
    fontSize: 13,
    fontWeight: "600",
  },
  messageList: {
    padding: 25,
    paddingTop: 30,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 24,
    maxWidth: "88%",
  },
  userMessageWrapper: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  tiguyMessageWrapper: {
    alignSelf: "flex-start",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.tanStitching,
  },
  avatarStitching: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 1,
    borderColor: "rgba(139, 94, 60, 0.3)",
    borderStyle: "dashed",
    borderRadius: 25,
  },
  messageBubble: {
    padding: 15,
    borderRadius: 25,
    position: "relative",
    shadowColor: Colors.tanStitching,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bubbleStitching: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderWidth: 1,
    borderColor: "rgba(139, 94, 60, 0.15)",
    borderStyle: "dashed",
    borderRadius: 20,
    pointerEvents: "none",
  },
  userBubble: {
    backgroundColor: Colors.tanStitching,
    borderBottomRightRadius: 5,
  },
  tiguyBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(139, 94, 60, 0.1)",
  },
  messageText: {
    color: Colors.tanText,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  userMessageText: {
    color: Colors.tanLeather,
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 10,
    color: Colors.tanStitching,
    alignSelf: "flex-end",
    marginTop: 6,
    fontWeight: "700",
    opacity: 0.6,
  },
  userTimestamp: {
    color: Colors.tanLeather,
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: "rgba(236, 217, 197, 0.95)",
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: Colors.tanStitching,
  },
  inputStitching: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: 1,
    borderColor: "rgba(139, 94, 60, 0.2)",
    borderStyle: "dashed",
    borderRadius: 20,
    pointerEvents: "none",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139, 94, 60, 0.05)",
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(139, 94, 60, 0.2)",
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    color: Colors.tanText,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    fontWeight: "600",
  },
  sendButton: {
    marginLeft: 12,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  footerBranding: {
    textAlign: "center",
    color: Colors.tanStitching,
    fontSize: 11,
    fontWeight: "900",
    marginTop: 12,
    letterSpacing: 2,
    opacity: 0.6,
  },
});
