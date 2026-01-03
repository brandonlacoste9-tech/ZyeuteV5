import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Colors } from "./src/theme/colors";
import { ReelFeed } from "./src/components/ReelFeed";
import { TiGuyChat } from "./src/components/TiGuyChat";
import { ProfileScreen } from "./src/components/ProfileScreen";
import { Home, MessageSquare, User, Search } from "lucide-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
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
              tabBarIcon: ({ color }) => <Home size={24} color={color} />,
              tabBarLabel: "DÉCOUVRIR",
            }}
          />
          <Tab.Screen
            name="Search"
            component={View} // Placeholder
            options={{
              tabBarIcon: ({ color }) => <Search size={24} color={color} />,
              tabBarLabel: "RECHERCHE",
            }}
          />
          <Tab.Screen
            name="Chat"
            component={TiGuyChat}
            options={{
              tabBarIcon: ({ color }) => (
                <MessageSquare size={24} color={color} />
              ),
              tabBarLabel: "TI-GUY",
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              tabBarIcon: ({ color }) => <User size={24} color={color} />,
              tabBarLabel: "MON HIVE",
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
});
