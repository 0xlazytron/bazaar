import { ThemedText } from '@/components/ThemedText';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getCurrentUser, subscribeUserProfile } from '../../lib/auth';
import { db } from '../../lib/firebase';
import { registerNotificationsAsync, notifyIncomingCall, registerAndStorePushTokenAsync, notifyMessageWithImage, notifyProductWithImage } from '../../lib/notifications';
import { subscribeUnreadTotal } from '../../lib/firestore';
import Svg, { Path } from 'react-native-svg';

// SVG icon components
const HomeIcon = ({ color = "#6B7280" }) => (
  <Svg width="22" height="26" viewBox="0 0 14 17" fill="none">
    <Path d="M12.6667 16V14.3333C12.6667 13.4493 12.3155 12.6014 11.6904 11.9763C11.0652 11.3512 10.2174 11 9.33333 11H4.33333C3.44928 11 2.60143 11.3512 1.97631 11.9763C1.35119 12.6014 1 13.4493 1 14.3333V16M10.1667 4.33333C10.1667 6.17428 8.67428 7.66667 6.83333 7.66667C4.99238 7.66667 3.5 6.17428 3.5 4.33333C3.5 2.49238 4.99238 1 6.83333 1C8.67428 1 10.1667 2.49238 10.1667 4.33333Z" stroke={color} strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CategoriesIcon = ({ color = "#6B7280" }) => (
  <Svg width="25" height="25" viewBox="0 0 17 17" fill="none">
    <Path
      d="M15.9998 15.9998L12.4165 12.4165M14.3333 7.66667C14.3333 11.3486 11.3486 14.3333 7.66667 14.3333C3.98477 14.3333 1 11.3486 1 7.66667C1 3.98477 3.98477 1 7.66667 1C11.3486 1 14.3333 3.98477 14.3333 7.66667Z"
      stroke={color}
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SellIcon = ({ color = "#FFFFFF" }) => (
  <Svg width="26" height="26" viewBox="0 0 22 22" fill="none">
    <Path
      d="M7 11H15M11 7V15M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MessagesIcon = ({ color = "#6B7280" }) => (
  <Svg width="25" height="25" viewBox="0 0 18 18" fill="none">
    <Path
      d="M5.91667 15.1732C7.50715 15.9891 9.33674 16.2101 11.0757 15.7964C12.8147 15.3826 14.3488 14.3614 15.4015 12.9167C16.4541 11.472 16.9562 9.69881 16.8172 7.91668C16.6781 6.13456 15.9072 4.46069 14.6432 3.19671C13.3792 1.93273 11.7053 1.16176 9.9232 1.02273C8.14108 0.8837 6.36789 1.38575 4.92318 2.43842C3.47847 3.49109 2.45724 5.02514 2.04352 6.76414C1.62979 8.50314 1.85079 10.3327 2.66667 11.9232L1 16.8399L5.91667 15.1732Z"
      stroke={color}
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ProfileIcon = ({ color = "#6B7280" }) => (
  <Svg width="22" height="26" viewBox="0 0 14 17" fill="none">
    <Path
      d="M12.6667 16V14.3333C12.6667 13.4493 12.3155 12.6014 11.6904 11.9763C11.0652 11.3512 10.2174 11 9.33333 11H4.33333C3.44928 11 2.60143 11.3512 1.97631 11.9763C1.35119 12.6014 1 13.4493 1 14.3333V16M10.1667 4.33333C10.1667 6.17428 8.67428 7.66667 6.83333 7.66667C4.99238 7.66667 3.5 6.17428 3.5 4.33333C3.5 2.49238 4.99238 1 6.83333 1C8.67428 1 10.1667 2.49238 10.1667 4.33333Z"
      stroke={color}
      strokeWidth="1.66667"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const tabs = [
  {
    name: 'Home',
    icon: (props: { color?: string }) => <HomeIcon {...props} />,
    path: '/(tabs)',
  },
  {
    name: 'Categories',
    icon: (props: { color?: string }) => <CategoriesIcon {...props} />,
    path: '/(tabs)/categories',
  },
  {
    name: 'Sell',
    icon: (props: { color?: string }) => <SellIcon {...props} />,
    path: '/(tabs)/new-listing',
  },
  {
    name: 'Messages',
    icon: (props: { color?: string }) => <MessagesIcon {...props} />,
    path: '/(tabs)/messages',
  },
  {
    name: 'Profile',
    icon: (props: { color?: string }) => <ProfileIcon {...props} />,
    path: '/(tabs)/profile',
  },
] as const;

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadTotal, setUnreadTotal] = React.useState<number>(0);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;
    const subscribedAt = Date.now();
    registerNotificationsAsync().catch(() => { });
    registerAndStorePushTokenAsync(user.uid).catch(() => { });
    const callsQ = query(collection(db, 'calls'), where('calleeId', '==', user.uid), where('status', '==', 'initiated'));
    const unsub = onSnapshot(callsQ, (snapshot) => {
      snapshot.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const data: any = chg.doc.data();
          const peerId = data.callerId as string;
          subscribeUserProfile(peerId, (p) => {
            notifyIncomingCall(p?.displayName || 'Caller', data.type).catch(() => { });
          });
        }
      });
    });
    const msgQ = query(collection(db, 'messages'), where('receiverId', '==', user.uid), where('isRead', '==', false));
    const msgUnsub = onSnapshot(msgQ, (snapshot) => {
      snapshot.docChanges().forEach((chg) => {
        if (chg.type === 'added') {
          const data: any = chg.doc.data();
          const createdAtValue: any = data.createdAt;
          let createdAtMs = 0;
          if (createdAtValue?.toDate) {
            createdAtMs = createdAtValue.toDate().getTime();
          } else if (createdAtValue instanceof Date) {
            createdAtMs = createdAtValue.getTime();
          } else if (typeof createdAtValue === 'number') {
            createdAtMs = createdAtValue;
          }
          if (!createdAtMs || createdAtMs < subscribedAt - 2000) {
            return;
          }
          const senderId = data.senderId as string;
          subscribeUserProfile(senderId, (p) => {
            const name = p?.displayName || 'New message';
            const body = data.type === 'image' ? 'Sent an image' : (data.content || 'New message');
            const avatar = p?.photoURL || undefined;
            notifyMessageWithImage(name, body, avatar).catch(() => { });
          });
        }
      });
    });
    const notifQ = query(collection(db, 'notifications'), where('userId', '==', user.uid));
    const notifUnsub = onSnapshot(notifQ, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type !== 'added') return;
        const data: any = change.doc.data();
        const createdAtValue: any = data.createdAt;
        let createdAtMs = 0;
        if (createdAtValue?.toDate) {
          createdAtMs = createdAtValue.toDate().getTime();
        } else if (createdAtValue instanceof Date) {
          createdAtMs = createdAtValue.getTime();
        } else if (typeof createdAtValue === 'number') {
          createdAtMs = createdAtValue;
        }
        if (!createdAtMs || createdAtMs < subscribedAt - 2000) {
          return;
        }
        const title = data.title || 'Notification';
        const body = data.message || '';
        const imageUrl = data.productImage as string | undefined;
        notifyProductWithImage(title, body, imageUrl).catch(() => { });
      });
    });
    const unreadUnsub = subscribeUnreadTotal(user.uid, (total) => {
      setUnreadTotal(total);
    });
    return () => {
      unsub();
      msgUnsub();
      notifUnsub();
      unreadUnsub();
    };
  }, []);

  // Hide bottom navigation on message and call screens
  if (pathname.includes('/message/') || pathname.includes('/call/')) {
    return null;
  }

  const isTabActive = (tabPath: string) => {
    // Special case for Home tab
    if (tabPath === '/(tabs)') {
      // Check for root URL '/' as well as other Home tab paths
      return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index' || pathname === '/(tabs)/' ||
        (pathname.startsWith('/(tabs)') && !pathname.includes('/', 7));
    }

    const basePath = pathname.split('/').pop();
    const tabName = tabPath.split('/').pop();

    if (tabName === undefined) return false;

    if (tabName === '' || tabName === 'index') {
      return basePath === '' || basePath === 'index' || pathname === '/(tabs)' || pathname === '/';
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
              {tab.icon({ color: isActive ? (isSell ? '#FFFFFF' : '#16A34A') : (isSell ? '#FFFFFF' : '#6B7280') })}
              {tab.name === 'Messages' && unreadTotal > 0 && (
                <View style={styles.badge}>
                  <ThemedText style={styles.badgeText}>{unreadTotal}</ThemedText>
                </View>
              )}
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
    paddingBottom: 2,
    paddingTop: 1,
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
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
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
