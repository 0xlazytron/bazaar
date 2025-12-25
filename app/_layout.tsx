import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { ToastProvider } from './components/ToastContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    let active = true;
    const checkLastResponse = async () => {
      const lastResponse = await Notifications.getLastNotificationResponseAsync();
      const data = lastResponse?.notification.request.content.data as any;
      const notificationId = data?.notificationId as string | undefined;
      if (active && notificationId) {
        router.push({
          pathname: '/(tabs)/notification/[id]',
          params: { id: notificationId },
        });
      }
    };

    checkLastResponse().catch(() => {});

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      const notificationId = data?.notificationId as string | undefined;
      if (notificationId) {
        router.push({
          pathname: '/(tabs)/notification/[id]',
          params: { id: notificationId },
        });
      }
    });

    return () => {
      active = false;
      sub.remove();
    };
  }, [router]);

  if (!loaded) {
    return null;
  }

  return (
    <ToastProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="categories" options={{ headerShown: false }} />
          <Stack.Screen name="new-listing" options={{ headerShown: false }} />
          <Stack.Screen name="new-listing/step-2" options={{ headerShown: false }} />
          <Stack.Screen name="new-listing/step-3" options={{ headerShown: false }} />
          <Stack.Screen name="all-categories" options={{ headerShown: false }} />
          <Stack.Screen name="product/[id]" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="+not-found" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </ToastProvider>
  );
}
