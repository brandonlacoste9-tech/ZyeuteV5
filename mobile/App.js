/**
 * ZYEUTÉ MOBILE - Quebec's Douyin
 * React Native App - Premium Antique Gold Leather Edition
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
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// ===== PREMIUM DESIGN SYSTEM - LV-INSPIRED ANTIQUE GOLD =====
const COLORS = {
  gold: "#C9A227",           // Antique gold
  goldLight: "#D4AF37",      // Light gold
  goldDark: "#8B6914",       // Dark gold
  goldMuted: "#A68B3C",      // Muted gold for subtle accents
  brown: "#1A0F0A",          // Deep leather
  brownLight: "#2C1810",     // Light leather
  brownDark: "#0D0805",      // Darker leather
  leather: "#3D2418",        // Saddle brown
  leatherLight: "#4A2E20",   // Lighter saddle
  text: "#F5E6D3",           // Warm cream
  textMuted: "#A68B7C",      // Muted brown
  cream: "#FAF0E6",          // Antique white
  black: "#000000",
  red: "#B85450",            // Antique red
};

// ===== TYPOGRAPHY =====
const FONTS = {
  serif: 'Georgia',
  serifFallback: 'Times New Roman',
  sans: 'System',
};

// ===== MOCK DATA =====
const MOCK_POSTS = [
  {
    id: '1',
    videoUrl: 'https://videos.pexels.com/video-files/857251/857251-hd_1920_1080_25fps.mp4',
    caption: 'Quebec winters hit different #Quebec #Winter',
    user: { username: 'marie_qc', avatar: 'M' },
    fireCount: 12400,
    commentCount: 342,
    shares: 89,
  },
  {
    id: '2',
    videoUrl: 'https://videos.pexels.com/video-files/3209828/3209828-uhd_2560_1440_25fps.mp4',
    caption: 'Poutine time! #Poutine #Montreal',
    user: { username: 'ti_guy_514', avatar: 'T' },
    fireCount: 8900,
    commentCount: 156,
    shares: 234,
  },
  {
    id: '3',
    videoUrl: 'https://videos.pexels.com/video-files/2040078/2040078-hd_1920_1080_30fps.mp4',
    caption: 'Fleur-de-lys forever #QuebecPride',
    user: { username: 'sarah_mtl', avatar: 'S' },
    fireCount: 15600,
    commentCount: 521,
    shares: 445,
  },
];

// ===== GOLD STITCHING BORDER COMPONENT =====
function GoldStitching({ children, style, variant = 'default' }) {
  const borderColors = {
    default: COLORS.gold,
    light: COLORS.goldLight,
    muted: COLORS.goldMuted,
  };

  return (
    <View style={[stitchingStyles.container, style]}>
      <View style={[stitchingStyles.outerBorder, { borderColor: borderColors[variant] }]}>
        <View style={stitchingStyles.innerBorder}>
          {children}
        </View>
      </View>
    </View>
  );
}

const stitchingStyles = StyleSheet.create({
  container: {
    padding: 2,
  },
  outerBorder: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 2,
  },
  innerBorder: {
    borderWidth: 1.5,
    borderColor: COLORS.gold + '60',
    borderRadius: 10,
    overflow: 'hidden',
  },
});

// ===== LEATHER TEXTURE BACKGROUND COMPONENT =====
function LeatherBackground({ children, variant = 'dark', style }) {
  const bgColors = {
    dark: COLORS.brown,
    medium: COLORS.brownLight,
    light: COLORS.leather,
  };

  return (
    <View style={[leatherStyles.container, { backgroundColor: bgColors[variant] }, style]}>
      <View style={leatherStyles.textureOverlay} />
      {children}
    </View>
  );
}

const leatherStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.03,
  },
});

// ===== AUTH CONTEXT =====
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const signIn = async (email, password) => {
    setUser({
      id: '1',
      email,
      username: email.split('@')[0],
      avatar: 'Y',
    });
    return true;
  };

  const signUp = async (username, email, password) => {
    setUser({
      id: '1',
      email,
      username,
      avatar: username[0].toUpperCase(),
    });
    return true;
  };

  const signInWithGoogle = async () => {
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
  const [mode, setMode] = useState('login');
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
    <LeatherBackground variant="dark">
      <SafeAreaView style={loginStyles.container}>
        <ScrollView contentContainerStyle={loginStyles.scrollContent}>
          {/* Logo */}
          <View style={loginStyles.logoContainer}>
            <View style={loginStyles.logoIconContainer}>
              <Ionicons name="flower-outline" size={64} color={COLORS.gold} />
            </View>
            <Text style={loginStyles.logoText}>ZYEUTÉ</Text>
            <Text style={loginStyles.logoSubtitle}>Quebec's TikTok</Text>
            <View style={loginStyles.dividerAccent} />
          </View>

          {/* Error */}
          {error ? (
            <GoldStitching variant="muted" style={loginStyles.errorWrapper}>
              <View style={loginStyles.errorBox}>
                <Ionicons name="alert-circle" size={20} color={COLORS.red} style={loginStyles.errorIcon} />
                <Text style={loginStyles.errorText}>{error}</Text>
              </View>
            </GoldStitching>
          ) : null}

          {/* Form */}
          <GoldStitching style={loginStyles.formWrapper}>
            <View style={loginStyles.formContainer}>
              {mode === 'signup' && (
                <View style={loginStyles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={COLORS.goldMuted} style={loginStyles.inputIcon} />
                  <TextInput
                    style={loginStyles.input}
                    placeholder="Username"
                    placeholderTextColor={COLORS.textMuted}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              )}
              
              <View style={loginStyles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.goldMuted} style={loginStyles.inputIcon} />
                <TextInput
                  style={loginStyles.input}
                  placeholder="Email"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              
              <View style={loginStyles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.goldMuted} style={loginStyles.inputIcon} />
                <TextInput
                  style={loginStyles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

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
          </GoldStitching>

          {/* Divider */}
          <View style={loginStyles.divider}>
            <View style={loginStyles.dividerLine} />
            <Text style={loginStyles.dividerText}>or</Text>
            <View style={loginStyles.dividerLine} />
          </View>

          {/* Social Login */}
          <GoldStitching variant="light" style={loginStyles.socialWrapper}>
            <TouchableOpacity style={loginStyles.socialButton} onPress={signInWithGoogle}>
              <Ionicons name="logo-google" size={22} color={COLORS.text} style={loginStyles.socialIcon} />
              <Text style={loginStyles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </GoldStitching>

          <TouchableOpacity style={loginStyles.guestButton} onPress={signInAsGuest}>
            <Ionicons name="enter-outline" size={20} color={COLORS.gold} style={loginStyles.guestIcon} />
            <Text style={loginStyles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={loginStyles.footer}>
            By signing in, you agree to our Terms and Privacy Policy
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LeatherBackground>
  );
}

const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 28,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.brownLight,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  logoText: {
    fontSize: 38,
    fontWeight: '300',
    color: COLORS.gold,
    letterSpacing: 8,
    fontFamily: FONTS.serif,
  },
  logoSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dividerAccent: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.gold,
    marginTop: 20,
    opacity: 0.6,
  },
  errorWrapper: {
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    marginRight: 12,
  },
  errorText: {
    color: COLORS.red,
    fontSize: 14,
    flex: 1,
  },
  formWrapper: {
    marginBottom: 8,
  },
  formContainer: {
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 24,
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.brownDark,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 1,
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
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gold + '30',
  },
  dividerText: {
    color: COLORS.textMuted,
    marginHorizontal: 16,
    fontSize: 14,
  },
  socialWrapper: {
    marginBottom: 16,
  },
  socialButton: {
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: 12,
  },
  socialButtonText: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 16,
  },
  guestButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  guestIcon: {
    marginRight: 10,
  },
  guestButtonText: {
    color: COLORS.gold,
    fontWeight: '500',
    fontSize: 16,
  },
  footer: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 40,
    letterSpacing: 0.5,
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
    bio: 'Quebec Creator',
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
    alert('Settings saved!');
  };

  const menuItems = [
    { id: 'account', icon: 'person-outline', label: 'Account' },
    { id: 'privacy', icon: 'lock-closed-outline', label: 'Privacy' },
    { id: 'notifications', icon: 'notifications-outline', label: 'Notifications' },
    { id: 'appearance', icon: 'color-palette-outline', label: 'Appearance' },
    { id: 'language', icon: 'globe-outline', label: 'Language' },
    { id: 'help', icon: 'help-circle-outline', label: 'Help & Support' },
    { id: 'about', icon: 'information-circle-outline', label: 'About' },
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

            <GoldStitching style={settingsStyles.cardWrapper}>
              <View style={settingsStyles.card}>
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
            </GoldStitching>
          </View>
        );

      case 'privacy':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Privacy Settings</Text>
            
            <ToggleItem 
              icon="lock-closed-outline"
              title="Private Account"
              description="Only approved followers can see your content"
              value={settings.privateAccount}
              onToggle={() => handleToggle('privateAccount')}
            />
            
            <ToggleItem 
              icon="chatbubble-outline"
              title="Allow Comments"
              description="Let others comment on your videos"
              value={settings.allowComments}
              onToggle={() => handleToggle('allowComments')}
            />
            
            <ToggleItem 
              icon="copy-outline"
              title="Allow Duets"
              description="Others can duet with your videos"
              value={settings.allowDuet}
              onToggle={() => handleToggle('allowDuet')}
            />
            
            <ToggleItem 
              icon="download-outline"
              title="Allow Downloads"
              description="Others can download your videos"
              value={settings.allowDownload}
              onToggle={() => handleToggle('allowDownload')}
            />

            <View style={settingsStyles.divider} />
            
            <TouchableOpacity style={settingsStyles.dangerButton}>
              <Ionicons name="close-circle-outline" size={18} color={COLORS.red} style={settingsStyles.dangerIcon} />
              <Text style={settingsStyles.dangerButtonText}>Blocked Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={settingsStyles.dangerButton}>
              <Ionicons name="warning-outline" size={18} color={COLORS.red} style={settingsStyles.dangerIcon} />
              <Text style={settingsStyles.dangerButtonText}>Restricted Accounts</Text>
            </TouchableOpacity>
          </View>
        );

      case 'notifications':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Notification Settings</Text>
            
            <ToggleItem 
              icon="notifications-outline"
              title="Push Notifications"
              description="Receive push notifications"
              value={settings.pushNotifications}
              onToggle={() => handleToggle('pushNotifications')}
            />
            
            <ToggleItem 
              icon="mail-outline"
              title="Email Notifications"
              description="Receive email updates"
              value={settings.emailNotifications}
              onToggle={() => handleToggle('emailNotifications')}
            />

            <View style={settingsStyles.divider} />
            <Text style={settingsStyles.subsectionTitle}>Activity Notifications</Text>
            
            <ToggleItem 
              icon="flame-outline"
              title="Likes"
              description="When someone likes your video"
              value={settings.likeNotifications}
              onToggle={() => handleToggle('likeNotifications')}
            />
            
            <ToggleItem 
              icon="chatbubble-outline"
              title="Comments"
              description="When someone comments on your video"
              value={settings.commentNotifications}
              onToggle={() => handleToggle('commentNotifications')}
            />
            
            <ToggleItem 
              icon="people-outline"
              title="New Followers"
              description="When someone follows you"
              value={settings.followNotifications}
              onToggle={() => handleToggle('followNotifications')}
            />
            
            <ToggleItem 
              icon="radio-outline"
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
              icon="moon-outline"
              title="Dark Mode"
              description="Use dark theme throughout the app"
              value={settings.darkMode}
              onToggle={() => handleToggle('darkMode')}
            />
            
            <ToggleItem 
              icon="eye-outline"
              title="High Contrast"
              description="Increase contrast for better visibility"
              value={settings.highContrast}
              onToggle={() => handleToggle('highContrast')}
            />
            
            <ToggleItem 
              icon="film-outline"
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
            
            <GoldStitching style={settingsStyles.cardWrapper}>
              <View style={settingsStyles.card}>
                <View style={settingsStyles.inputGroup}>
                  <Text style={settingsStyles.inputLabel}>App Language</Text>
                  <View style={settingsStyles.picker}>
                    <Text style={settingsStyles.pickerText}>{settings.language}</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </View>
                </View>
                
                <View style={settingsStyles.inputGroup}>
                  <Text style={settingsStyles.inputLabel}>Content Language</Text>
                  <View style={settingsStyles.picker}>
                    <Text style={settingsStyles.pickerText}>{settings.contentLanguage}</Text>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                  </View>
                </View>
              </View>
            </GoldStitching>

            <GoldStitching variant="light" style={settingsStyles.prideWrapper}>
              <View style={settingsStyles.prideBox}>
                <Ionicons name="flag" size={24} color={COLORS.gold} style={settingsStyles.prideIcon} />
                <Text style={settingsStyles.prideText}>
                  <Text style={{ fontWeight: 'bold' }}>Quebec Pride!</Text> Zyeute celebrates French-Canadian culture and the Joual language.
                </Text>
              </View>
            </GoldStitching>
          </View>
        );

      case 'help':
        return (
          <View style={settingsStyles.section}>
            <Text style={settingsStyles.sectionTitle}>Help & Support</Text>
            
            <HelpItem icon="book-outline" title="Help Center" description="Find answers to common questions" />
            <HelpItem icon="chatbubble-ellipses-outline" title="Contact Us" description="Get in touch with our support team" />
            <HelpItem icon="bug-outline" title="Report a Problem" description="Let us know if something's not working" />
            <HelpItem icon="bulb-outline" title="Feature Request" description="Suggest new features for Zyeute" />
            <HelpItem icon="document-text-outline" title="Community Guidelines" description="Rules for keeping Zyeute safe" />
            <HelpItem icon="scale-outline" title="Terms of Service" description="Legal terms and conditions" />
            <HelpItem icon="lock-closed-outline" title="Privacy Policy" description="How we handle your data" />
          </View>
        );

      case 'about':
        return (
          <View style={[settingsStyles.section, settingsStyles.centerContent]}>
            <View style={settingsStyles.aboutIconContainer}>
              <Ionicons name="flower-outline" size={48} color={COLORS.gold} />
            </View>
            <Text style={settingsStyles.aboutTitle}>Zyeute</Text>
            <Text style={settingsStyles.aboutSubtitle}>Quebec's TikTok</Text>
            
            <GoldStitching style={settingsStyles.infoWrapper}>
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
            </GoldStitching>

            <Text style={settingsStyles.aboutFooter}>Made with love in Quebec</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <LeatherBackground variant="dark">
      <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
        <View style={settingsStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color={COLORS.text} />
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
                <Ionicons 
                  name={item.icon} 
                  size={18} 
                  color={activeSection === item.id ? COLORS.gold : COLORS.textMuted} 
                  style={settingsStyles.menuItemIcon}
                />
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
            
            <GoldStitching variant="muted" style={{ marginTop: 24, marginBottom: 40 }}>
              <TouchableOpacity 
                style={settingsStyles.logoutButton}
                onPress={logout}
              >
                <Ionicons name="log-out-outline" size={20} color={COLORS.red} style={settingsStyles.logoutIcon} />
                <Text style={settingsStyles.dangerButtonText}>Log Out</Text>
              </TouchableOpacity>
            </GoldStitching>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LeatherBackground>
  );
}

// Toggle Item Component
function ToggleItem({ icon, title, description, value, onToggle }) {
  return (
    <GoldStitching style={toggleStyles.wrapper}>
      <View style={toggleStyles.container}>
        <View style={toggleStyles.left}>
          <View style={toggleStyles.iconContainer}>
            <Ionicons name={icon} size={22} color={COLORS.gold} />
          </View>
          <View style={toggleStyles.text}>
            <Text style={toggleStyles.title}>{title}</Text>
            <Text style={toggleStyles.description}>{description}</Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: `${COLORS.textMuted}40`, true: COLORS.gold }}
          thumbColor="#fff"
        />
      </View>
    </GoldStitching>
  );
}

const toggleStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 16,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.leather,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  text: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 16,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});

// Help Item Component
function HelpItem({ icon, title, description }) {
  return (
    <GoldStitching style={helpStyles.wrapper}>
      <TouchableOpacity style={helpStyles.container}>
        <View style={helpStyles.iconContainer}>
          <Ionicons name={icon} size={22} color={COLORS.gold} />
        </View>
        <View style={helpStyles.text}>
          <Text style={helpStyles.title}>{title}</Text>
          <Text style={helpStyles.description}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
    </GoldStitching>
  );
}

const helpStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.leather,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  text: {
    flex: 1,
  },
  title: {
    color: COLORS.text,
    fontWeight: '500',
    fontSize: 16,
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});

// Settings Styles
const settingsStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '20',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '300',
    color: COLORS.gold,
    fontFamily: FONTS.serif,
    letterSpacing: 2,
  },
  content: {
    flex: 1,
  },
  menuScroll: {
    maxHeight: 80,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '20',
  },
  menuContent: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 10,
  },
  menuItemActive: {
    backgroundColor: COLORS.gold + '15',
    borderColor: COLORS.gold + '40',
  },
  menuItemIcon: {
    marginRight: 8,
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
    padding: 20,
  },
  section: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.gold,
    marginBottom: 20,
    fontFamily: FONTS.serif,
    letterSpacing: 1,
  },
  subsectionTitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 14,
    marginTop: 8,
  },
  centerContent: {
    alignItems: 'center',
    paddingTop: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  largeAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.leather,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  largeAvatarText: {
    fontSize: 44,
    color: COLORS.gold,
    fontWeight: '300',
    fontFamily: FONTS.serif,
  },
  changePhotoText: {
    color: COLORS.gold,
    fontSize: 14,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    fontSize: 15,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: COLORS.brownDark,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gold + '30',
    marginVertical: 20,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.red + '60',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: COLORS.red + '10',
  },
  dangerIcon: {
    marginRight: 10,
  },
  dangerButtonText: {
    color: COLORS.red,
    fontWeight: '600',
    fontSize: 15,
  },
  logoutButton: {
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: COLORS.brown,
  },
  logoutIcon: {
    marginRight: 10,
  },
  picker: {
    backgroundColor: COLORS.leather,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    color: COLORS.text,
    fontSize: 15,
  },
  prideWrapper: {
    marginTop: 20,
  },
  prideBox: {
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  prideIcon: {
    marginRight: 14,
    marginTop: 2,
  },
  prideText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },
  aboutIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.leather,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 32,
    fontWeight: '300',
    color: COLORS.gold,
    marginTop: 8,
    fontFamily: FONTS.serif,
    letterSpacing: 4,
  },
  aboutSubtitle: {
    color: COLORS.textMuted,
    marginTop: 8,
    marginBottom: 40,
    letterSpacing: 1,
  },
  infoWrapper: {
    width: '100%',
    maxWidth: 300,
  },
  infoList: {
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 8,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '15',
  },
  infoLabel: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  aboutFooter: {
    color: COLORS.textMuted,
    marginTop: 48,
    fontSize: 12,
    letterSpacing: 1,
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
          <Ionicons name="flame" size={100} color={COLORS.gold} />
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
          <Ionicons 
            name={isLiked ? "flame" : "flame-outline"} 
            size={38} 
            color={isLiked ? COLORS.gold : COLORS.text} 
          />
          <Text style={styles.actionCount}>{(post.fireCount + (isLiked ? 1 : 0)).toLocaleString()}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onShowComments} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={36} color={COLORS.text} />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={36} color={COLORS.text} />
          <Text style={styles.actionCount}>{post.shares}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.caption}>{post.caption}</Text>
        <View style={styles.soundRow}>
          <Ionicons name="musical-note" size={14} color={COLORS.textMuted} style={styles.soundIcon} />
          <Text style={styles.soundInfo}>Original Sound - {post.user.username}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ===== COMMENTS MODAL =====
function CommentsModal({ visible, onClose }) {
  const [comment, setComment] = useState('');
  const comments = [
    { id: 1, user: 'marie_qc', text: "C'est ben beau!", avatar: 'M' },
    { id: 2, user: 'ti_guy_514', text: 'Tabarnac!', avatar: 'T' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          
          {comments.map(c => (
            <GoldStitching key={c.id} variant="muted" style={styles.commentWrapper}>
              <View style={styles.commentItem}>
                <View style={styles.commentAvatar}>
                  <Text style={styles.commentAvatarText}>{c.avatar}</Text>
                </View>
                <View style={styles.commentContent}>
                  <Text style={styles.commentUser}>@{c.user}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              </View>
            </GoldStitching>
          ))}

          <GoldStitching style={styles.commentInputWrapper}>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={COLORS.textMuted}
                value={comment}
                onChangeText={setComment}
              />
              <TouchableOpacity style={styles.commentButton}>
                <Ionicons name="send" size={20} color={COLORS.brownDark} />
              </TouchableOpacity>
            </View>
          </GoldStitching>
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
        <GoldStitching style={styles.profileWrapper}>
          <View style={styles.profileContent}>
            <TouchableOpacity style={styles.profileCloseButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>

            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>M</Text>
            </View>
            <Text style={styles.profileUsername}>@marie_qc</Text>
            <Text style={styles.profileBio}>Quebec Creator</Text>
            
            <View style={styles.profileStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Videos</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>1.2K</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.dividerVertical} />
              <View style={styles.stat}>
                <Text style={styles.statNumber}>89</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>

            <View style={styles.profileButtons}>
              <TouchableOpacity style={styles.followButton}>
                <Text style={styles.followButtonText}>Follow</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeProfileButton}>
                <Text style={styles.closeProfileButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GoldStitching>
      </View>
    </Modal>
  );
}

// ===== CREATE SCREEN =====
function CreateScreen() {
  return (
    <LeatherBackground variant="dark">
      <View style={[styles.container, styles.createContainer]}>
        <View style={createStyles.header}>
          <Ionicons name="flower-outline" size={48} color={COLORS.gold} />
          <Text style={createStyles.title}>Create</Text>
          <Text style={createStyles.subtitle}>Share your Quebec story</Text>
        </View>
        
        <GoldStitching style={createStyles.buttonWrapper}>
          <TouchableOpacity style={createStyles.createButton}>
            <View style={createStyles.iconContainer}>
              <Ionicons name="videocam" size={40} color={COLORS.gold} />
            </View>
            <Text style={createStyles.createButtonText}>Record Video</Text>
            <Text style={createStyles.createButtonSubtext}>Capture a moment</Text>
          </TouchableOpacity>
        </GoldStitching>

        <GoldStitching variant="light" style={createStyles.buttonWrapper}>
          <TouchableOpacity style={createStyles.createButton}>
            <View style={createStyles.iconContainer}>
              <Ionicons name="images" size={40} color={COLORS.gold} />
            </View>
            <Text style={createStyles.createButtonText}>Upload from Gallery</Text>
            <Text style={createStyles.createButtonSubtext}>Choose existing video</Text>
          </TouchableOpacity>
        </GoldStitching>
      </View>
    </LeatherBackground>
  );
}

const createStyles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    color: COLORS.gold,
    fontSize: 36,
    fontWeight: '300',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: FONTS.serif,
    letterSpacing: 4,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    letterSpacing: 1,
  },
  buttonWrapper: {
    marginBottom: 20,
    width: '100%',
  },
  createButton: {
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.leather,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  },
  createButtonText: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 18,
    marginBottom: 6,
  },
  createButtonSubtext: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});

// ===== PROFILE SCREEN =====
function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('videos');

  return (
    <LeatherBackground variant="dark">
      <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
        <ScrollView contentContainerStyle={styles.profileScreen}>
          <View style={profileStyles.avatarOuter}>
            <View style={styles.profileScreenAvatar}>
              <Text style={styles.profileScreenAvatarText}>{user?.username?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          </View>
          <Text style={styles.profileScreenUsername}>@{user?.username || 'guest'}</Text>
          <Text style={styles.profileScreenBio}>Quebec Creator</Text>
          
          <GoldStitching style={profileStyles.statsWrapper}>
            <View style={styles.profileScreenStats}>
              <View style={styles.screenStat}>
                <Text style={styles.screenStatNumber}>12</Text>
                <Text style={styles.screenStatLabel}>Videos</Text>
              </View>
              <View style={profileStyles.statDivider} />
              <View style={styles.screenStat}>
                <Text style={styles.screenStatNumber}>1.2K</Text>
                <Text style={styles.screenStatLabel}>Followers</Text>
              </View>
              <View style={profileStyles.statDivider} />
              <View style={styles.screenStat}>
                <Text style={styles.screenStatNumber}>89</Text>
                <Text style={styles.screenStatLabel}>Following</Text>
              </View>
            </View>
          </GoldStitching>

          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.gold} style={profileStyles.buttonIcon} />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.red} style={profileStyles.buttonIcon} />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>

          <View style={styles.profileTabs}>
            <TouchableOpacity 
              style={[styles.profileTab, activeTab === 'videos' && styles.profileTabActive]}
              onPress={() => setActiveTab('videos')}
            >
              <Ionicons 
                name={activeTab === 'videos' ? "grid" : "grid-outline"} 
                size={20} 
                color={activeTab === 'videos' ? COLORS.gold : COLORS.textMuted} 
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.profileTabText, activeTab === 'videos' && styles.profileTabTextActive]}>Videos</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.profileTab, activeTab === 'liked' && styles.profileTabActive]}
              onPress={() => setActiveTab('liked')}
            >
              <Ionicons 
                name={activeTab === 'liked' ? "heart" : "heart-outline"} 
                size={20} 
                color={activeTab === 'liked' ? COLORS.gold : COLORS.textMuted} 
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.profileTabText, activeTab === 'liked' && styles.profileTabTextActive]}>Liked</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LeatherBackground>
  );
}

const profileStyles = StyleSheet.create({
  avatarOuter: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.gold + '40',
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  statsWrapper: {
    marginTop: 24,
    width: '90%',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gold + '30',
  },
  buttonIcon: {
    marginRight: 10,
  },
});

// ===== SEARCH SCREEN =====
function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('videos');

  return (
    <LeatherBackground variant="dark">
      <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
        <View style={styles.searchHeader}>
          <GoldStitching style={searchStyles.inputWrapper}>
            <View style={searchStyles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.goldMuted} style={searchStyles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search videos, creators, hashtags..."
                placeholderTextColor={COLORS.textMuted}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </GoldStitching>
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
          <View style={searchStyles.trendingHeader}>
            <Ionicons name="flame" size={22} color={COLORS.gold} />
            <Text style={searchStyles.trendingTitle}>Trending in Quebec</Text>
          </View>
          <View style={styles.hashtagGrid}>
            {['#Quebec', '#Montreal', '#Joual', '#FleurDeLys', '#Poutine', '#Maple'].map((tag) => (
              <GoldStitching key={tag} style={searchStyles.hashtagWrapper}>
                <TouchableOpacity style={styles.hashtagCard}>
                  <Text style={styles.hashtagText}>{tag}</Text>
                </TouchableOpacity>
              </GoldStitching>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LeatherBackground>
  );
}

const searchStyles = StyleSheet.create({
  inputWrapper: {
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendingTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '300',
    marginLeft: 10,
    fontFamily: FONTS.serif,
    letterSpacing: 1,
  },
  hashtagWrapper: {
    width: (width - 56) / 2,
  },
});

// ===== NOTIFICATIONS SCREEN =====
function NotificationsScreen() {
  const notifications = [
    { id: 1, text: '@marie_qc liked your video', time: '2m ago', icon: 'flame', type: 'like' },
    { id: 2, text: '@ti_guy started following you', time: '1h ago', icon: 'person-add', type: 'follow' },
  ];

  return (
    <LeatherBackground variant="dark">
      <SafeAreaView style={[styles.container, { paddingTop: 50 }]}>
        <View style={notifStyles.header}>
          <Ionicons name="notifications" size={28} color={COLORS.gold} style={notifStyles.headerIcon} />
          <Text style={styles.screenTitle}>Notifications</Text>
        </View>
        {notifications.map((n) => (
          <GoldStitching key={n.id} style={notifStyles.wrapper}>
            <View style={styles.notificationItem}>
              <View style={notifStyles.iconContainer}>
                <Ionicons name={n.icon} size={22} color={COLORS.gold} />
              </View>
              <View style={notifStyles.content}>
                <Text style={styles.notificationText}>{n.text}</Text>
                <Text style={styles.notificationTime}>{n.time}</Text>
              </View>
            </View>
          </GoldStitching>
        ))}
      </SafeAreaView>
    </LeatherBackground>
  );
}

const notifStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerIcon: {
    marginRight: 12,
  },
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.leather,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
  },
  content: {
    flex: 1,
  },
});

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
          borderTopWidth: 1,
          borderTopColor: COLORS.gold + '20',
          height: 90,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={VideoFeedScreen}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size || 26} color={color} />
          ) 
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size || 26} color={color} />
          ) 
        }}
      />
      <Tab.Screen 
        name="Create" 
        component={CreateScreen}
        options={{ 
          tabBarIcon: ({ color }) => (
            <View style={styles.createTabButton}>
              <Ionicons name="add" size={32} color={COLORS.brownDark} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications" size={size || 26} color={color} />
          ) 
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{ 
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size || 26} color={color} />
          ) 
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <LeatherBackground variant="dark">
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={loaderStyles.iconContainer}>
            <Ionicons name="flower-outline" size={64} color={COLORS.gold} />
          </View>
          <Text style={loaderStyles.text}>Loading...</Text>
        </View>
      </LeatherBackground>
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

const loaderStyles = StyleSheet.create({
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.brownLight,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 16,
    letterSpacing: 2,
  },
});

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
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: 130,
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.leather,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    fontSize: 22,
    color: COLORS.gold,
    fontWeight: '300',
    fontFamily: FONTS.serif,
  },
  actionLabel: {
    color: COLORS.text,
    fontSize: 11,
    marginTop: 4,
  },
  actionCount: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  bottomInfo: {
    position: 'absolute',
    left: 20,
    right: 110,
    bottom: 110,
  },
  caption: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soundIcon: {
    marginRight: 6,
  },
  soundInfo: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    backgroundColor: COLORS.brown,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderTopColor: COLORS.gold + '30',
  },
  modalHandle: {
    width: 44,
    height: 4,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '300',
    fontFamily: FONTS.serif,
    letterSpacing: 2,
  },
  commentWrapper: {
    marginBottom: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 16,
  },
  commentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.leather,
    borderWidth: 1,
    borderColor: COLORS.gold + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  commentAvatarText: {
    fontSize: 18,
    color: COLORS.gold,
    fontWeight: '500',
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  commentText: {
    color: COLORS.text,
    fontSize: 14,
  },
  commentInputWrapper: {
    marginTop: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brown,
    borderRadius: 10,
    padding: 4,
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.leather,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.gold + '30',
    marginRight: 8,
  },
  commentButton: {
    backgroundColor: COLORS.gold,
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Profile modal
  profileOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  profileWrapper: {
    width: '100%',
  },
  profileContent: {
    backgroundColor: COLORS.brown,
    borderRadius: 24,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  profileCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  profileAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.leather,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  profileAvatarText: {
    fontSize: 36,
    color: COLORS.gold,
    fontWeight: '300',
    fontFamily: FONTS.serif,
  },
  profileUsername: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '600',
  },
  profileBio: {
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 24,
    fontSize: 15,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  dividerVertical: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gold + '30',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: COLORS.gold,
    fontSize: 22,
    fontWeight: '600',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
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
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  followButtonText: {
    color: COLORS.brownDark,
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 1,
  },
  closeProfileButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gold + '50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeProfileButtonText: {
    color: COLORS.gold,
    fontWeight: '500',
    fontSize: 16,
  },
  // Create screen
  createContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  // Profile screen
  profileScreen: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  profileScreenAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: COLORS.leather,
    borderWidth: 3,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileScreenAvatarText: {
    fontSize: 44,
    color: COLORS.gold,
    fontWeight: '300',
    fontFamily: FONTS.serif,
  },
  profileScreenUsername: {
    color: COLORS.gold,
    fontSize: 26,
    fontWeight: '600',
    marginTop: 16,
  },
  profileScreenBio: {
    color: COLORS.textMuted,
    marginTop: 6,
    fontSize: 15,
  },
  profileScreenStats: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 32,
    backgroundColor: COLORS.brown,
    borderRadius: 10,
  },
  screenStat: {
    alignItems: 'center',
  },
  screenStatNumber: {
    color: COLORS.gold,
    fontSize: 24,
    fontWeight: '600',
  },
  screenStatLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  settingsButton: {
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.gold + '50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  settingsButtonText: {
    color: COLORS.gold,
    fontWeight: '500',
    fontSize: 16,
  },
  logoutButton: {
    width: '85%',
    borderWidth: 1,
    borderColor: COLORS.red + '50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: COLORS.red,
    fontWeight: '500',
    fontSize: 16,
  },
  profileTabs: {
    flexDirection: 'row',
    marginTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '30',
    width: '100%',
  },
  profileTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  profileTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  profileTabText: {
    color: COLORS.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
  profileTabTextActive: {
    color: COLORS.gold,
  },
  // Search
  searchHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 15,
  },
  searchTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold + '25',
  },
  searchTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.gold,
  },
  searchTabText: {
    color: COLORS.textMuted,
    textTransform: 'capitalize',
    fontSize: 15,
  },
  searchTabTextActive: {
    color: COLORS.gold,
    fontWeight: '600',
  },
  trendingSection: {
    padding: 20,
  },
  hashtagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  hashtagCard: {
    backgroundColor: COLORS.brown,
    padding: 18,
    width: '100%',
    alignItems: 'center',
  },
  hashtagText: {
    color: COLORS.gold,
    fontWeight: '600',
    fontSize: 15,
  },
  // Notifications
  screenTitle: {
    color: COLORS.gold,
    fontSize: 26,
    fontWeight: '300',
    fontFamily: FONTS.serif,
    letterSpacing: 2,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brown,
    padding: 16,
    borderRadius: 10,
  },
  notificationText: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 20,
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
    marginBottom: 24,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
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
