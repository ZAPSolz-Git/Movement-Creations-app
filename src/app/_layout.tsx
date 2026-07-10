import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7C3AED",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: {
          height: 70,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="tracks"
        options={{
          title: "Tracks",
          tabBarIcon: ({ color }) => (
            <Ionicons name="musical-notes" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="revenue"
        options={{
          title: "Revenue",
          tabBarIcon: ({ color }) => (
            <Ionicons name="wallet" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => (
            <Ionicons name="bar-chart" size={20} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
