import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Colors } from "../theme/colors";
import { getSovereignFeed } from "../services/api";
import { Post, User } from "../types";
import { Heart, MessageCircle, Share2, Zap } from "lucide-react-native";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

interface TiGuyInsightsProps {
  insights: string;
}

const TiGuyInsights: React.FC<TiGuyInsightsProps> = ({ insights }) => {
  return (
    <BlurView intensity={70} tint="dark" style={styles.insightContainer}>
      <View style={styles.insightHeader}>
        <Zap size={16} color={Colors.primary} fill={Colors.primary} />
        <Text style={styles.insightTitle}>TI-GUY PERCEPTION</Text>
      </View>
      <Text style={styles.insightText}>{insights}</Text>
    </BlurView>
  );
};

interface FeedItemProps {
  item: Post;
  isVisible: boolean;
}

const FeedItem: React.FC<FeedItemProps> = ({ item, isVisible }) => {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  useEffect(() => {
    if (isVisible) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isVisible]);

  return (
    <View style={styles.videoContainer}>
      {item.type === "video" ? (
        <Video
          ref={videoRef}
          style={styles.media}
          source={{ uri: item.mediaUrl }}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isVisible}
          usePoster={true}
          posterSource={{ uri: item.thumbnailUrl }}
          posterStyle={{ resizeMode: "cover" }}
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
      ) : (
        <Image
          source={{ uri: item.mediaUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      <View style={styles.overlay}>
        {/* Top Gradient/Shadow Area */}
        <SafeAreaView style={styles.topOverlay}>
          <Text style={styles.brand}>ZYEUTÉ</Text>
        </SafeAreaView>

        {/* Right Side Actions */}
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={30} color={Colors.text} />
            <Text style={styles.actionText}>{item.fireCount || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={30} color={Colors.text} />
            <Text style={styles.actionText}>24</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share2 size={30} color={Colors.text} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Info Area */}
        <View style={styles.bottomOverlay}>
          <Text style={styles.username}>
            @{item.user?.username || "zyeute_user"}
          </Text>
          <Text style={styles.caption} numberOfLines={2}>
            {item.caption || "No caption provided."}
          </Text>

          {/* Ti-Guy Insights Overlay */}
          {(item.tiGuyInsight || item.aiPerception) && (
            <TiGuyInsights
              insights={
                item.tiGuyInsight ||
                item.aiPerception ||
                "Pas d'insight disponible pour le moment."
              }
            />
          )}
        </View>
      </View>
    </View>
  );
};

export const ReelFeed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleIndex, setVisibleIndex] = useState(0);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    const feedPosts = await getSovereignFeed();
    setPosts(feedPosts);
    setLoading(false);
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setVisibleIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Prestige Skeleton Loader
  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.background, Colors.leatherDark]}
          style={styles.loaderContainer}
        >
          <Image
            source={{
              uri: "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDdtY2lvM2o4d2k4eXo4eXo4eXo4eXo4eXo4eXo4eXo4eXo4eXo/l3q2K5jinAlChoCLS/giphy.gif",
            }} // Optional: Use a real local prestigious gif/image if available
            style={{ width: 100, height: 100, opacity: 0.5 }}
          />
          <ActivityIndicator
            size="large"
            color={Colors.primary}
            style={{ marginTop: 20 }}
          />
          <Text style={styles.loadingText}>INITIALISATION DU SWARM...</Text>
          <Text style={styles.loadingSubText}>
            Synchronisation avec le Hive Québec
          </Text>
        </LinearGradient>
      </View>
    );
  }

  // Error State
  if (!posts || posts.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Zap size={64} color={Colors.textMuted} />
        <Text style={styles.errorTitle}>LE HIVE EST SILENCIEUX</Text>
        <Text style={styles.errorText}>
          Impossible de capter le signal du Swarm.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFeed}>
          <Text style={styles.retryText}>RÉESSAYER</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={({ item, index }) => (
          <FeedItem item={item} isVisible={index === visibleIndex} />
        )}
        keyExtractor={(item) => item.id.toString()}
        pagingEnabled
        horizontal={false}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        // Optimizations for Pre-fetching
        windowSize={4} // Render 4 screens worth of content (current + 3) to pre-buffer
        initialNumToRender={2} // Render first 2 immediately
        maxToRenderPerBatch={2}
        removeClippedSubviews={true} // Unmount off-screen views to save memory (keep windowSize small)
        updateCellsBatchingPeriod={100}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 20,
    letterSpacing: 2,
  },
  loadingSubText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 5,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 20,
    letterSpacing: 2,
  },
  errorText: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 10,
    marginBottom: 30,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 25,
  },
  retryText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  videoContainer: {
    width: width,
    height: height,
    backgroundColor: Colors.background,
  },
  media: {
    width: width,
    height: height,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: 20,
  },
  topOverlay: {
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 0 : 40,
  },
  brand: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  rightActions: {
    position: "absolute",
    right: 15,
    bottom: height * 0.25,
    alignItems: "center",
    zIndex: 10,
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  actionText: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  bottomOverlay: {
    marginBottom: 60, // Space for tab bar if any
    paddingRight: 60, // Space for right actions
  },
  username: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  caption: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  insightContainer: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 191, 0, 0.2)",
    overflow: "hidden",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  insightTitle: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 6,
    letterSpacing: 1,
  },
  insightText: {
    color: Colors.text,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
