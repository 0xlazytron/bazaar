import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BidHistoryItem } from '../components/BidHistoryItem';
import { ListingCard } from '../components/ListingCard';
import { ReviewItem } from '../components/ReviewItem';
import { ThemedText } from '../components/ThemedText';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const reviews = [
    {
      name: "Courtney Henry",
      avatar: require('@/assets/images/avatar/user1.png'),
      time: "2 mins ago",
      sentiment: "positive" as const,
      comment: "Consequat velit qui adipisicing sunt do rependerit ad laborum tempor ullamco exercitation. Ullamco tempor adipisicing et voluptate duis sit esse aliqua"
    },
    {
      name: "Cameron Williamson",
      avatar: require('@/assets/images/avatar/user2.png'),
      time: "2 mins ago",
      sentiment: "neutral" as const,
      comment: "Consequat velit qui adipisicing sunt do rependerit ad laborum tempor ullamco."
    },
    {
      name: "Jane Cooper",
      avatar: require('@/assets/images/avatar/user3.png'),
      time: "2 mins ago",
      sentiment: "negative" as const,
      comment: "Ullamco tempor adipisicing et voluptate duis sit esse aliqua esse ex."
    }
  ];

  const [activeTab, setActiveTab] = useState('listings');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'listings':
        return (
          <View style={styles.tabContent}>
            <View style={styles.listingHeader}>
              <ThemedText style={styles.sectionTitle}>Active Listings</ThemedText>
              <TouchableOpacity style={styles.newListingButton}>
                <ThemedText style={styles.newListingButtonText}>+ New Listing</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.listingsContainer}>
              <ListingCard 
                title="Apple iPhone 13 Pro Max - 256GB - Pacific Blue"
                currentBid={24500}
                buyNowPrice={32000}
                timeLeft="2d 14h"
                bidsCount={18}
                condition="Used"
                image={require('@/assets/images/products/iphone13.png')}
                isNewListing={true}
              />
              <ListingCard 
                title="Apple Watch Series 7 - 45mm - Midnight"
                currentBid={18500}
                buyNowPrice={25000}
                timeLeft="1d 8h"
                bidsCount={12}
                condition="Used"
                image={require('@/assets/images/products/apple-watch.png')}
              />
            </View>
            <View style={styles.soldItemsSection}>
              <ThemedText style={styles.sectionTitle}>Sold Items</ThemedText>
              <View style={styles.emptyStateContainer}>
                <ThemedText style={styles.emptyStateText}>You haven't sold any items yet.</ThemedText>
              </View>
            </View>
          </View>
        );
      case 'bids':
        return (
          <View style={styles.tabContent}>
            <View style={styles.bidHistoryHeader}>
              <Image 
                source={require('@/assets/images/icons/bid-history.png')}
                style={styles.bidHistoryIcon}
              />
              <ThemedText style={styles.sectionTitle}>Bid History</ThemedText>
            </View>
            <View style={styles.bidHistoryTable}>
              <View style={styles.tableHeader}>
                <View style={styles.itemHeaderColumn}>
                  <ThemedText style={styles.tableHeaderText}>Item</ThemedText>
                </View>
                <View style={styles.amountHeaderColumn}>
                  <ThemedText style={styles.tableHeaderText}>Amount</ThemedText>
                </View>
                <View style={styles.timeHeaderColumn}>
                  <ThemedText style={styles.tableHeaderText}>Time</ThemedText>
                </View>
              </View>
              <BidHistoryItem 
                itemName="Apple Watch"
                amount={24500}
                time="2 hours ago"
                isHighestBid={true}
                image={require('@/assets/images/products/apple-watch.png')}
              />
              <BidHistoryItem 
                itemName="iPhone 13 Pro"
                amount={22000}
                time="5 hours ago"
                image={require('@/assets/images/products/iphone13.png')}
              />
              <BidHistoryItem 
                itemName="MacBook Air"
                amount={45000}
                time="1 day ago"
                image={require('@/assets/images/products/macbook.png')}
              />
            </View>
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.tabContent}>
            <View style={styles.reviewsStats}>
              <View style={styles.reviewsLeft}>
                <View style={styles.reviewRow}>
                  <Image 
                    source={require('@/assets/images/icons/happy.png')}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '80%' }]} />
                  </View>
                  <ThemedText style={styles.reviewCount}>Positive(30)</ThemedText>
                </View>
                <View style={styles.reviewRow}>
                  <Image 
                    source={require('@/assets/images/icons/neutral.png')}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '40%' }]} />
                  </View>
                  <ThemedText style={styles.reviewCount}>Neutral(20)</ThemedText>
                </View>
                <View style={styles.reviewRow}>
                  <Image 
                    source={require('@/assets/images/icons/sad.png')}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '15%' }]} />
                  </View>
                  <ThemedText style={styles.reviewCount}>Negative(6)</ThemedText>
                </View>
              </View>
              <View style={styles.reviewsRight}>
                <ThemedText style={styles.ratingPercentage}>98%</ThemedText>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4].map((_, index) => (
                    <Image 
                      key={index}
                      source={require('@/assets/images/icons/star-filled.png')}
                      style={styles.starIconSmall}
                    />
                  ))}
                  <Image 
                    source={require('@/assets/images/icons/star-outline.png')}
                    style={styles.starIconSmall}
                  />
                </View>
                <ThemedText style={styles.totalReviews}>56 Reviews</ThemedText>
              </View>
            </View>
            <View style={styles.reviewsList}>
              <ThemedText style={styles.reviewsTitle}>All Reviews (56)</ThemedText>
              {reviews.map((review, index) => (
                <ReviewItem
                  key={index}
                  name={review.name}
                  avatar={review.avatar}
                  time={review.time}
                  sentiment={review.sentiment}
                  comment={review.comment}
                />
              ))}
            </View>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with gradient */}
      <LinearGradient
        colors={['#16a34a', '#18c658']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        <Image 
          source={require('@/assets/images/avatar/profile.png')}
          style={styles.profileImage}
        />
      </View>

      <View style={styles.mainContent}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <ThemedText style={styles.name}>Gushpoor 👑</ThemedText>
          <View style={styles.ratingContainer}>
            <Image 
              source={require('@/assets/images/icons/star.png')}
              style={styles.starIcon}
            />
            <ThemedText style={styles.ratingText}>4.8/5.0 (95% Positive)</ThemedText>
          </View>
          <ThemedText style={styles.memberSince}>Member since January 2022</ThemedText>
          <ThemedText style={styles.location}>Port Louis, Mauritius</ThemedText>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.editButton}>
              <Image 
                source={require('@/assets/images/icons/settings.png')}
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton}>
              <Image 
                source={require('@/assets/images/icons/logout.png')}
                style={[styles.buttonIcon, styles.logoutIcon]}
              />
              <ThemedText style={styles.logoutText}>Logout</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <View style={[styles.iconCircle, styles.greenCircle]}>
                <Image 
                  source={require('@/assets/images/icons/bag.png')}
                  style={styles.statsIcon}
                />
              </View>
              <ThemedText style={styles.statsNumber}>12</ThemedText>
              <ThemedText style={styles.statsLabel}>Items Sold</ThemedText>
            </View>
            <View style={styles.statsCard}>
              <View style={[styles.iconCircle, styles.blueCircle]}>
                <Image 
                  source={require('@/assets/images/icons/box.png')}
                  style={styles.statsIcon}
                />
              </View>
              <ThemedText style={styles.statsNumber}>8</ThemedText>
              <ThemedText style={styles.statsLabel}>Items Bought</ThemedText>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statsCard}>
              <View style={[styles.iconCircle, styles.amberCircle]}>
                <Image 
                  source={require('@/assets/images/icons/star-yellow.png')}
                  style={styles.statsIcon}
                />
              </View>
              <ThemedText style={styles.statsNumber}>56</ThemedText>
              <ThemedText style={styles.statsLabel}>Reviews</ThemedText>
            </View>
            <View style={styles.statsCard}>
              <View style={[styles.iconCircle, styles.purpleCircle]}>
                <Image 
                  source={require('@/assets/images/icons/favorite-indigo.png')}
                  style={styles.statsIcon}
                />
              </View>
              <ThemedText style={styles.statsNumber}>24</ThemedText>
              <ThemedText style={styles.statsLabel}>Favorites</ThemedText>
            </View>
          </View>
        </View>

        {/* Tabs Section */}
        <View style={styles.reviewsSection}>
          <View style={styles.reviewsHeader}>
            <View style={styles.reviewsTab}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'listings' && styles.activeTab]}
                onPress={() => setActiveTab('listings')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>
                  My Listing
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'bids' && styles.activeTab]}
                onPress={() => setActiveTab('bids')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'bids' && styles.activeTabText]}>
                  My Bids
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'reviews' && styles.activeTab]}
                onPress={() => setActiveTab('reviews')}
              >
                <ThemedText style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                  Reviews
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {renderTabContent()}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainContent: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: -98,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 1,
  },
  headerGradient: {
    height: 310,
    width: width,
    position: 'relative',
    zIndex: 1,
  },
  profileImageContainer: {
    position: 'absolute',
    top: 100, // 243 - 98
    left: (width - 196) / 2, // Center horizontally
    width: 196,
    height: 196,
    borderRadius: 98,
    padding: 4,
    backgroundColor: 'white',
    zIndex: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 94,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    paddingTop: 98,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberSince: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  location: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  logoutIcon: {
    tintColor: '#EF4444',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  statsGrid: {
    padding: 16,
    marginTop: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greenCircle: {
    backgroundColor: '#f2fce2',
  },
  blueCircle: {
    backgroundColor: '#dbeafe',
  },
  amberCircle: {
    backgroundColor: '#fef3c7',
  },
  purpleCircle: {
    backgroundColor: '#f3e8ff',
  },
  statsIcon: {
    width: 22,
    height: 22,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
    marginTop: 12,
  },
  statsLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  reviewsSection: {
    padding: 16,
  },
  reviewsHeader: {
    marginBottom: 24,
  },
  reviewsTab: {
    flexDirection: 'row',
    backgroundColor: '#f3fcf7',
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    borderRadius: 11,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#020817',
  },
  reviewsStats: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
  },
  reviewsLeft: {
    flex: 1,
    gap: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodIcon: {
    width: 24,
    height: 24,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 3,
  },
  reviewCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#333',
  },
  reviewsRight: {
    alignItems: 'flex-end',
  },
  ratingPercentage: {
    fontSize: 40,
    lineHeight: 42,
    marginLeft: 16,
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  starIconSmall: {
    width: 12,
    height: 12,
  },
  totalReviews: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  reviewsList: {
    marginTop: 24,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  tabContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#020817',
  },
  newListingButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    elevation: 2,
  },
  newListingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
  listingsContainer: {
    marginBottom: 24,
  },
  soldItemsSection: {
    gap: 16,
  },
  emptyStateContainer: {
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  bidHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  bidHistoryIcon: {
    width: 20,
    height: 20,
    tintColor: '#10B981',
  },
  bidHistoryTable: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 0.8,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 14,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  itemHeaderColumn: {
    flex: 1.4,
    paddingHorizontal: 16,
  },
  amountHeaderColumn: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timeHeaderColumn: {
    flex: 0.7,
    paddingHorizontal: 16,
  },
}); 