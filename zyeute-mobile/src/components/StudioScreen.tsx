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
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Sparkles,
  Video as VideoIcon,
  Image as ImageIcon,
  Send,
  Cpu,
  Zap,
  ChevronRight,
  Flame,
  Layout,
  Eye,
  Camera,
} from "lucide-react-native";
import { Colors } from "../theme/colors";
import { BlurView } from "expo-blur";
import {
  generateImage,
  generateVideo,
  composePost,
  analyzeImage,
} from "../services/api";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

export const StudioScreen = () => {
  const [activeMode, setActiveMode] = useState<
    "flux" | "kling" | "compose" | "vision"
  >("flux");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (activeMode !== "vision" && !prompt.trim()) {
      Alert.alert("Erreur", "Le prompt est vide, mon chum!");
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      let data;
      if (activeMode === "flux") {
        data = await generateImage(prompt, "flux");
      } else if (activeMode === "kling") {
        data = await generateVideo(prompt, "kling");
      } else if (activeMode === "compose") {
        data = await composePost(prompt);
      } else if (activeMode === "vision" && selectedImage) {
        // Vision Logic handled in pickImage but if specific "Re-analyze" button needed
        data = await analyzeImage(selectedImage);
      }
      setResult(data);
    } catch (error) {
      Alert.alert("Échec", "La génération a planté. Réessaie.");
    } finally {
      setIsGenerating(false);
    }
  };

  const pickImage = async (source: "camera" | "library") => {
    let result;
    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission requise", "On a besoin de tes yeux pour voir!");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3], // or 9:16 for full screen
        quality: 0.5,
        base64: true,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true,
      });
    }

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setSelectedImage(result.assets[0].base64);
      setIsGenerating(true); // Auto-start analysis
      setResult(null);

      try {
        // Determine mime type (fallback to jpeg)
        const uri = result.assets[0].uri;
        const mimeType = uri.endsWith("png") ? "image/png" : "image/jpeg";
        // Prefix logic depending on if API needs raw or data URI
        // The backend implementation strips the header, so we can send raw or full.
        // Let's send raw base64.
        const analysisData = await analyzeImage(result.assets[0].base64);
        setResult(analysisData);
      } catch (e) {
        Alert.alert("Erreur", "Ti-Guy n'a pas pu analyser l'image.");
      } finally {
        setIsGenerating(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.leatherDark]}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>HIVE STUDIO</Text>
              <Text style={styles.headerSubtitle}>
                {activeMode === "vision"
                  ? "Perception Ti-Guy (Gemini Vision)"
                  : "Propulsé par Kling & Flux"}
              </Text>
            </View>
            <Sparkles size={24} color={Colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              activeMode === "flux" && styles.modeBtnActive,
            ]}
            onPress={() => setActiveMode("flux")}
          >
            <ImageIcon
              size={20}
              color={activeMode === "flux" ? "#000" : Colors.textMuted}
            />
            <Text
              style={[
                styles.modeText,
                activeMode === "flux" && styles.modeTextActive,
              ]}
            >
              FLUX
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              activeMode === "kling" && styles.modeBtnActive,
            ]}
            onPress={() => setActiveMode("kling")}
          >
            <VideoIcon
              size={20}
              color={activeMode === "kling" ? "#000" : Colors.textMuted}
            />
            <Text
              style={[
                styles.modeText,
                activeMode === "kling" && styles.modeTextActive,
              ]}
            >
              KLING
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              activeMode === "vision" && styles.modeBtnActive,
            ]}
            onPress={() => setActiveMode("vision")}
          >
            <Eye
              size={20}
              color={activeMode === "vision" ? "#000" : Colors.textMuted}
            />
            <Text
              style={[
                styles.modeText,
                activeMode === "vision" && styles.modeTextActive,
              ]}
            >
              VISION
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Area */}
        <BlurView intensity={20} tint="dark" style={styles.inputCard}>
          <View style={styles.stitching} />

          {activeMode === "vision" ? (
            <>
              <Text style={styles.inputLabel}>ANALYSE VISUELLE DU SWARM</Text>
              <View style={styles.visionControls}>
                <TouchableOpacity
                  style={styles.visionBtn}
                  onPress={() => pickImage("camera")}
                >
                  <View style={styles.visionIconContainer}>
                    <Camera size={32} color="#000" />
                  </View>
                  <Text style={styles.visionBtnText}>CAPTURER</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.visionBtn}
                  onPress={() => pickImage("library")}
                >
                  <View
                    style={[
                      styles.visionIconContainer,
                      { backgroundColor: Colors.card },
                    ]}
                  >
                    <ImageIcon size={32} color={Colors.primary} />
                  </View>
                  <Text
                    style={[styles.visionBtnText, { color: Colors.textMuted }]}
                  >
                    GALERIE
                  </Text>
                </TouchableOpacity>
              </View>

              {isGenerating && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.analyzingText}>TI-GUY ANALYSE...</Text>
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.inputLabel}>DESCRIPTION DU RITUEL</Text>
              <TextInput
                style={styles.input}
                placeholder={
                  activeMode === "flux"
                    ? "Un castor en smoking sur un iceberg..."
                    : "Une poutine qui explose en feux d'artifices..."
                }
                placeholderTextColor="rgba(255,255,255,0.2)"
                multiline
                value={prompt}
                onChangeText={setPrompt}
              />

              <TouchableOpacity
                style={styles.generateBtn}
                onPress={handleGenerate}
                disabled={isGenerating}
              >
                <LinearGradient
                  colors={[Colors.primary, "#D4AF37"]}
                  style={styles.generateGradient}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <>
                      <Text style={styles.generateBtnText}>
                        LANCER LA GÉNÉRATION
                      </Text>
                      <Cpu size={18} color="#000" />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </BlurView>

        {/* Result Area */}
        {result && (
          <View style={styles.resultContainer}>
            <Text style={styles.sectionTitle}>
              {activeMode === "vision"
                ? "PERCEPTION DE TI-GUY"
                : "RÉSULTAT DU SWARM"}
            </Text>
            <View style={styles.resultCard}>
              <View style={styles.stitching} />

              {/* Vision Result Display */}
              {activeMode === "vision" && selectedImage ? (
                <View>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                    style={styles.resultImage}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.9)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={styles.visionOverlay}>
                    <Text style={styles.visionCaption}>"{result.caption}"</Text>
                    <View style={styles.tagsContainer}>
                      {result.tags?.map((tag: string, i: number) => (
                        <View key={i} style={styles.tagChip}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                      ))}
                    </View>
                    <View style={styles.vibeContainer}>
                      <Text style={styles.vibeLabel}>
                        VIBE: {result.vibe_category?.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                // Standard Generation Result
                <>
                  {result.imageUrl || result.thumbnailUrl ? (
                    <Image
                      source={{ uri: result.imageUrl || result.thumbnailUrl }}
                      style={styles.resultImage}
                    />
                  ) : (
                    <View
                      style={[styles.resultImage, styles.placeholderResult]}
                    >
                      <Zap size={40} color={Colors.primary} />
                      <Text style={styles.placeholderText}>
                        Génération terminée avec succès.
                      </Text>
                    </View>
                  )}
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultPrompt}>{prompt}</Text>
                  </View>
                </>
              )}

              <View style={styles.resultInfo}>
                <TouchableOpacity style={styles.publishBtn}>
                  <Text style={styles.publishBtnText}>
                    PUBLIER DANS LE FEED
                  </Text>
                  <Flame size={16} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* AI Capabilities Cards */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>CAPACITÉS DU COEUR</Text>
          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Eye size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Gemini Vision 1.5</Text>
              <Text style={styles.infoDesc}>
                Analyse instantanée et captions en Joual.
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Zap size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Kling Video 1.5</Text>
              <Text style={styles.infoDesc}>
                Vidéo cinématique haute fidélité (5-10s).
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
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
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    marginTop: 10,
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: 20,
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 15,
    padding: 5,
    marginBottom: 20,
  },
  modeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 8,
    letterSpacing: 1,
  },
  modeTextActive: {
    color: "#000",
  },
  inputCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    position: "relative",
    minHeight: 200,
  },
  stitching: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,191,0,0.1)",
    borderStyle: "dashed",
    borderRadius: 15,
    pointerEvents: "none",
    zIndex: 1,
  },
  inputLabel: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 15,
  },
  input: {
    color: Colors.text,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: "top",
  },
  generateBtn: {
    marginTop: 20,
    borderRadius: 15,
    overflow: "hidden",
  },
  generateGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  generateBtnText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "900",
    marginRight: 10,
    letterSpacing: 1,
  },
  // Vision Styles
  visionControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: 20,
  },
  visionBtn: {
    alignItems: "center",
  },
  visionIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  visionBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  analyzingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
    zIndex: 10,
  },
  analyzingText: {
    color: Colors.primary,
    marginTop: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
  // Result Styles
  resultContainer: {
    marginTop: 30,
  },
  sectionTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 15,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  resultImage: {
    width: "100%",
    height: width * 0.8, // Taller for vision
    backgroundColor: "#000",
  },
  placeholderResult: {
    justifyContent: "center",
    alignItems: "center",
    height: width * 0.5,
  },
  placeholderText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 10,
  },
  resultInfo: {
    padding: 20,
  },
  resultPrompt: {
    color: Colors.text,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 20,
    opacity: 0.8,
  },
  visionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  visionCaption: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    marginBottom: 15,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  tagChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "800",
  },
  vibeContainer: {
    marginTop: 5,
  },
  vibeLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  publishBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  publishBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 8,
  },
  infoSection: {
    marginTop: 30,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,191,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  infoDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
