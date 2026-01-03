import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Colors } from "./src/theme/colors";
import { ReelFeed } from "./src/components/ReelFeed";
import { TiGuyChat } from "./src/components/TiGuyChat";
import { ProfileScreen } from "./src/components/ProfileScreen";
import { SearchScreen } from "./src/components/SearchScreen";
import { RitualsScreen } from "./src/components/RitualsScreen";
import { MessagesScreen } from "./src/components/MessagesScreen";
import { StudioScreen } from "./src/components/StudioScreen";
import {
  Home,
  MessageSquare,
  User,
  Search,
  PlayCircle,
  Library,
  Sparkles,
} from "lucide-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          id="main_tabs"
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.background,
              borderTopColor: Colors.leatherLight,
              borderTopWidth: 2,
              height: Platform.OS === "ios" ? 90 : 70,
              paddingBottom: Platform.OS === "ios" ? 30 : 10,
              paddingTop: 10,
            },
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarLabelStyle: {
              fontSize: 10,
              fontWeight: "700",
              marginTop: 5,
            },
          }}
        >
          <Tab.Screen
            name="Feed"
            component={ReelFeed}
            options={{
              tabBarIcon: ({ color }) => <Home size={22} color={color} />,
              tabBarLabel: "SWARM",
            }}
          />
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              tabBarIcon: ({ color }) => <Search size={22} color={color} />,
              tabBarLabel: "EXPLORER",
            }}
          />
          <Tab.Screen
            name="Studio"
            component={StudioScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <View style={styles.studioTab}>
                  <Sparkles
                    size={24}
                    color={color === Colors.primary ? "#000" : color}
                  />
                </View>
              ),
              tabBarLabel: "STUDIO",
            }}
          />
          <Tab.Screen
            name="Rituals"
            component={RitualsScreen}
            options={{
              tabBarIcon: ({ color }) => <PlayCircle size={22} color={color} />,
              tabBarLabel: "RITUELS",
            }}
          />
          <Tab.Screen
            name="Messages"
            component={MessagesScreen}
            options={{
              tabBarIcon: ({ color }) => (
                <MessageSquare size={22} color={color} />
              ),
              tabBarLabel: "DIRECTS",
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color }) => <User size={22} color={color} />,
              tabBarLabel: "RUCHE",
            }}
          />
        </Tab.Navigator>
        <StatusBar style="light" translucent backgroundColor="transparent" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  studioTab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -5,
  },
});
