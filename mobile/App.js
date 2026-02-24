/**
 * ZYEUTÉ MOBILE - Quebec's Douyin
 * React Native App - With Login & Settings
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
  ScrollView,
  Switch,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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
  red: "#ff4444",
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

// ===== AUTH CONTEXT =====
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user
    setTimeout(() => setLoading(false), 500);
  }, []);

  const signIn = async (email, password) => {
    // Mock login
    setUser({
      id: '1',
      email,
      username: email.split('@')[0],
      avatar: 'Y',
    });
    return true;
  };

  const signUp = async (username, email, password) => {
    // Mock signup
    setUser({
      id: '1',
      email,
      username,
      avatar: username[0].toUpperCase(),
    });
    return true;
  };

  const signInWithGoogle = async () => {
    // Mock Google login
    setUser({
      id: '2',
      email: 'user@gmail.com',
      username: 'google_user',
      avatar: 'G',
    });
    return true;
  };

  const signInAsGuest = () => {
    setUser({
      id: 'guest',
      email: null,
      username: 'guest',
      avatar: '?',
      isGuest: true,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, signInAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => React.useContext(AuthContext);

// ===== LOGIN SCREEN =====
function LoginScreen({ navigation }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, signInWithGoogle, signInAsGuest } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(username, email, password);
    } catch (err) {
      setError('Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={loginStyles.container}>
      <ScrollView contentContainerStyle={loginStyles.scrollContent}>
        {/* Logo */}
        <View style={loginStyles.logoContainer}>
          <Text style={loginStyles.logoIcon}>⚜️</Text>
          <Text style={loginStyles.logoText}>ZYEUTÉ</Text>
          <Text style={loginStyles.logoSubtitle}>Quebec's TikTok 🦫⚜️</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={loginStyles.errorBox}>
            <Text style={loginStyles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={loginStyles.formContainer}>
          {mode === 'signup' && (
            <TextInput
              style={loginStyles.input}
              placeholder="Username"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          )}
          
          <TextInput
            style={loginStyles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={loginStyles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[loginStyles.button, loading && loginStyles.buttonDisabled]}
            onPress={mode === 'login' ? handleLogin : handleSignup}
            disabled={loading}
          >
            <Text style={loginStyles.buttonText}>
              {loading ? 'Please wait...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={loginStyles.switchButton}
            onPress={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError('');
            }}
          >
            <Text style={loginStyles.switchButtonText}>
              {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={loginStyles.divider}>
          <View style={loginStyles.dividerLine} />
          <Text style={loginStyles.dividerText}>or</Text>
          <View style={loginStyles.dividerLine} />
        </View>

        {/* Social Login */}
        <TouchableOpacity style={loginStyles.socialButton} onPress={signInWithGoogle}>
          <Text style={loginStyles.socialButtonText}>🔍 Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={loginStyles.guestButton} onPress={signInAsGuest}>
          <Text style={loginStyles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={loginStyles.footer}>
          By signing in, you agree to our Terms and Privacy Policy
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brown,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 2,
  },
  logoSubtitle: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.red,
    textAlign: 'center',
    fontSize: 14,
  },
  formContainer: {
    gap: 12,
  },
  input: {
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    padding: 16,
    color: COLORS.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.brownDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchButton: {
    alignItems: 'center',
    padding: 12,
  },
  switchButtonText: {
    color: COLORS.gold,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gold + '40',
  },
  dividerText: {
    color: COLORS.textMuted,
    marginHorizontal: 16,
  },
  socialButton: {
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    marginBottom: 12,
  },
  socialButtonText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  guestButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  guestButtonText: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
});

// ===== SETTINGS SCREEN =====
function SettingsScreen({ navigation }) {
  const [activeSection, setActiveSection] = useState('account');
  const { user, logout } = useAuth();
  
  const [settings, setSettings] = useState({
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    bio: 'Quebec Creator ⚜️',
    privateAccount: false,
    allowComments: true,
    allowDuet: true,
    allowDownload: true,
    pushNotifications: true,
    emailNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    liveNotifications: true,
    darkMode: true,
    highContrast: false,
    reducedMotion: false,
    language: 'English',
    contentLanguage: 'All',
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    alert('Settings saved! 🐝');
  };

  const menuItems = [
    { id: 'account', icon: '👤', label: 'Account' },
    { id: 'privacy', icon: '🔒', label: 'Privacy' },
    { id: 'notifications', icon: '🔔', label: 'Notifications' },
    { id: 'appearance', icon: '🎨', label: 'Appearance' },
    { id: 'language', icon: '🌐', label: 'Language' },
    { id: 'help', icon: '❓', label: 'Help & Support' },
    { id: 'about', icon: 'ℹ️', label: 'About' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <View style={settingsStyles.section}>
            <View style={settingsStyles.avatarContainer}>
              <View style={settingsStyles.largeAvatar}>
                <Text style={settingsStyles.largeAvatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
              </View>
              <TouchableOpacity>
                <Text style={settingsStyles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            <View style={settingsStyles.inputGroup}>
              <Text style={settingsStyles.inputLabel}>Username</Text>
              <TextInput
                style={settingsStyles.input}
                value={settings.username}
                onChangeText={(text) => setSettings(prev => ({ ...prev, username: text }))}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={settingsStyles.inputGroup}>
              <Text style={settingsStyles.inputLabel}>Email</Text>
              <TextInput
                style={settingsStyles.input}
                value={settings.email}
                onChangeText={(text) => setSettings(prev => ({ ...prev, email: text }))}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="email-address"
              />
            </View>

            <View style={settingsStyles.inputGroup}>
              <Text style={settingsStyles.inputLabel}>Phone Number</Text>
              <TextInput
                style={settingsStyles.input}
                value={settings.phone}
                onChangeText={(text) => setSettings(prev => ({ ...prev, phone: text }))}
                placeholder="Add phone number"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={settingsStyles.inputGroup}>
              <Text style={settingsStyles.inputLabel}>Bio</Text>
              <TextInput
                style={[settingsStyles.input, settingsStyles.textArea]}
                value={settings.bio}
                onChangeText={(text) => setSettings(prev => ({ ...prev, bio: text }))}
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={settingsStyles.saveButton} onPress={handleSave}>
              <Text style={settingsStyles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        );

      case 'privacy':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Privacy Settings</Text>
            
            <ToggleItem 
              icon="🔒"
              title="Private Account"
              description="Only approved followers can see your content"
              value={settings.privateAccount}
              onToggle={() => handleToggle('privateAccount')}
            />
            
            <ToggleItem 
              icon="💬"
              title="Allow Comments"
              description="Let others comment on your videos"
              value={settings.allowComments}
              onToggle={() => handleToggle('allowComments')}
            />
            
            <ToggleItem 
              icon="🎭"
              title="Allow Duets"
              description="Others can duet with your videos"
              value={settings.allowDuet}
              onToggle={() => handleToggle('allowDuet')}
            />
            
            <ToggleItem 
              icon="⬇️"
              title="Allow Downloads"
              description="Others can download your videos"
              value={settings.allowDownload}
              onToggle={() => handleToggle('allowDownload')}
            />

            <View style={settingsStyles.divider} />
            
            <TouchableOpacity style={settingsStyles.dangerButton}>
              <Text style={settingsStyles.dangerButtonText}>Blocked Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={settingsStyles.dangerButton}>
              <Text style={settingsStyles.dangerButtonText}>Restricted Accounts</Text>
            </TouchableOpacity>
          </View>
        );

      case 'notifications':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Notification Settings</Text>
            
            <ToggleItem 
              icon="🔔"
              title="Push Notifications"
              description="Receive push notifications"
              value={settings.pushNotifications}
              onToggle={() => handleToggle('pushNotifications')}
            />
            
            <ToggleItem 
              icon="📧"
              title="Email Notifications"
              description="Receive email updates"
              value={settings.emailNotifications}
              onToggle={() => handleToggle('emailNotifications')}
            />

            <View style={settingsStyles.divider} />
            <Text style={settingsStyles.subsectionTitle}>Activity Notifications</Text>
            
            <ToggleItem 
              icon="🔥"
              title="Likes"
              description="When someone likes your video"
              value={settings.likeNotifications}
              onToggle={() => handleToggle('likeNotifications')}
            />
            
            <ToggleItem 
              icon="💬"
              title="Comments"
              description="When someone comments on your video"
              value={settings.commentNotifications}
              onToggle={() => handleToggle('commentNotifications')}
            />
            
            <ToggleItem 
              icon="👥"
              title="New Followers"
              description="When someone follows you"
              value={settings.followNotifications}
              onToggle={() => handleToggle('followNotifications')}
            />
            
            <ToggleItem 
              icon="🔴"
              title="Live Streams"
              description="When accounts you follow go live"
              value={settings.liveNotifications}
              onToggle={() => handleToggle('liveNotifications')}
            />
          </View>
        );

      case 'appearance':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Appearance</Text>
            
            <ToggleItem 
              icon="🌙"
              title="Dark Mode"
              description="Use dark theme throughout the app"
              value={settings.darkMode}
              onToggle={() => handleToggle('darkMode')}
            />
            
            <ToggleItem 
              icon="👁️"
              title="High Contrast"
              description="Increase contrast for better visibility"
              value={settings.highContrast}
              onToggle={() => handleToggle('highContrast')}
            />
            
            <ToggleItem 
              icon="🎬"
              title="Reduced Motion"
              description="Minimize animations throughout the app"
              value={settings.reducedMotion}
              onToggle={() => handleToggle('reducedMotion')}
            />
          </View>
        );

      case 'language':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Language</Text>
            
            <View style={settingsStyles.inputGroup}>
              <Text style={settingsStyles.inputLabel}>App Language</Text>
              <View style={settingsStyles.picker}>
                <Text style={settingsStyles.pickerText}>{settings.language}</Text>
              </View>
            </View>
            
            <View style={settingsStyles.inputGroup}>
              <Text style={settingsStyles.inputLabel}>Content Language</Text>
              <View style={settingsStyles.picker}>
                <Text style={settingsStyles.pickerText}>{settings.contentLanguage}</Text>
              </View>
            </View>

            <View style={settingsStyles.prideBox}>
              <Text style={settingsStyles.prideText}>
                🇨🇦 <Text style={{ fontWeight: 'bold' }}>Quebec Pride!</Text> Zyeute celebrates French-Canadian culture and the Joual language.
              </Text>
            </View>
          </View>
        );

      case 'help':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Help & Support</Text>
            
            <HelpItem icon="📖" title="Help Center" description="Find answers to common questions" />
            <HelpItem icon="💬" title="Contact Us" description="Get in touch with our support team" />
            <HelpItem icon="🐛" title="Report a Problem" description="Let us know if something's not working" />
            <HelpItem icon="💡" title="Feature Request" description="Suggest new features for Zyeute" />
            <HelpItem icon="📋" title="Community Guidelines" description="Rules for keeping Zyeute safe" />
            <HelpItem icon="⚖️" title="Terms of Service" description="Legal terms and conditions" />
            <HelpItem icon="🔒" title="Privacy Policy" description="How we handle your data" />
          </View>
        );

      case 'about':
        return (
          <View style={[settingsStyles.section, settingsStyles.centerContent]}>
            <Text style={styles.headerIcon}>⚜️</Text>
            <Text style={settingsStyles.aboutTitle}>Zyeute</Text>
            <Text style={settingsStyles.aboutSubtitle}>Quebec's TikTok 🦫⚜️</Text>
            
            <View style={settingsStyles.infoList}>
              <View style={settingsStyles.infoItem}>
                <Text style={settingsStyles.infoLabel}>Version</Text>
                <Text style={settingsStyles.infoValue}>1.0.0</Text>
              </View>
              <View style={settingsStyles.infoItem}>
                <Text style={settingsStyles.infoLabel}>Build</Text>
                <Text style={settingsStyles.infoValue}>2024.02.24</Text>
              </View>
              <View style={settingsStyles.infoItem}>
                <Text style={settingsStyles.infoLabel}>Platform</Text>
                <Text style={settingsStyles.infoValue}>iOS/Android</Text>
              </View>
            </View>

            <Text style={settingsStyles.aboutFooter}>Made with ❤️ in Quebec</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
      <View style={settingsStyles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={settingsStyles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={settingsStyles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={settingsStyles.content}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={settingsStyles.menuScroll}
          contentContainerStyle={settingsStyles.menuContent}
        >
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setActiveSection(item.id)}
              style={[
                settingsStyles.menuItem,
                activeSection === item.id && settingsStyles.menuItemActive
              ]}
            >
              <Text style={settingsStyles.menuItemIcon}>{item.icon}</Text>
              <Text style={[
                settingsStyles.menuItemLabel,
                activeSection === item.id && settingsStyles.menuItemLabelActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={settingsStyles.contentScroll}>
          {renderContent()}
          
          <TouchableOpacity 
            style={[settingsStyles.dangerButton, { marginTop: 24, marginBottom: 40 }]}
            onPress={logout}
          >
            <Text style={settingsStyles.dangerButtonText}>🚪 Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Toggle Item Component
function ToggleItem({ icon, title, description, value, onToggle }) {
  return (
    <View style={settingsStyles.toggleItem}>
      <View style={settingsStyles.toggleItemLeft}>
        <Text style={settingsStyles.toggleItemIcon}>{icon}</Text>
        <View style={settingsStyles.toggleItemText}>
          <Text style={settingsStyles.toggleItemTitle}>{title}</Text>
          <Text style={settingsStyles.toggleItemDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: `${COLORS.textMuted}40`, true: COLORS.gold }}
        thumbColor="#fff"
      />
    </View>
  );
}

// Help Item Component
function HelpItem({ icon, title, description }) {
  return (
    <TouchableOpacity style={settingsStyles.helpItem}>
      <Text style={settingsStyles.helpItemIcon}>{icon}</Text>
      <View style={settingsStyles.helpItemText}>
        <Text style={settingsStyles.helpItemTitle}>{title}</Text>
        <Text style={settingsStyles.helpItemDescription}>{description}</Text>
      </View>
      <Text style={settingsStyles.helpItemArrow}>→</Text>
    </TouchableOpacity>
  );
}

// Settings Styles
const settingsStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '20',
  },
  backButton: {
    fontSize: 24,
    color: COLORS.text,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gold,
  },
  content: {
    flex: 1,
  },
  menuScroll: {
    maxHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '20',
  },
  menuContent: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 8,
  },
  menuItemActive: {
    backgroundColor: COLORS.gold + '20',
    borderColor: COLORS.gold + '40',
  },
  menuItemIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  menuItemLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemLabelActive: {
    color: COLORS.gold,
  },
  contentScroll: {
    flex: 1,
    padding: 16,
  },
  section: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 12,
    marginTop: 8,
  },
  centerContent: {
    alignItems: 'center',
    paddingTop: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  largeAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.leather,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  largeAvatarText: {
    fontSize: 40,
    color: COLORS.gold,
    fontWeight: 'bold',
  },
  changePhotoText: {
    color: COLORS.gold,
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: COLORS.brownDark,
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  toggleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  toggleItemText: {
    flex: 1,
  },
  toggleItemTitle: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 16,
  },
  toggleItemDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gold + '30',
    marginVertical: 16,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerButtonText: {
    color: COLORS.red,
    fontWeight: '600',
  },
  picker: {
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  pickerText: {
    color: COLORS.text,
  },
  prideBox: {
    backgroundColor: COLORS.gold + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
  },
  prideText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  helpItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  helpItemText: {
    flex: 1,
  },
  helpItemTitle: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 16,
  },
  helpItemDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  helpItemArrow: {
    color: COLORS.textMuted,
    fontSize: 18,
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginTop: 16,
  },
  aboutSubtitle: {
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 32,
  },
  infoList: {
    width: '100%',
    maxWidth: 280,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '20',
  },
  infoLabel: {
    color: COLORS.textMuted,
  },
  infoValue: {
    color: COLORS.text,
  },
  aboutFooter: {
    color: COLORS.textMuted,
    marginTop: 40,
    fontSize: 12,
  },
});

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

      <View style={styles.gradientOverlay} />

      {showHeart && (
        <Animated.View style={styles.heartAnimation}>
          <Text style={styles.heartEmoji}>🔥</Text>
        </Animated.View>
      )}

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
function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('videos');

  return (
    <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
      <ScrollView contentContainerStyle={styles.profileScreen}>
        <View style={styles.profileScreenAvatar}>
          <Text style={styles.profileScreenAvatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.profileScreenUsername}>@{user?.username || 'guest'}</Text>
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

        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutButtonText}>🚪 Log Out</Text>
        </TouchableOpacity>

        <View style={styles.profileTabs}>
          <TouchableOpacity 
            style={[styles.profileTab, activeTab === 'videos' && styles.profileTabActive]}
            onPress={() => setActiveTab('videos')}
          >
            <Text style={[styles.profileTabText, activeTab === 'videos' && styles.profileTabTextActive]}>Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.profileTab, activeTab === 'liked' && styles.profileTabActive]}
            onPress={() => setActiveTab('liked')}
          >
            <Text style={[styles.profileTabText, activeTab === 'liked' && styles.profileTabTextActive]}>Liked</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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

// ===== NAVIGATION SETUP =====
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

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
        component={ProfileStack}
        options={{ tabBarIcon: ({ color }) => <Text style={{ fontSize: 24, color }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 48 }}>⚜️</Text>
        <Text style={{ color: COLORS.textMuted, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Login" component={LoginScreen} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
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
    paddingVertical: 24,
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
  settingsButton: {
    width: '80%',
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  settingsButtonText: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 16,
  },
  logoutButton: {
    width: '80%',
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: COLORS.red,
    fontWeight: '600',
    fontSize: 16,
  },
  profileTabs: {
    flexDirection: 'row',
    marginTop: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '40',
  },
  profileTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  profileTabText: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  profileTabTextActive: {
    color: COLORS.gold,
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
  headerIcon: {
    fontSize: 60,
  },
});

// ===== APP =====
export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brown} />
      <AppNavigator />
    </AuthProvider>
  );
}
