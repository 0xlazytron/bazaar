import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // For better handling of notches/status bars
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from '../../components/ThemedText';

// Dummy data for auctions - replace with actual data source
const auctions = [
  {
    id: '1',
    title: 'Apple iPhone 13 Pro Max - 256GB - Pacific Blue',
    currentBid: 'Rs 24,500',
    buyNowPrice: 'Rs 32,000',
    timeLeft: '2d 14h',
    bids: 18,
    image: require('../../assets/images/products/iphone.png'), // Ensure this path is correct
    isNew: true,
    condition: 'Used'
  },
  // Add more auction items here...
];

const HERO_MESSAGES = [
  { text: "Sell Household Items", emoji: "🏠" },
  { text: "Find Electronics Deals", emoji: "📱" },
  { text: "Discover Fashion", emoji: "👕" },
  { text: "Buy Sports Gear", emoji: "⚽" },
  { text: "Trade Collectibles", emoji: "🎨" },
];

export default function Home() {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();

      setCurrentMessageIndex((prev) => (prev + 1) % HERO_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            style={styles.heroGradient}
          />
          <SafeAreaView style={styles.heroContent} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
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
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Image 
                    source={require('../../assets/images/icons/notification.png')}
                    style={styles.headerIcon}
                  />
                  <View style={styles.notificationBadge} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                  <Image 
                    source={require('../../assets/images/icons/cart.png')}
                    style={styles.headerIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero Title */}
            <View style={styles.heroTextContainer}>
              <ThemedText style={styles.heroTitle}>
                Discover and Bid on{'\n'}
                <Animated.View style={{ opacity: fadeAnim }}>
                  <ThemedText style={styles.heroHighlight}>
                    {HERO_MESSAGES[currentMessageIndex].emoji} {HERO_MESSAGES[currentMessageIndex].text}
                  </ThemedText>
                </Animated.View>
                {'\n'}in Mauritius
              </ThemedText>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Image 
                  source={require('../../assets/images/icons/search.png')}
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="What are you looking for?"
                  placeholderTextColor="rgba(255, 255, 255, 0.7)"
                  style={styles.searchInput}
                />
              </View>
              <TouchableOpacity style={styles.searchButton}>
                <ThemedText style={styles.searchButtonText}>Search</ThemedText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Featured Auctions</ThemedText>
            <TouchableOpacity style={styles.viewAllButton}>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
              <Svg width={17} height={16} fill="none">
                <Path
                  d="M6.358 11.902L10.26 8 6.358 4.098"
                  stroke="#16A34A"
                  strokeWidth={1.3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.filterTabsContainer}
            contentContainerStyle={styles.filterTabsContent}
          >
            <TouchableOpacity style={[styles.filterTab, styles.activeFilterTab]}>
              <ThemedText style={[styles.filterTabText, styles.activeFilterTabText]}>Featured</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <ThemedText style={styles.filterTabText}>Ending Soon</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <ThemedText style={styles.filterTabText}>Newly Listed</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterTab}>
              <ThemedText style={styles.filterTabText}>Popular</ThemedText>
            </TouchableOpacity>
          </ScrollView>

          {/* Auction Cards */}
          {auctions.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.auctionCard}
              onPress={() => router.push({
                pathname: '/product/[id]',
                params: { id: item.id }
              })}
            >
              <View style={styles.cardImageContainer}>
                {item.isNew && (
                  <View style={styles.newListingBadge}>
                    <ThemedText style={styles.newListingText}>New Listing</ThemedText>
                  </View>
                )}
                <Image
                  source={item.image}
                  style={styles.productImage}
                />
                <TouchableOpacity 
                  style={styles.favoriteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Handle favorite
                  }}
                >
                  <Svg width={17} height={17} fill="none">
                    <Path
                      d="M13.052 10.133c.993-.973 2-2.14 2-3.666 0-.973-.386-1.905-1.074-2.593a3.666 3.666 0 00-2.593-1.074c-1.173 0-2 .334-3 1.334-1-1-1.827-1.334-3-1.334a3.666 3.666 0 00-2.593 1.074 3.666 3.666 0 00-1.074 2.593c0 1.533 1 2.7 2 3.666L8.385 14.8l4.667-4.667z"
                      stroke="#6B7280"
                      strokeWidth={1.333}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              </View>
              <View style={styles.productInfo}>
                <ThemedText style={styles.productTitle} numberOfLines={2}>
                  {item.title}
                </ThemedText>
                <View style={styles.priceAndCondition}>
                  <View>
                    <ThemedText style={styles.priceLabel}>Current bid</ThemedText>
                    <ThemedText style={styles.currentPrice}>{item.currentBid}</ThemedText>
                  </View>
                  <View style={styles.conditionBadge}>
                    <ThemedText style={styles.conditionText}>{item.condition}</ThemedText>
                  </View>
                </View>
                <View style={styles.buyNowSection}>
                  <ThemedText style={styles.priceLabel}>Buy now</ThemedText>
                  <ThemedText style={styles.buyNowPrice}>{item.buyNowPrice}</ThemedText>
                </View>
                <View style={styles.cardFooter}>
                  <View style={styles.timeContainer}>
                    <Svg width={15} height={15} fill="none" style={styles.clockIcon}>
                      <Path
                        d="M7.985 13.633a5.833 5.833 0 100-11.666 5.833 5.833 0 000 11.666z"
                        stroke="#4B5563"
                        strokeWidth={1.167}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M7.985 4.3v3.5l2.333 1.167"
                        stroke="#4B5563"
                        strokeWidth={1.167}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <ThemedText style={styles.timeText}>{item.timeLeft}</ThemedText>
                  </View>
                  <View style={styles.bidsContainer}>
                    <Svg width={15} height={15} fill="none" style={styles.bidsIcon}>
                      <Path
                        d="M7.727 2.309a1.167 1.167 0 00-.825-.342H2.718c-.31 0-.606.123-.825.342-.219.218-.341.515-.341.824v4.184c0 .31.123.606.342.825l5.077 5.077a1.167 1.167 0 001.995-.825l3.838-3.838a1.167 1.167 0 000-1.65L7.727 2.31z"
                        stroke="#4B5563"
                        strokeWidth={1.167}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d="M4.76 5.467a.292.292 0 100-.584.292.292 0 000 .584z"
                        fill="#4B5563"
                        stroke="#4B5563"
                        strokeWidth={1.167}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                    <ThemedText style={styles.bidsText}>{item.bids} bids</ThemedText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  heroContainer: {
    position: 'relative',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#16A34A',
    paddingBottom: 40,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroContent: {
    paddingBottom: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  welcomeText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIcon: {
    width: 20,
    height: 20,
    tintColor: '#374151',
  },
  notificationBadge: {
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  heroTextContainer: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 48,
  },
  heroHighlight: {
    color: '#E2FFE2',
    fontSize: 32,
    lineHeight: 48,
  },
  searchContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  searchInputContainer: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchButton: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#16A34A',
  },
  featuredSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  filterTabsContainer: {
    marginBottom: 18,
  },
  filterTabsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  activeFilterTab: {
    backgroundColor: '#16A34A',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  auctionCard: {
    marginHorizontal: 20,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardImageContainer: {
    height: 192,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newListingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#16A34A',
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 24,
    zIndex: 1,
  },
  newListingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  productInfo: {
    padding: 16,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#020817',
    marginBottom: 12,
  },
  priceAndCondition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16A34A',
  },
  conditionBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 11,
    paddingVertical: 3,
    borderRadius: 24,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  buyNowSection: {
    marginBottom: 12,
  },
  buyNowPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#020817',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bidsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockIcon: {
    marginRight: 4,
  },
  bidsIcon: {
    marginRight: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#4B5563',
  },
  bidsText: {
    fontSize: 14,
    color: '#4B5563',
  },
});
