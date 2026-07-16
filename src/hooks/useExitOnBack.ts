// hooks/useExitOnBack.ts
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Alert, BackHandler } from "react-native";

export function useExitOnBack() {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Exit",
            style: "destructive",
            onPress: () => BackHandler.exitApp(),
          },
        ]);
        return true; // swallow the back event — never falls through to "/"
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, []),
  );
}
