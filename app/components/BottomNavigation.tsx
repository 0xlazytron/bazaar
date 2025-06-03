import { ThemedText } from '@/components/ThemedText';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const tabs = [
  {
    name: 'Home',
    icon: require('@/assets/images/icons/home.png'),
    activeIcon: require('@/assets/images/icons/home-active.png'),
    path: '/(tabs)',
  },
  {
    name: 'Categories',
    icon: require('@/assets/images/icons/categories.png'),
    activeIcon: require('@/assets/images/icons/categories-active.png'),
    path: '/(tabs)/categories',
  },
  {
    name: 'Sell',
    icon: require('@/assets/images/icons/sell.png'),
    activeIcon: require('@/assets/images/icons/sell-active.png'), // Added active icon
    path: '/(tabs)/new-listing',
  },
  {
    name: 'Messages',
    icon: require('@/assets/images/icons/messages.png'),
    activeIcon: require('@/assets/images/icons/messages-active.png'),
    path: '/(tabs)/messages',
  },
  {
    name: 'Profile',
    icon: require('@/assets/images/icons/profile.png'),
    activeIcon: require('@/assets/images/icons/profile-active.png'),
    path: '/(tabs)/profile',
  },
] as const;

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const isTabActive = (tabPath: string) => {
    const basePath = pathname.split('/').pop();
    const tabName = tabPath.split('/').pop();

    if (tabName === undefined) return false;

    if (tabName === '' || tabName === 'index') {
      return basePath === '' || basePath === 'index' || pathname === '/(tabs)';
    }

    return basePath === tabName;
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = isTabActive(tab.path);
        const isSell = tab.name === 'Sell';

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.path as any)}
          >
            <View style={[
              styles.iconContainer,
              isSell && styles.sellIconContainer,
              isActive && isSell && styles.activeSellIconContainer
            ]}>
              <Image
                source={isActive && tab.activeIcon ? tab.activeIcon : tab.icon}
                style={[
                  styles.icon,
                  isSell && styles.sellIcon,
                ]}
                resizeMode="contain"
              />
            </View>
            <ThemedText style={[
              styles.label,
              isActive && styles.activeLabel,
              isSell && styles.sellLabel,
              isActive && isSell && styles.activeSellLabel
            ]}>
              {tab.name}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    height: 85,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sellIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#16A34A',
    borderRadius: 24,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -24,
  },
  activeSellIconContainer: {
    backgroundColor: '#16A34A',
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  sellIcon: {
    tintColor: '#FFFFFF',
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  activeLabel: {
    color: '#16A34A',
    fontWeight: '500',
  },
  sellLabel: {
    color: '#6B7280',
    marginTop: 0,
  },
  activeSellLabel: {
    color: '#16A34A',
  },
});