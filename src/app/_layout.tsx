import { Stack } from "expo-router";
import { View } from "react-native";

import Footer from "../components/Footer";
import "../global.css";

export default function RootLayout() {
  return (
    <View className="flex-1">
      <View className="flex-1 pb-24">
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>

      <Footer />
    </View>
  );
}
