import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getCurrentUser, subscribeUserProfile, type UserProfile } from '../../lib/auth';
import { subscribeUserNotifications } from '../../lib/firestore';
import { ThemedText } from './ThemedText';

export const TopHeader = ({ transparent = false }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fallbackName, setFallbackName] = useState<string | null>(null);
  const [fallbackPhotoURL, setFallbackPhotoURL] = useState<string | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) return;

    setFallbackName(user.displayName || user.email || null);
    setFallbackPhotoURL(user.photoURL || null);

    const profileUnsub = subscribeUserProfile(user.uid, (p) => {
      setProfile(p);
    });

    const notificationsUnsub = subscribeUserNotifications(user.uid, (items) => {
      const hasUnread = items.some((n: any) => !n.isRead);
      setHasUnreadNotifications(hasUnread);
    });

    return () => {
      profileUnsub();
      notificationsUnsub();
    };
  }, []);

  const displayName = profile?.displayName || fallbackName || 'User';
  const photoURL = profile?.photoURL || fallbackPhotoURL || null;
  const avatarSource = photoURL
    ? { uri: photoURL }
    : require('../../assets/images/avatar.png');

  return (
    <View style={[styles.container]}>
      {transparent ? (
        <LinearGradient
          colors={['#16A34A', '#15803D']}
          style={styles.gradient}
        />
      ) : (
        <View style={styles.solidBackground} />
      )}
      <View style={styles.userInfo}>
        <Image
          source={avatarSource}
          style={styles.avatar}
        />
        <View>
          <ThemedText style={[styles.welcomeText, transparent && styles.lightText]}>Welcome,</ThemedText>
          <ThemedText style={[styles.userName, transparent && styles.lightText]}>{displayName}</ThemedText>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/notifications')}
        >
          <Image
            source={require('../../assets/images/icons/notification.png')}
            style={styles.icon}
          />
          {hasUnreadNotifications && <View style={styles.notificationBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/favorites')}
        >
          <Image
            source={require('../../assets/images/icons/favorite.png')}
            style={styles.icon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push('/cart')}
        >
          <Image
            source={require('../../assets/images/icons/cart.png')}
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    zIndex: 10,
    position: 'relative',
  },
  lightText: {
    color: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  solidBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 14,
    color: '#020817',
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#020817',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 16,
    height: 16,
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
