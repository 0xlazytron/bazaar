import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppNotification, getNotification, markNotificationAsRead } from '../../../lib/firestore';
import { ImageWithLoader } from '../../components/ImageWithLoader';

const formatTimeAgo = (timestamp: any) => {
  if (!timestamp) return '';
  const value = (timestamp as any).toDate ? (timestamp as any).toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - value.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

const NotificationDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id || typeof id !== 'string') {
        setLoading(false);
        return;
      }
      try {
        const data = await getNotification(id);
        if (!active) return;
        setNotification(data);
        if (data && !data.isRead && data.id) {
          await markNotificationAsRead(data.id);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handlePrimaryAction = () => {
    if (!notification) return;
    if (
      (notification.type === 'auction_outbid' ||
        notification.type === 'auction_won' ||
        notification.type === 'auction_bid') &&
      notification.productId
    ) {
      router.push({ pathname: '/(tabs)/product/[id]', params: { id: notification.productId } });
      return;
    }
    if (notification.type === 'order_placed' || notification.type === 'order_seller') {
      router.push({ pathname: '/(tabs)/profile', params: { activeTab: 'orders' } });
      return;
    }
    if (notification.type === 'tax') {
      router.push({ pathname: '/(tabs)/profile', params: { activeTab: 'listings' } });
      return;
    }
  };

  const getPrimaryActionLabel = () => {
    if (!notification) return '';
    if (
      notification.type === 'auction_outbid' ||
      notification.type === 'auction_won' ||
      notification.type === 'auction_bid'
    )
      return 'View auction';
    if (notification.type === 'order_placed' || notification.type === 'order_seller') return 'View my orders';
    if (notification.type === 'tax') return 'View tax details';
    return 'Close';
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#16A34A" />
        </View>
      );
    }
    if (!notification) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Notification not found.</Text>
        </View>
      );
    }

    const createdAtText = formatTimeAgo(notification.createdAt);
    const hasProductImage = !!notification.productImage;
    const imageSource = hasProductImage
      ? { uri: notification.productImage as string }
      : require('@/assets/images/products/product-1.png');

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text style={styles.time}>{createdAtText}</Text>
          </View>
          <View style={styles.productRow}>
            <ImageWithLoader
              source={imageSource}
              style={styles.productImage}
              loaderSize="small"
              debugLabel={`Notification Detail: ${notification.productTitle || notification.title}`}
            />
            <View style={styles.productInfo}>
              {notification.productTitle ? (
                <Text style={styles.productTitle}>{notification.productTitle}</Text>
              ) : null}
              {notification.amount != null ? (
                <Text style={styles.amountText}>Rs {notification.amount.toLocaleString('en-IN')}</Text>
              ) : null}
            </View>
          </View>
          <Text style={styles.message}>{notification.message}</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={handlePrimaryAction}>
          <Text style={styles.primaryButtonText}>{getPrimaryActionLabel()}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/notifications' as any)}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={styles.headerSpacer} />
      </View>
      {renderContent()}
    </View>
  );
};

export default NotificationDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  message: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
