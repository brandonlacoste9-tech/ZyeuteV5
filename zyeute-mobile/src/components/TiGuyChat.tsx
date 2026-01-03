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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Send, Menu, X, Zap } from "lucide-react-native";
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
  const flatListRef = useRef<FlatList>(null);

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

    // Call live Ti-Guy backend
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
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
            }}
            style={styles.avatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.tiguyBubble,
          ]}
        >
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {item.text}
          </Text>
          <Text style={styles.timestamp}>
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
    <LinearGradient
      colors={[Colors.leatherDark, Colors.background]}
      style={styles.container}
    >
      {/* Stitching Line - Top */}
      <View style={styles.stitchingContainer}>
        <View style={styles.stitching} />
      </View>

      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity>
            <Menu size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>TI-GUY</Text>
            <View style={styles.statusContainer}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>EN LIGNE</Text>
            </View>
          </View>
          <TouchableOpacity>
            <X size={24} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Input Bar with Leather Aesthetic */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          {/* Internal Stitching for Input Bar */}
          <View style={styles.inputStitching} />

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Jase avec moi..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <LinearGradient
                colors={["#FFD700", "#DAA520"]}
                style={styles.sendButtonGradient}
              >
                <Send size={20} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerBranding}>⚜️ ZYEUTÉ SWARM 🦫</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stitchingContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    bottom: 10,
    pointerEvents: "none",
    zIndex: 1,
  },
  stitching: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.stitching,
    borderStyle: "dashed",
    borderRadius: 30,
    opacity: 0.5,
  },
  header: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderBottomWidth: 1,
    borderBottomColor: Colors.stitching,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 2,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: 4,
  },
  statusText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  messageList: {
    padding: 20,
    paddingTop: 40,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 20,
    maxWidth: "85%",
  },
  userMessageWrapper: {
    alignSelf: "flex-end",
    flexDirection: "row-reverse",
  },
  tiguyMessageWrapper: {
    alignSelf: "flex-start",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  tiguyBubble: {
    backgroundColor: Colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  messageText: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#000",
    fontWeight: "600",
  },
  timestamp: {
    fontSize: 10,
    color: "rgba(0,0,0,0.5)",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: Colors.leatherDark,
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    position: "relative",
  },
  inputStitching: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: 1,
    borderColor: Colors.stitching,
    borderStyle: "dashed",
    borderRadius: 15,
    pointerEvents: "none",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.2)",
    paddingLeft: 15,
    paddingRight: 5,
    paddingVertical: 5,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    marginLeft: 10,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  footerBranding: {
    textAlign: "center",
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    marginTop: 10,
    letterSpacing: 2,
    opacity: 0.5,
  },
});
