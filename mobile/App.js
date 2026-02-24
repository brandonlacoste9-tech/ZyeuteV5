/**
 * ZYEUTÉ MOBILE - Quebec's Douyin
 * React Native App
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Animated,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const { width, height } = Dimensions.get('window');

// ===== CONSTANTS =====
const COLORS = {
  gold: "#FFBF00",
  goldLight: "#FFD700",
  goldDark: "#B8860B",
  brown: "#1a1510",
  brownLight: "#251a15",
  brownDark: "#0d0c0b",
  leather: "#3a2a22",
  text: "#E8DCC4",
  textMuted: "#B8A88A",
  black: "#000000",
};

// ===== MOCK DATA =====
const MOCK_POSTS = [
  {
    id: '1',
    videoUrl: 'https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4',
    caption: 'Quebec winters hit different ❄️ #Quebec #Winter',
    user: { username: 'marie_qc', avatar: 'M' },
    fireCount: 12400,
    commentCount: 342,
    shares: 89,
  },
  {
    id: '2',
    videoUrl: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
    caption: 'Poutine time! 🧀 #Poutine #Montreal',
    user: { username: 'ti_guy_514', avatar: 'T' },
    fireCount: 8900,
    commentCount: 156,
    shares: 234,
  },
  {
    id: '3',
    videoUrl: 'https://videos.pexels.com/video-files/2040078/2040078-hd_1920_1080_30fps.mp4',
    caption: 'Fleur-de-lys forever ⚜️ #QuebecPride',
    user: { username: 'sarah_mtl', avatar: 'S' },
    fireCount: 15600,
    commentCount: 521,
    shares: 445,
  },
];

// ===== VIDEO FEED SCREEN =====
function VideoFeedScreen() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [showHeart, setShowHeart] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const flatListRef = useRef(null);

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const handleDoubleTap = (postId) => {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    
    if (!likedPosts.has(postId)) {
      setLikedPosts(prev => new Set(prev).add(postId));
    }
  };

  const renderItem = ({ item, index }) => (
    <VideoCard
      post={item}
      isActive={index === activeIndex}
      onDoubleTap={() => handleDoubleTap(item.id)}
      onShowComments={() => setCommentsVisible(true)}
      onShowProfile={() => setProfileVisible(true)}
      isLiked={likedPosts.has(item.id)}
      showHeart={showHeart}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={MOCK_POSTS}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />
      
      <CommentsModal visible={commentsVisible} onClose={() => setCommentsVisible(false)} />
      <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
    </View>
  );
}

// ===== VIDEO CARD =====
function VideoCard({ post, isActive, onDoubleTap, onShowComments, onShowProfile, isLiked, showHeart }) {
  const videoRef = useRef(null);
  const [lastTap, setLastTap] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
      }
    }
  }, [isActive]);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      onDoubleTap();
    }
    setLastTap(now);
  };

  return (
    <TouchableOpacity style={styles.videoContainer} onPress={handleTap} activeOpacity={1}>
      <Video
        ref={videoRef}
        source={{ uri: post.videoUrl }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay={isActive}
      />

      {/* Gradient Overlay */}
      <View style={styles.gradientOverlay} />

      {/* Heart Animation */}
      {showHeart && (
        <Animated.View style={styles.heartAnimation}>
          <Text style={styles.heartEmoji}>🔥</Text>
        </Animated.View>
      )}

      {/* Right Side Actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity onPress={onShowProfile} style={styles.actionButton}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.user.avatar}</Text>
          </View>
          <Text style={styles.actionLabel}>@{post.user.username}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onDoubleTap} style={styles.actionButton}>
          <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>🔥</Text>
          <Text style={styles.actionCount}>{(post.fireCount + (isLiked ? 1 : 0)).toLocaleString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShowComments} style={styles.actionButton}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>↗️</Text>
          <Text style={styles.actionCount}>{post.shares}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={styles.bottomInfo}>
        <Text style={styles.caption}>{post.caption}</Text>
        <Text style={styles.soundInfo}>🎵 Original Sound - {post.user.username}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ===== COMMENTS MODAL =====
function CommentsModal({ visible, onClose }) {
  const [comment, setComment] = useState('');
  const comments = [
    { id: 1, user: 'marie_qc', text: "C'est ben beau! 🔥", avatar: 'M' },
    { id: 2, user: 'ti_guy_514', text: 'Tabarnac! 🔥', avatar: 'T' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Comments</Text>
          
          {comments.map(c => (
            <View key={c.id} style={styles.commentItem}>
              <View style={styles.commentAvatar}>
                <Text>{c.avatar}</Text>
              </View>
              <View>
                <Text style={styles.commentUser}>@{c.user}</Text>
                <Text style={styles.commentText}>{c.text}</Text>
              </View>
            </View>
          ))}

          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={COLORS.textMuted}
              value={comment}
              onChangeText={setComment}
            />
            <TouchableOpacity style={styles.commentButton}>
              <Text style={styles.commentButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ===== PROFILE MODAL =====
function ProfileModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.profileOverlay}>
        <View style={styles.profileContent}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>M</Text>
          </View>
          <Text style={styles.profileUsername}>@marie_qc</Text>
          <Text style={styles.profileBio}>Quebec Creator ⚜️</Text>
          
          <View style={styles.profileStats}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Videos</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>1.2K</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>89</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          <View style={styles.profileButtons}>
            <TouchableOpacity style={styles.followButton}>
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ===== CREATE SCREEN =====
function CreateScreen() {
  return (
    <View style={[styles.container, styles.createContainer]}>
      <Text style={styles.createTitle}>Create</Text>
      <Text style={styles.createSubtitle}>Share your Quebec story 🦫⚜️</Text>
      
      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonIcon}>📹</Text>
        <Text style={styles.createButtonText}>Record Video</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createButtonIcon}>🖼️</Text>
        <Text style={styles.createButtonText}>Upload from Gallery</Text>
      </TouchableOpacity>
    </View>
  );
}

// ===== PROFILE SCREEN =====
function ProfileScreen() {
  return (
    <View style={[styles.container, styles.profileScreen]}>
      <View style={styles.profileScreenAvatar}>
        <Text style={styles.profileScreenAvatarText}>Y</Text>
      </View>
      <Text style={styles.profileScreenUsername}>@yourusername</Text>
      <Text style={styles.profileScreenBio}>Quebec Creator ⚜️</Text>
      
      <View style={styles.profileScreenStats}>
        <View style={styles.screenStat}>
          <Text style={styles.screenStatNumber}>12</Text>
          <Text style={styles.screenStatLabel}>Videos</Text>
        </View>
        <View style={styles.screenStat}>
          <Text style={styles.screenStatNumber}>1.2K</Text>
          <Text style={styles.screenStatLabel}>Followers</Text>
        </View>
        <View style={styles.screenStat}>
          <Text style={styles.screenStatNumber}>89</Text>
          <Text style={styles.screenStatLabel}>Following</Text>
        </View>
      </View>
    </View>
  );
}

// ===== SEARCH SCREEN =====
function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('videos');

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
      <View style={styles.searchHeader}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos, creators, hashtags..."
          placeholderTextColor={COLORS.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <View style={styles.searchTabs}>
        {['videos', 'creators', 'hashtags'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.searchTab, activeTab === tab && styles.searchTabActive]}
          >
            <Text style={[styles.searchTabText, activeTab === tab && styles.searchTabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.trendingSection}>
        <Text style={styles.trendingTitle}>🔥 Trending in Quebec</Text>
        <View style={styles.hashtagGrid}>
          {['#Quebec', '#Montreal', '#Joual', '#FleurDeLys', '#Poutine', '#Maple'].map((tag) => (
            <TouchableOpacity key={tag} style={styles.hashtagCard}>
              <Text style={styles.hashtagText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ===== NOTIFICATIONS SCREEN =====
function NotificationsScreen() {
  const notifications = [
    { id: 1, text: '@marie_qc liked your video', time: '2m ago' },
    { id: 2, text: '@ti_guy started following you', time: '1h ago' },
  ];

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
      <Text style={styles.screenTitle}>Notifications</Text>
      {notifications.map((n) => (
        <View key={n.id} style={styles.notificationItem}>
          <Text style={styles.notificationText}>{n.text}</Text>
          <Text style={styles.notificationTime}>{n.time}</Text>
        </View>
      ))}
    </SafeAreaView>
  );
}

// ===== BOTTOM TAB NAVIGATOR =====
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.brownDark,
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={VideoFeedScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🏠</Text> }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🔍</Text> }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateScreen}
        options={{ 
          tabBarIcon: ({ color }) => (
            <View style={styles.createTabButton}>
              <Text style={{ fontSize: 28 }}>➕</Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>🔔</Text> }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brown,
  },
  videoContainer: {
    width,
    height,
    backgroundColor: COLORS.black,
  },
  video: {
    width,
    height,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  heartAnimation: {
    position: 'absolute',
    top: height / 2 - 50,
    left: width / 2 - 50,
  },
  heartEmoji: {
    fontSize: 100,
  },
  rightActions: {
    position: 'absolute',
    right: 10,
    bottom: 120,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.leather,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  actionLabel: {
    color: COLORS.text,
    fontSize: 12,
    marginTop: 4,
  },
  actionIcon: {
    fontSize: 36,
  },
  likedIcon: {
    textShadowColor: COLORS.gold,
    textShadowRadius: 10,
  },
  actionCount: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bottomInfo: {
    position: 'absolute',
    left: 16,
    right: 100,
    bottom: 100,
  },
  caption: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 8,
  },
  soundInfo: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.brown,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.leather,
    borderWidth: 1,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  commentUser: {
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  commentText: {
    color: COLORS.text,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.leather,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  commentButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 8,
    justifyContent: 'center',
  },
  commentButtonText: {
    color: COLORS.brownDark,
    fontWeight: 'bold',
  },
  // Profile modal
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileContent: {
    backgroundColor: COLORS.brown,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.gold + '40',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.leather,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileAvatarText: {
    fontSize: 32,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  profileUsername: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileBio: {
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.gold,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  profileButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  followButton: {
    flex: 1,
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  followButtonText: {
    color: COLORS.brownDark,
    fontWeight: 'bold',
  },
  closeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.gold,
  },
  // Create screen
  createContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createTitle: {
    color: COLORS.gold,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  createSubtitle: {
    color: COLORS.textMuted,
    marginBottom: 40,
  },
  createButton: {
    width: '100%',
    backgroundColor: COLORS.leather,
    borderWidth: 2,
    borderColor: COLORS.gold + '60',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  createButtonText: {
    color: COLORS.gold,
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Profile screen
  profileScreen: {
    alignItems: 'center',
    paddingTop: 60,
  },
  profileScreenAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.leather,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  profileScreenAvatarText: {
    fontSize: 40,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  profileScreenUsername: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileScreenBio: {
    color: COLORS.textMuted,
    marginTop: 4,
  },
  profileScreenStats: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 40,
  },
  screenStat: {
    alignItems: 'center',
  },
  screenStatNumber: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: 'bold',
  },
  screenStatLabel: {
    color: COLORS.textMuted,
  },
  // Search
  searchHeader: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  searchTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '30',
  },
  searchTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  searchTabText: {
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  searchTabTextActive: {
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  trendingSection: {
    padding: 16,
  },
  trendingTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hashtagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hashtagCard: {
    backgroundColor: COLORS.leather,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
  },
  hashtagText: {
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  // Notifications
  screenTitle: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  notificationItem: {
    backgroundColor: COLORS.leather,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  notificationText: {
    color: COLORS.text,
  },
  notificationTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  // Create tab button
  createTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});

// ===== APP =====
export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brown} />
      <MainTabs />
    </NavigationContainer>
  );
}
