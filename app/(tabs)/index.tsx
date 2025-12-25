import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, RefreshControl, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // For better handling of notches/status bars
import Svg, { Path } from 'react-native-svg';
import { ThemedText } from '../../components/ThemedText';
import { getCurrentUser } from '../../lib/auth';
import {
  addToFavorites,
  delistExpiredAuctions,
  getEndingSoonProducts,
  getFeaturedProducts,
  getNewlyListedProducts,
  getPopularProducts,
  getProducts,
  getUserFavorites,
  Product,
  removeFromFavorites,
  updateProduct
} from '../../lib/firestore';
import { ImageWithLoader } from '../components/ImageWithLoader';
import { useToast } from '../components/ToastContext';
import { TopHeader } from '../components/TopHeader';

const HERO_MESSAGES = [
  { text: "Sell Used Items", emoji: "🏠" },
  { text: "Electronics Deals", emoji: "📱" },
  { text: "Discover Fashion", emoji: "👕" },
  { text: "Buy Sports Gear", emoji: "⚽" },
  { text: "Trade Collectibles", emoji: "🎨" },
];

type TabType = 'All' | 'Featured' | 'Ending Soon' | 'Newly Listed' | 'Popular';



export default function Home() {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('Featured');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { showToast } = useToast();

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
  }, [fadeAnim]);

  // Get current user and load favorites
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (user) {
      loadUserFavorites(user.uid);
    }
  }, []);

  useEffect(() => {
    delistExpiredAuctions().catch(() => { });
  }, []);

  // Refresh favorites when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        loadUserFavorites(currentUser.uid);
      }
    }, [currentUser])
  );

  const loadUserFavorites = async (userId: string) => {
    try {
      const favoriteIds = await getUserFavorites(userId);
      setFavorites(new Set(favoriteIds));
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!currentUser) {
      showToast('Please log in to add favorites', 'error');
      return;
    }

    try {
      const isFavorited = favorites.has(productId);

      if (isFavorited) {
        await removeFromFavorites(currentUser.uid, productId);
        setFavorites(prev => {
          const newFavorites = new Set(prev);
          newFavorites.delete(productId);
          return newFavorites;
        });
        showToast('Product removed from favorites', 'success');
      } else {
        await addToFavorites(currentUser.uid, productId);
        setFavorites(prev => new Set(prev).add(productId));
        showToast('Product added to favorites', 'success');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('Failed to update favorites', 'error');
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let fetchedProducts: Product[] = [];
      if (searchQuery.trim()) {
        const { products } = await getProducts({ status: 'active', limitCount: 30 });
        fetchedProducts = products;
      } else {
        switch (activeTab) {
          case 'All': {
            const { products } = await getProducts({ status: 'active', limitCount: 30 });
            fetchedProducts = products;
            break;
          }
          case 'Featured':
            fetchedProducts = await getFeaturedProducts(10);
            break;
          case 'Ending Soon':
            fetchedProducts = await getEndingSoonProducts(10);
            break;
          case 'Newly Listed':
            fetchedProducts = await getNewlyListedProducts(10);
            break;
          case 'Popular':
            fetchedProducts = await getPopularProducts(10);
            break;
        }
      }

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        fetchedProducts = fetchedProducts.filter((p) => {
          const title = (p.title || '').toLowerCase();
          const desc = (p.description || '').toLowerCase();
          return title.includes(q) || desc.includes(q);
        });
      }
      setProducts(fetchedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProducts();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts]);

  const formatPrice = (price: string | number): string => {
    if (typeof price === 'number') {
      return `Rs ${price.toLocaleString()}`;
    }
    return price.toString();
  };

  // Real-time countdown component
  const TimeDisplay = ({ product }: { product: Product }) => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
      const updateTime = () => {
        // Check if it's a fixed price product
        if (product.pricingType === 'Fixed Price (Buy Now)') {
          setTimeLeft('Buy Now');
          return;
        }

        // Check if it's an auction or both type
        const isAuctionType = product.pricingType?.includes('Auction') || product.pricingType === 'both' || product.isAuction;

        if (!isAuctionType || !product.auctionEndTime) {
          setTimeLeft('No time limit');
          return;
        }

        const now = new Date();
        const end = (product.auctionEndTime as any)?.toDate
          ? (product.auctionEndTime as any).toDate()
          : product.auctionEndTime instanceof Date
            ? product.auctionEndTime
            : new Date(product.auctionEndTime as any);
        if (!(end instanceof Date) || isNaN(end.getTime())) {
          setTimeLeft('No time limit');
          return;
        }
        const diff = end.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('Ended');
          try {
            if (product.status === 'active') {
              updateProduct(product.id!, { status: 'inactive' }).catch(() => { });
            }
          } catch { }
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      };

      updateTime(); // Initial update
      const interval = setInterval(updateTime, 1000); // Update every second

      return () => clearInterval(interval);
    }, [product.auctionEndTime, product.pricingType, product.id, product.status, product.isAuction]);

    return (
      <ThemedText style={styles.timeText}>
        {timeLeft}
      </ThemedText>
    );
  };



  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.headerOverlay}>
        <TopHeader transparent={true} />
      </View>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#16A34A"
            colors={['#16A34A']}
          />
        }
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#16A34A', '#15803D']}
            style={styles.heroGradient}
          />
          <SafeAreaView style={styles.heroContent} edges={['top']}>
            {/* Hero Title */}
            <View style={styles.heroTextContainer}>
              <ThemedText style={styles.heroTitle}>
                Discover and Bid on{"\n"}
                <Animated.View style={{ opacity: fadeAnim }}>
                  <ThemedText style={styles.heroHighlight}>
                    {HERO_MESSAGES[currentMessageIndex].emoji} {HERO_MESSAGES[currentMessageIndex].text}
                  </ThemedText>
                </Animated.View>
                {"\n"}in Mauritius
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
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={fetchProducts}
                />
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={fetchProducts}>
                <ThemedText style={styles.searchButtonText}>Search</ThemedText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Featured Section */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Featured Auctions</ThemedText>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefresh}
                disabled={loading || refreshing}
              >
                {loading || refreshing ? (
                  <ActivityIndicator size="small" color="#16A34A" />
                ) : (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M21 4a1 1 0 0 0-1 1v1.004A10.02 10.02 0 0 0 12 2a9.946 9.946 0 0 0-9.753 7.778 1 1 0 0 0 1.951.444A7.955 7.955 0 0 1 12 4c2.885 0 5.502 1.565 6.914 4H17a1 1 0 1 0 0 2h4a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zM3 20a1 1 0 0 0 1-1v-1.025A9.924 9.924 0 0 0 12 22a9.946 9.946 0 0 0 9.753-7.778 1 1 0 0 0-1.951-.444A7.955 7.955 0 0 1 12 20c-2.886 0-5.478-1.528-6.908-4H7a1 1 0 1 0 0-2H3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1z"
                      fill="#16A34A"
                    />
                  </Svg>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewAllButton} onPress={() => router.push({ pathname: '/(tabs)/all-products', params: { filter: activeTab } })}>
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
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabsContainer}
            contentContainerStyle={styles.filterTabsContent}
          >
            {[
              { label: 'All' as TabType, icon: require('../../assets/images/icons/explore.png') },
              { label: 'Featured' as TabType, icon: require('../../assets/images/icons/star.png') },
              { label: 'Ending Soon' as TabType, icon: require('../../assets/images/icons/clock.png') },
              { label: 'Newly Listed' as TabType, icon: require('../../assets/images/icons/tag.png') },
              { label: 'Popular' as TabType, icon: require('../../assets/images/icons/star-filled.png') },
            ].map((t) => (
              <TouchableOpacity
                key={t.label}
                style={[styles.filterTab, activeTab === t.label && styles.activeFilterTab]}
                onPress={() => handleTabPress(t.label)}
              >
                <Image source={t.icon} style={[styles.filterIcon, activeTab === t.label && styles.activeFilterIcon]} />
                <ThemedText style={[styles.filterTabText, activeTab === t.label && styles.activeFilterTabText]}>{t.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product Cards */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <ThemedText style={styles.loadingText}>Loading products...</ThemedText>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No products found</ThemedText>
            </View>
          ) : (
            products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.auctionCard}
                onPress={() => router.push(`/(tabs)/product/${product.id}`)}
              >
                <View style={styles.cardImageContainer}>
                  {activeTab === 'Newly Listed' && (
                    <View style={styles.newListingBadge}>
                      <ThemedText style={styles.newListingText}>New Listing</ThemedText>
                    </View>
                  )}
                  {product.images && product.images.length > 0 && product.images[0] ? (
                    <ImageWithLoader
                      source={{ uri: product.images[0] }}
                      style={styles.productImage}
                    />
                  ) : (
                    <View style={[styles.productImage, styles.placeholderImage]}>
                      <ThemedText style={styles.placeholderText}>No Image</ThemedText>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(product.id!);
                    }}
                  >
                    <Svg width={17} height={17} fill="none">
                      <Path
                        d="M13.052 10.133c.993-.973 2-2.14 2-3.666 0-.973-.386-1.905-1.074-2.593a3.666 3.666 0 00-2.593-1.074c-1.173 0-2 .334-3 1.334-1-1-1.827-1.334-3-1.334a3.666 3.666 0 00-2.593 1.074 3.666 3.666 0 00-1.074 2.593c0 1.533 1 2.7 2 3.666L8.385 14.8l4.667-4.667z"
                        stroke={favorites.has(product.id!) ? "#EF4444" : "#6B7280"}
                        fill={favorites.has(product.id!) ? "#EF4444" : "none"}
                        strokeWidth={1.333}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                  <ThemedText style={styles.productTitle} numberOfLines={2}>
                    {product.title || 'Untitled Product'}
                  </ThemedText>
                  <View style={styles.priceAndCondition}>
                    <View>
                      <ThemedText style={styles.priceLabel}>
                        {product.isAuction ? 'Current bid' : 'Price'}
                      </ThemedText>
                      <ThemedText style={styles.currentPrice}>
                        {formatPrice(product.currentBid || product.price)}
                      </ThemedText>
                    </View>
                    {product.condition && (
                      <View style={styles.conditionBadge}>
                        <ThemedText style={styles.conditionText}>{product.condition}</ThemedText>
                      </View>
                    )}
                  </View>
                  {(product.pricingType === 'Fixed Price (Buy Now)' || product.pricingType?.includes('Both') || product.pricingType === 'both') && (
                    <View style={styles.buyNowSection}>
                      <ThemedText style={styles.priceLabel}>Buy now</ThemedText>
                      <ThemedText style={styles.buyNowPrice}>
                        {formatPrice(product.price)}
                      </ThemedText>
                    </View>
                  )}
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
                      <TimeDisplay product={product} />
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
                      <ThemedText style={styles.bidsText}>
                        {product.bidCount || 0} bids
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scrollContainer: {
    flex: 1,
    // marginTop: 116,
  },
  heroContainer: {
    position: 'relative',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#16A34A',
    paddingBottom: 40,
    paddingTop: 66,
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
    // marginTop: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 12,
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
    // gap: 12,
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
    // marginTop: 12,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterTab: {
    backgroundColor: '#16A34A',
  },
  filterIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: '#4B5563',
  },
  activeFilterIcon: {
    tintColor: '#FFFFFF',
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
