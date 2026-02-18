import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useColorScheme } from "@/hooks/useColorScheme";
import { ToastProvider } from "./components/ToastContext";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    let active = true;
    const checkLastResponse = async () => {
      const lastResponse =
        await Notifications.getLastNotificationResponseAsync();
      const data = lastResponse?.notification.request.content.data as any;
      const notificationId = data?.notificationId as string | undefined;
      if (active && notificationId) {
        router.push({
          pathname: "/(tabs)/notification/[id]",
          params: { id: notificationId },
        });
      }
    };

    checkLastResponse().catch(() => { });

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        const notificationId = data?.notificationId as string | undefined;
        if (notificationId) {
          router.push({
            pathname: "/(tabs)/notification/[id]",
            params: { id: notificationId },
          });
        }
      },
    );

    return () => {
      active = false;
      sub.remove();
    };
  }, [router]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const apply = () => {
      NavigationBar.setBehaviorAsync("inset-swipe").catch(() => { });
      NavigationBar.setVisibilityAsync("hidden").catch(() => { });
    };

    apply();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") apply();
    });

    return () => sub.remove();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="auth/sign-up"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="auth/sign-in"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="+not-found"
                options={{ headerShown: false }}
              />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
