import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Path, Svg } from 'react-native-svg';

type NotificationType = 'all' | 'unread' | 'important';

export default function NotificationsScreen() {
  const [activeFilter, setActiveFilter] = useState<NotificationType>('all');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity style={styles.markAllButton}>
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
        <ScrollView style={styles.content}>
          {/* Won Auction Notification */}
          <View style={[styles.notificationCard, styles.notificationSuccess]}>
            <View style={styles.notificationContent}>
              <View style={styles.productImageContainer}>
                <Image 
                  source={require('@/assets/images/products/iphone.png')}
                  style={styles.productImage}
                />
                <View style={styles.iconContainer}>
                  <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                    <Path
                      d="M5.56966 8.09977H4.31966C3.76713 8.09977 3.23722 7.88028 2.84652 7.48958C2.45582 7.09888 2.23633 6.56897 2.23633 6.01644C2.23633 5.4639 2.45582 4.934 2.84652 4.5433C3.23722 4.1526 3.76713 3.93311 4.31966 3.93311H5.56966"
                      stroke="#22C55E"
                      strokeWidth={1.66667}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M15.5696 8.09977H16.8196C17.3721 8.09977 17.902 7.88028 18.2927 7.48958C18.6834 7.09888 18.9029 6.56897 18.9029 6.01644C18.9029 5.4639 18.6834 4.934 18.2927 4.5433C17.902 4.1526 17.3721 3.93311 16.8196 3.93311H15.5696"
                      stroke="#22C55E"
                      strokeWidth={1.66667}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
              <View style={styles.notificationDetails}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitleSuccess}>
                    Congratulations! You{'\n'}won the auction
                  </Text>
                  <Text style={styles.timeText}>2 hours ago</Text>
                </View>
                <Text style={styles.notificationText}>
                  You have won the auction for{'\n'}
                  Apple iPhone 13 Pro Max with
                </Text>
                <Text style={styles.priceText}>Rs 24,500</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.closeButton}>
                  <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                    <Path
                      d="M12.4282 4.19922L4.42822 12.1992"
                      stroke="#9CA3AF"
                      strokeWidth={1.33333}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.42822 4.19922L12.4282 12.1992"
                      stroke="#9CA3AF"
                      strokeWidth={1.33333}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowButton}>
                  <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                    <Path
                      d="M8.42822 15.1992L13.4282 10.1992L8.42822 5.19922"
                      stroke="#D1D5DB"
                      strokeWidth={1.66667}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Outbid Notification */}
          <View style={styles.notificationCard}>
            <View style={styles.notificationContent}>
              <View style={styles.productImageContainer}>
                <Image 
                  source={require('@/assets/images/products/ps5.png')}
                  style={styles.productImage}
                />
                <View style={styles.iconContainer}>
                  <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                    <Path
                      d="M10.5697 18.5329C15.172 18.5329 18.903 14.8019 18.903 10.1995C18.903 5.59717 15.172 1.86621 10.5697 1.86621C5.96729 1.86621 2.23633 5.59717 2.23633 10.1995C2.23633 14.8019 5.96729 18.5329 10.5697 18.5329Z"
                      stroke="#F59E0B"
                      strokeWidth={1.66667}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
              <View style={styles.notificationDetails}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>You've been outbid</Text>
                  <Text style={styles.timeText}>5 hours ago</Text>
                </View>
                <Text style={styles.notificationText}>
                  Someone placed a higher bid on{'\n'}
                  Sony PlayStation 5 Digital Edition.
                </Text>
                <Text style={styles.priceText}>Rs 18,000</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.closeButton}>
                  <Svg width={17} height={17} viewBox="0 0 17 17" fill="none">
                    <Path
                      d="M12.4282 4.19971L4.42822 12.1997"
                      stroke="#9CA3AF"
                      strokeWidth={1.33333}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M4.42822 4.19971L12.4282 12.1997"
                      stroke="#9CA3AF"
                      strokeWidth={1.33333}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowButton}>
                  <Svg width={21} height={21} viewBox="0 0 21 21" fill="none">
                    <Path
                      d="M8.42822 15.1997L13.4282 10.1997L8.42822 5.19971"
                      stroke="#D1D5DB"
                      strokeWidth={1.66667}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* More notifications... */}
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
}); 