import { Tabs } from 'expo-router';
import { View } from 'react-native';
import BottomNavigation from '../components/BottomNavigation';

export default function TabLayout() {
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
      </Tabs>
      <BottomNavigation />
    </View>
  );
}
