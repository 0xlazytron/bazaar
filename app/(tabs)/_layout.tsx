import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { getCurrentUser } from '../../lib/auth';
import { subscribeIncomingCalls } from '../../lib/firestore';
import { registerNotificationsAsync, notifyIncomingCall } from '../../lib/notifications';

export default function TabLayout() {
  const router = useRouter();
  const handledCallId = useRef<string | null>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    registerNotificationsAsync().catch(() => { });
    const unsub = subscribeIncomingCalls(user.uid, (c) => {
      if (handledCallId.current === c.id) return;
      handledCallId.current = c.id || null;
      notifyIncomingCall('Contact', c.type).catch(() => { });
      if (c.id) router.push({ pathname: '/(tabs)/call/[id]', params: { id: c.id, role: 'callee' } });
    });
    return () => unsub();
  }, [router]);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="categories" />
        <Tabs.Screen name="new-listing" />
        <Tabs.Screen name="messages" />
        <Tabs.Screen name="profile" />
        <Tabs.Screen name="favorites" />
        <Tabs.Screen name="cart" />
      </Tabs>
      <BottomNavigation />
    </View>
  );
}
