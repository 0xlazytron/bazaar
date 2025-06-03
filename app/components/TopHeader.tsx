import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

export const TopHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Image 
          source={require('../../assets/images/avatar.png')}
          style={styles.avatar}
        />
        <View>
          <ThemedText style={styles.welcomeText}>Welcome,</ThemedText>
          <ThemedText style={styles.userName}>Gushpoor 👑</ThemedText>
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
          <View style={styles.notificationBadge} />
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
    paddingTop: 60,
    paddingBottom: 16,
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