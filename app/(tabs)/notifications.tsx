import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';
import { getCurrentUser } from '../../lib/auth';
import { AppNotification, markAllNotificationsAsRead, subscribeUserNotifications } from '../../lib/firestore';
import { ImageWithLoader } from '../components/ImageWithLoader';

type NotificationType = 'all' | 'unread' | 'important';

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<NotificationType>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.uid);
    const unsub = subscribeUserNotifications(user.uid, (items) => {
      setNotifications(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await markAllNotificationsAsRead(userId);
    } catch {
      setNotifications((prev) => [...prev]);
    }
  };

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

  const filteredNotifications = useMemo(() => {
    let items = notifications;
    if (activeFilter === 'unread') {
      items = items.filter((n) => !n.isRead);
    } else if (activeFilter === 'important') {
      items = items.filter((n) => n.type === 'tax');
    }
    return items;
  }, [notifications, activeFilter]);

  const getCardStyles = (notification: AppNotification): StyleProp<ViewStyle> => {
    const stylesList: StyleProp<ViewStyle>[] = [styles.notificationCard];
    if (!notification.isRead) {
      stylesList.push(styles.notificationUnread);
    }
    if (notification.type === 'tax') {
      stylesList.push(styles.notificationImportant);
    }
    if (notification.type === 'auction_won') {
      stylesList.push(styles.notificationSuccess);
    }
    return stylesList;
  };

  const buildTitle = (notification: AppNotification) => {
    if (notification.title) return notification.title;
    if (notification.type === 'auction_outbid') return "You've been outbid";
    if (notification.type === 'auction_won') return 'Congratulations! You won the auction';
    if (notification.type === 'auction_bid') return 'New bid on your listing';
    if (notification.type === 'order_placed') return 'Order placed';
    if (notification.type === 'order_seller') return 'Your product was purchased';
    if (notification.type === 'tax') return 'Important tax notification';
    return 'Notification';
  };

  const buildPriceText = (notification: AppNotification) => {
    if (notification.amount == null) return '';
    return `Rs ${notification.amount.toLocaleString('en-IN')}`;
  };

  const handleRefresh = () => {
    if (!userId) return;
    setRefreshing(true);
    let unsubscribe: (() => void) | null = null;
    unsubscribe = subscribeUserNotifications(userId, (items) => {
      setNotifications(items);
      setRefreshing(false);
      if (unsubscribe) unsubscribe();
    });
  };

  const handleOpenNotification = (notification: AppNotification) => {
    if (!notification.id) return;
    router.push({
      pathname: '/(tabs)/notification/[id]',
      params: { id: notification.id },
    });
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeFilter === 'all' && styles.filterTabActive
              ]}
              onPress={() => setActiveFilter('all')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'all' && styles.filterTextActive
              ]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeFilter === 'unread' && styles.filterTabActive
              ]}
              onPress={() => setActiveFilter('unread')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'unread' && styles.filterTextActive
              ]}>Unread</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeFilter === 'important' && styles.filterTabActive
              ]}
              onPress={() => setActiveFilter('important')}
            >
              <Text style={[
                styles.filterText,
                activeFilter === 'important' && styles.filterTextActive
              ]}>Important</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#16A34A"
              colors={['#16A34A']}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#16A34A" />
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptyText}>You have no notifications in this category yet.</Text>
            </View>
          ) : (
            filteredNotifications.map((notification) => {
              const title = buildTitle(notification);
              const priceText = buildPriceText(notification);
              const timeText = formatTimeAgo(notification.createdAt);
              const hasProductImage = !!notification.productImage;
              const imageSource = hasProductImage
                ? { uri: notification.productImage as string }
                : require('@/assets/images/products/product-1.png');

              return (
                <TouchableOpacity
                  key={notification.id}
                  style={getCardStyles(notification)}
                  activeOpacity={0.9}
                  onPress={() => handleOpenNotification(notification)}
                >
                  <View style={styles.notificationContent}>
                    <View style={styles.productImageContainer}>
                      <ImageWithLoader
                        source={imageSource}
                        style={styles.productImage}
                        loaderSize="small"
                        debugLabel={`Notification: ${title}`}
                      />
                    </View>
                    <View style={styles.notificationDetails}>
                      <View style={styles.notificationHeader}>
                        <Text
                          style={
                            notification.type === 'auction_won'
                              ? styles.notificationTitleSuccess
                              : styles.notificationTitle
                          }
                        >
                          {title}
                        </Text>
                        <Text style={styles.timeText}>{timeText}</Text>
                      </View>
                      <Text style={styles.notificationText} numberOfLines={2}>
                        {notification.message}
                      </Text>
                      {priceText ? <Text style={styles.priceText}>{priceText}</Text> : null}
                    </View>
                    <View style={styles.actionButtons}>
                      <View style={styles.arrowButton}>
                        <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                          <Path
                            d="M8.42822 15.1997L13.4282 10.1997L8.42822 5.19971"
                            stroke="#D1D5DB"
                            strokeWidth={1.66667}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
  },
  markAllButton: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  filterTabs: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#F3FCF7',
    borderRadius: 14,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  filterTabActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#020817',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  notificationCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  notificationSuccess: {
    backgroundColor: '#F2FCE2',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  notificationUnread: {
    backgroundColor: '#ECFDF3',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  notificationImportant: {
    backgroundColor: '#FEF2F2',
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  notificationContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 9999,
  },
  notificationDetails: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020817',
  },
  notificationTitleSuccess: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  notificationText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#22C55E',
  },
  actionButtons: {
    alignItems: 'flex-end',
    gap: 16,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  arrowButton: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
