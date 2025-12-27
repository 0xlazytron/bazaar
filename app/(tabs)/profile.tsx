import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { getUserProfile, onAuthStateChange, signOutUser, UserProfile } from '../../lib/auth';
import { BidWithDetails, checkProductExists, countAllBids, countAllProducts, getProductOrders, getProducts, getSellerReviews, getUserBidsWithDetails, getUserFavorites, getUserOrders, Order, Product, Review, testFetchProduct, updateOrder, updateProduct } from '../../lib/firestore';
import { testStorageConnectivity } from '../../lib/storage';
import { BidHistoryItem } from '../components/BidHistoryItem';
import { ListingCard } from '../components/ListingCard';
import { OrderItem } from '../components/OrderItem';
import { ReviewItem } from '../components/ReviewItem';
import { ThemedText } from '../components/ThemedText';

const { width } = Dimensions.get('window');

type OrderFilter =
  | 'all'
  | 'bought'
  | 'sold'
  | 'delivered'
  | 'pending_delivery'
  | 'tax_unpaid'
  | 'tax_paid';

export default function ProfileScreen() {
  const { activeTab: paramActiveTab } = useLocalSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [userBids, setUserBids] = useState<BidWithDetails[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState(paramActiveTab as string || 'listings');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [ordersFilterOpen, setOrdersFilterOpen] = useState(false);
  const [openListingMenuId, setOpenListingMenuId] = useState<string | null>(null);
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(null);
  const [itemsSoldCount, setItemsSoldCount] = useState(0);
  const [itemsBoughtCount, setItemsBoughtCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Helper function to map listing data to display format
  const mapListingToDisplay = (product: Product) => {
    console.log('🔍 Product Debug:', {
      productId: product.id,
      originalImages: product.images,
      mappedImages: product.images?.map((url: string) => ({ uri: url })),
      hasImages: product.images && product.images.length > 0,
      firstImage: product.images?.[0]
    });

    // Temporary test: Use a known working image URL to test the component
    const testImageUrl = 'https://firebasestorage.googleapis.com/v0/b/bazaar-b558d.appspot.com/o/listings%2F1759182418933?alt=media&token=eb122e5e-4c0e-4394-8b3c-5379627cd6ab';

    return {
      ...product,
      title: product.title || `${product.category} Item`,
      description: product.description || product.data || 'No description available',
      condition: product.condition || (product.itemCondition === 'New' ? 'new' : 'good'),
      images: product.images && product.images.length > 0 ? product.images : [testImageUrl],
      price: typeof product.price === 'string' ? parseInt(product.price) : product.price,
      location: product.location || product.pickupLocation || 'Location not specified',
      currentBid: product.currentBid || (typeof product.price === 'string' ? parseInt(product.price) : product.price),
      bidCount: product.bidCount || 0,
      auctionEndTime: product.auctionEndTime,
      isAuction: product.pricingType?.includes('Auction') || false
    };
  };



  // Handle parameter changes (e.g., when navigating with activeTab)
  useEffect(() => {
    if (paramActiveTab) {
      setActiveTab(paramActiveTab as string);
    }
  }, [paramActiveTab]);

  // Auto-refresh listings when screen comes into focus (e.g., after creating a new listing)
  // Moved below function declarations to avoid "used before declaration"

  // Fetch user's profile data
  const fetchUserProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch user's products
  const fetchUserProducts = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const result = await getProducts({
        sellerId: userId
      });
      setProducts(result.products);
    } catch (error) {
      console.error('Error fetching user products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's bids
  const fetchUserBids = useCallback(async (userId: string) => {
    setBidsLoading(true);
    try {
      console.log('🔍 [PROFILE] Fetching bids for user:', userId);

      // First, let's check if there are any bids and products in the database at all
      await countAllProducts();
      await countAllBids();

      // Check if the problematic product exists
      await checkProductExists('4GphHwIWVry5RxnXp0md');

      // Test direct product fetch
      await testFetchProduct('4GphHwIWVry5RxnXp0md');

      const bids = await getUserBidsWithDetails(userId);
      console.log('🔍 [PROFILE] Fetched bids:', bids);
      console.log('🔍 [PROFILE] Number of bids:', bids.length);
      console.log('🔍 [PROFILE] Setting userBids state...');

      setUserBids(bids);
      console.log('🔍 [PROFILE] UserBids state set successfully');
    } catch (error) {
      console.error('❌ [PROFILE] Error fetching user bids:', error);
      console.error('❌ [PROFILE] Error details:', error instanceof Error ? error.message : String(error));
    } finally {
      setBidsLoading(false);
    }
  }, []);

  // Fetch user's orders
  const fetchUserOrders = useCallback(async (userId: string) => {
    setOrdersLoading(true);
    try {
      console.log('🔍 [PROFILE] Fetching orders for user:', userId);
      const buyerOrders = await getUserOrders(userId, 'buyer');
      const sellerOrders = await getUserOrders(userId, 'seller');
      const allOrders = [...buyerOrders, ...sellerOrders].sort((a, b) => {
        const aValue: any = a.createdAt;
        const bValue: any = b.createdAt;
        const aDate = aValue instanceof Date ? aValue : (aValue?.toDate ? aValue.toDate() : new Date(aValue));
        const bDate = bValue instanceof Date ? bValue : (bValue?.toDate ? bValue.toDate() : new Date(bValue));
        return bDate.getTime() - aDate.getTime();
      });
      console.log('🔍 [PROFILE] Fetched orders buyer:', buyerOrders.length, 'seller:', sellerOrders.length);
      setUserOrders(allOrders);
      setItemsBoughtCount(buyerOrders.length);
      setItemsSoldCount(sellerOrders.length);
    } catch (error) {
      console.error('❌ [PROFILE] Error fetching user orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchUserFavoritesCount = useCallback(async (userId: string) => {
    try {
      const favoriteIds = await getUserFavorites(userId);
      setFavoritesCount(favoriteIds.length);
    } catch (error) {
      console.error('Error fetching favorites count:', error);
    }
  }, []);

  const fetchSellerReviews = useCallback(async (sellerId: string) => {
    setReviewsLoading(true);
    try {
      const items = await getSellerReviews(sellerId);
      setSellerReviews(items);
    } catch (error) {
      console.error('Error fetching seller reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  // Handle refresh
  const onRefresh = async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      const result = await getProducts({
        sellerId: user.uid
      });
      setProducts(result.products);

      // Also refresh bids and orders
      await fetchUserBids(user.uid);
      await fetchUserOrders(user.uid);
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      if (user) {
        fetchUserProfile(user.uid);
        fetchUserProducts(user.uid);
        fetchUserBids(user.uid);
        fetchUserOrders(user.uid);
        fetchUserFavoritesCount(user.uid);
        fetchSellerReviews(user.uid);
      } else {
        setUserProfile(null);
        setProducts([]);
        setUserBids([]);
        setUserOrders([]);
        setLoading(false);
        setProfileLoading(false);
        setBidsLoading(false);
        setOrdersLoading(false);
        setItemsBoughtCount(0);
        setItemsSoldCount(0);
        setFavoritesCount(0);
        setSellerReviews([]);
      }
    });

    // Test Firebase Storage connectivity
    testStorageConnectivity().catch(error => {
      console.error('Storage connectivity test failed:', error);
    });

    return () => unsubscribe();
  }, [fetchUserProfile, fetchUserProducts, fetchUserBids, fetchUserOrders, fetchUserFavoritesCount, fetchSellerReviews]);

  // Auto-refresh listings when screen comes into focus (e.g., after creating a new listing)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserProfile(user.uid);
        fetchUserProducts(user.uid);
        fetchUserBids(user.uid);
        fetchUserOrders(user.uid);
        fetchUserFavoritesCount(user.uid);
        fetchSellerReviews(user.uid);
      }
    }, [user, fetchUserProfile, fetchUserProducts, fetchUserBids, fetchUserOrders, fetchUserFavoritesCount, fetchSellerReviews])
  );

  // Handle new listing button press
  const handleNewListing = () => {
    if (user) {
      router.push('/(tabs)/new-listing');
    } else {
      router.push('/auth/sign-in');
    }
  };

  const calculateTimeLeft = (endTime: any): string => {
    if (!endTime) return 'No time limit';

    const end = typeof endTime?.toDate === 'function'
      ? endTime.toDate()
      : endTime instanceof Date
        ? endTime
        : new Date(endTime);

    if (!(end instanceof Date) || isNaN(end.getTime())) return 'No time limit';

    const now = new Date();
    const timeDiff = end.getTime() - now.getTime();

    if (timeDiff <= 0) return 'Ended';

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  const isNewListing = (createdAt: any): boolean => {
    try {
      const now = new Date();
      let date: Date;

      // Handle Firebase Timestamp objects
      if (createdAt && typeof createdAt.toDate === 'function') {
        date = createdAt.toDate();
      } else if (createdAt instanceof Date) {
        date = createdAt;
      } else if (typeof createdAt === 'string') {
        date = new Date(createdAt);
      } else {
        // If createdAt is undefined or invalid, consider it not new
        return false;
      }

      const timeDiff = now.getTime() - date.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Consider listings new if created within 7 days
    } catch (error) {
      console.error('Error checking if listing is new:', error);
      return false;
    }
  };

  const getOrderFilterLabel = (value: OrderFilter = orderFilter) => {
    if (value === 'bought') return 'Bought';
    if (value === 'sold') return 'Sold';
    if (value === 'pending_delivery') return 'Pending delivery';
    if (value === 'tax_unpaid') return 'Tax unpaid';
    if (value === 'tax_paid') return 'Tax paid';
    if (value === 'delivered') return 'Delivered';
    return 'All';
  };

  const getOrderFilterIcon = (value: OrderFilter = orderFilter) => {
    if (value === 'bought') {
      return require('@/assets/images/icons/box.png');
    }
    if (value === 'sold') {
      return require('@/assets/images/icons/bag.png');
    }
    if (value === 'pending_delivery') {
      return require('@/assets/images/icons/delivery.png');
    }
    if (value === 'tax_unpaid' || value === 'tax_paid') {
      return require('@/assets/images/icons/star-yellow.png');
    }
    return require('@/assets/images/icons/favorite-indigo.png');
  };

  const getFilteredOrders = () => {
    return userOrders.filter((order) => {
      const isSellerOrder = user && order.sellerId === user.uid;
      const isBuyerOrder = user && order.buyerId === user.uid;

      if (orderFilter === 'delivered') {
        return order.status === 'delivered';
      }
      if (orderFilter === 'pending_delivery') {
        return (
          order.status === 'pending' ||
          order.status === 'confirmed' ||
          order.status === 'shipped'
        );
      }
      if (orderFilter === 'tax_unpaid') {
        return (
          isSellerOrder &&
          typeof order.productTax === 'number' &&
          order.productTax > 0 &&
          order.taxPaid === false
        );
      }
      if (orderFilter === 'tax_paid') {
        return (
          isSellerOrder &&
          typeof order.productTax === 'number' &&
          order.productTax > 0 &&
          !!order.taxPaid
        );
      }
      if (orderFilter === 'sold') {
        return isSellerOrder && order.status === 'delivered';
      }
      if (orderFilter === 'bought') {
        return isBuyerOrder;
      }
      return true;
    });
  };

  const totalReviews = sellerReviews.length;
  const positiveCount = sellerReviews.filter((r) => r.sentiment === 'positive').length;
  const neutralCount = sellerReviews.filter((r) => r.sentiment === 'neutral').length;
  const negativeCount = sellerReviews.filter((r) => r.sentiment === 'negative').length;
  const positivePercentage = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;

  const getReviewTime = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt instanceof Date ? createdAt : createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleDateString();
  };

  const renderTabContent = () => {
    const activeListings = products.filter((product) => product.status === 'active');
    const pendingDeliveryListings = products.filter((product) => product.status === 'pending_delivery');
    const soldListings = products.filter((product) => product.status === 'sold');

    switch (activeTab) {
      case 'listings':
        return (
          <View style={styles.tabContent}>
            <View style={styles.listingHeader}>
              <ThemedText style={styles.sectionTitle}>Active Listings</ThemedText>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={onRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <ActivityIndicator size="small" color="#16A34A" />
                  ) : (
                    <ThemedText style={styles.refreshButtonText}>↻</ThemedText>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.newListingButton} onPress={handleNewListing}>
                  <ThemedText style={styles.newListingButtonText}>+ New Listing</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.listingsContainer}>
              {loading ? (
                <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 20 }} />
              ) : activeListings.length > 0 ? (
                activeListings.map((product) => {
                  const mappedProduct = mapListingToDisplay(product);
                  console.log('🖼️ DEBUG: Product images data:', {
                    productId: product.id,
                    originalImages: product.images,
                    mappedImages: mappedProduct.images,
                    hasImages: mappedProduct.images && mappedProduct.images.length > 0,
                    firstImage: mappedProduct.images?.[0]
                  });
                  return (
                    <ListingCard
                      key={product.id}
                      id={product.id}
                      title={mappedProduct.title}
                      currentBid={mappedProduct.currentBid}
                      buyNowPrice={mappedProduct.price}
                      timeLeft={mappedProduct.auctionEndTime ? calculateTimeLeft(mappedProduct.auctionEndTime) : 'Buy Now'}
                      bidsCount={mappedProduct.bidCount}
                      condition={mappedProduct.condition === 'new' || mappedProduct.condition === 'like-new' ? 'New' : 'Used'}
                      image={mappedProduct.images && mappedProduct.images.length > 0 ? { uri: mappedProduct.images[0] } : require('@/assets/images/products/product-1.png')}
                      isNewListing={isNewListing(product.createdAt)}
                    />
                  );
                })
              ) : (
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyStateText}>No active listings yet</ThemedText>
                  <ThemedText style={styles.emptyStateSubtext}>Start selling by creating your first listing</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.pendingDeliverySection}>
              <ThemedText style={styles.sectionTitle}>Pending Delivery</ThemedText>
              {pendingDeliveryListings.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pendingScrollContent}
                >
                  {Array.from({ length: Math.ceil(pendingDeliveryListings.length / 2) }).map((_, index) => {
                    const start = index * 2;
                    const pair = pendingDeliveryListings.slice(start, start + 2);
                    return (
                      <View key={index} style={styles.pendingRow}>
                        {pair.map((product) => {
                          const mappedProduct = mapListingToDisplay(product);
                          return (
                            <View key={product.id} style={styles.pendingItemContainer}>
                              <ListingCard
                                id={product.id}
                                title={mappedProduct.title}
                                currentBid={mappedProduct.currentBid}
                                buyNowPrice={mappedProduct.price}
                                timeLeft={mappedProduct.auctionEndTime ? calculateTimeLeft(mappedProduct.auctionEndTime) : 'Buy Now'}
                                bidsCount={mappedProduct.bidCount}
                                condition={mappedProduct.condition === 'new' || mappedProduct.condition === 'like-new' ? 'New' : 'Used'}
                                image={mappedProduct.images && mappedProduct.images.length > 0 ? { uri: mappedProduct.images[0] } : require('@/assets/images/products/product-1.png')}
                                isNewListing={isNewListing(product.createdAt)}
                                onLongPress={() => setOpenListingMenuId(product.id!)}
                              />
                              {openListingMenuId === product.id && (
                                <View style={styles.optionsMenu}>
                                  <TouchableOpacity
                                    style={styles.optionsMenuItem}
                                    onPress={async () => {
                                      if (!product.id || updatingListingId) return;
                                      try {
                                        setUpdatingListingId(product.id);
                                        const orders = await getProductOrders(product.id);
                                        if (orders.length > 0 && orders[0].id) {
                                          const latestOrder = orders[0];
                                          const taxBase = typeof latestOrder.itemPrice === 'number'
                                            ? latestOrder.itemPrice
                                            : parseFloat(String(latestOrder.itemPrice || 0));
                                          const productTax = parseFloat((taxBase * 0.0515).toFixed(2));

                                          await updateOrder(latestOrder.id!, {
                                            status: 'delivered',
                                            completedAt: new Date(),
                                            productTax,
                                            taxPaid: false,
                                            taxProof: '',
                                          });
                                        }
                                        await updateProduct(product.id, { status: 'sold' });
                                        setProducts((prev) =>
                                          prev.map((p) =>
                                            p.id === product.id ? { ...p, status: 'sold' } : p
                                          )
                                        );
                                      } catch (error) {
                                        console.error('Error marking product as sold:', error);
                                        Alert.alert('Error', 'Could not mark item as sold. Please try again.');
                                      } finally {
                                        setUpdatingListingId(null);
                                        setOpenListingMenuId(null);
                                      }
                                    }}
                                  >
                                    <ThemedText style={styles.optionsMenuText}>
                                      {updatingListingId === product.id ? 'Updating…' : 'Mark as Sold'}
                                    </ThemedText>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.optionsMenuItem}
                                    onPress={() => setOpenListingMenuId(null)}
                                  >
                                    <ThemedText style={styles.optionsMenuText}>Cancel</ThemedText>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <ThemedText style={styles.emptyStateText}>No items pending delivery.</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.soldItemsSection}>
              <ThemedText style={styles.sectionTitle}>Sold Items</ThemedText>
              {soldListings.length > 0 ? (
                soldListings.map((product) => {
                  const mappedProduct = mapListingToDisplay(product);
                  return (
                    <ListingCard
                      key={product.id}
                      id={product.id}
                      title={mappedProduct.title}
                      currentBid={mappedProduct.currentBid}
                      buyNowPrice={mappedProduct.price}
                      timeLeft={mappedProduct.auctionEndTime ? calculateTimeLeft(mappedProduct.auctionEndTime) : 'Buy Now'}
                      bidsCount={mappedProduct.bidCount}
                      condition={mappedProduct.condition === 'new' || mappedProduct.condition === 'like-new' ? 'New' : 'Used'}
                      image={mappedProduct.images && mappedProduct.images.length > 0 ? { uri: mappedProduct.images[0] } : require('@/assets/images/products/product-1.png')}
                      isNewListing={isNewListing(product.createdAt)}
                    />
                  );
                })
              ) : (
                <View style={styles.emptyStateContainer}>
                  <ThemedText style={styles.emptyStateText}>You have not sold any items yet.</ThemedText>
                </View>
              )}
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
            {bidsLoading ? (
              <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 20 }} />
            ) : (() => {
              console.log('🔍 [RENDER] userBids state:', userBids);
              console.log('🔍 [RENDER] userBids length:', userBids.length);
              console.log('🔍 [RENDER] bidsLoading:', bidsLoading);
              return userBids.length > 0;
            })() ? (
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
                {userBids.map((bid) => (
                  <BidHistoryItem
                    key={bid.id}
                    itemName={bid.productTitle}
                    amount={bid.amount}
                    time={bid.timeAgo}
                    isHighestBid={bid.isHighestBid}
                    image={bid.productImage ? { uri: bid.productImage } : require('@/assets/images/products/product-1.png')}
                    onPress={() => router.push(`/(tabs)/product/${bid.productId}?highlightBid=${bid.id}`)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>No bids placed yet</ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>Start bidding on items you&apos;re interested in</ThemedText>
              </View>
            )}
          </View>
        );
      case 'orders':
        return (
          <View style={styles.tabContent}>
            <View style={styles.ordersHeader}>
              <View style={styles.ordersHeaderLeft}>
                <Image
                  source={require('@/assets/images/icons/box.png')}
                  style={styles.bidHistoryIcon}
                />
                <ThemedText style={styles.sectionTitle}>My Orders</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.ordersFilterButton}
                onPress={() => setOrdersFilterOpen((prev) => !prev)}
              >
                <View style={styles.ordersFilterContent}>
                  <Image
                    source={getOrderFilterIcon()}
                    style={styles.ordersFilterIcon}
                  />
                  <ThemedText style={styles.ordersFilterButtonText}>{getOrderFilterLabel()}</ThemedText>
                </View>
              </TouchableOpacity>
              {ordersFilterOpen && (
                <View style={styles.ordersFilterMenu}>
                  {(['all', 'bought', 'sold', 'delivered', 'pending_delivery', 'tax_unpaid', 'tax_paid'] as OrderFilter[]).map(
                    (value) => (
                      <TouchableOpacity
                        key={value}
                        style={styles.ordersFilterMenuItem}
                        onPress={() => {
                          setOrderFilter(value);
                          setOrdersFilterOpen(false);
                        }}
                      >
                        <Image
                          source={getOrderFilterIcon(value)}
                          style={styles.ordersFilterMenuIcon}
                        />
                        <ThemedText style={styles.ordersFilterMenuLabel}>
                          {getOrderFilterLabel(value)}
                        </ThemedText>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </View>
            {ordersLoading ? (
              <ActivityIndicator size="large" color="#16A34A" style={{ marginTop: 20 }} />
            ) : (() => {
              const filteredOrders = getFilteredOrders();
              return filteredOrders.length > 0 ? (
                <View style={styles.ordersContainer}>
                  {filteredOrders.map((order) => (
                    <OrderItem
                      key={order.id}
                      id={order.id || ''}
                      orderNumber={order.orderNumber}
                      productTitle={order.productTitle || 'Unknown Product'}
                      productImage={order.productImage}
                      amount={order.totalAmount}
                      status={order.status}
                      orderDate={order.createdAt instanceof Date
                        ? order.createdAt.toLocaleDateString()
                        : new Date((order.createdAt as any).seconds * 1000).toLocaleDateString()
                      }
                      deliveryAddress={order.deliveryAddress || order.pickupLocation || 'Address not specified'}
                      productTax={order.productTax}
                      taxPaid={order.taxPaid}
                      isSeller={order.sellerId === user?.uid}
                      onPress={() => {
                        if (!order.id) return;
                        if (order.sellerId === user?.uid) {
                          router.push({ pathname: '/(tabs)/order-tax/[id]', params: { id: order.id } });
                        } else if (order.buyerId === user?.uid && order.status === 'delivered') {
                          router.push({ pathname: '/(tabs)/review-seller/[id]', params: { id: order.id } });
                        }
                      }}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyStateText}>
                    {orderFilter === 'all' ? 'No orders yet' : 'No orders found for this filter'}
                  </ThemedText>
                  <ThemedText style={styles.emptyStateSubtext}>Start shopping to see your orders here</ThemedText>
                </View>
              );
            })()}
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
                    <View
                      style={[
                        styles.progressFill,
                        { width: totalReviews > 0 ? `${(positiveCount / totalReviews) * 100}%` : '0%' },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.reviewCount}>Positive({positiveCount})</ThemedText>
                </View>
                <View style={styles.reviewRow}>
                  <Image
                    source={require('@/assets/images/icons/neutral.png')}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: totalReviews > 0 ? `${(neutralCount / totalReviews) * 100}%` : '0%' },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.reviewCount}>Neutral({neutralCount})</ThemedText>
                </View>
                <View style={styles.reviewRow}>
                  <Image
                    source={require('@/assets/images/icons/sad.png')}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: totalReviews > 0 ? `${(negativeCount / totalReviews) * 100}%` : '0%' },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.reviewCount}>Negative({negativeCount})</ThemedText>
                </View>
              </View>
              <View style={styles.reviewsRight}>
                <ThemedText style={styles.ratingPercentage}>
                  {totalReviews > 0 ? `${positivePercentage}%` : '--'}
                </ThemedText>
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
                <ThemedText style={styles.totalReviews}>
                  {totalReviews === 1 ? '1 Review' : `${totalReviews} Reviews`}
                </ThemedText>
              </View>
            </View>
            <View style={styles.reviewsList}>
              <ThemedText style={styles.reviewsTitle}>
                {totalReviews === 1 ? 'All Reviews (1)' : `All Reviews (${totalReviews})`}
              </ThemedText>
              {reviewsLoading && (
                <ActivityIndicator size="small" color="#16A34A" style={{ marginTop: 8 }} />
              )}
              {totalReviews === 0 && !reviewsLoading && (
                <ThemedText style={styles.emptyStateSubtext}>No reviews yet</ThemedText>
              )}
              {sellerReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  name={review.buyerName || 'Buyer'}
                  avatar={
                    review.buyerAvatar
                      ? { uri: review.buyerAvatar }
                      : require('@/assets/images/avatar/profile.png')
                  }
                  time={getReviewTime(review.createdAt)}
                  sentiment={review.sentiment}
                  comment={review.comment}
                />
              ))}
            </View>
          </View>
        );
    }
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            // Add delay for better UX
            setTimeout(async () => {
              try {
                await signOutUser();
                router.replace('/auth/sign-in');
              } catch (error) {
                console.error('Error logging out:', error);
                Alert.alert('Error', 'Failed to logout');
              } finally {
                setLoggingOut(false);
              }
            }, 2000);
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#16A34A"
          colors={['#16A34A']}
        />
      }
    >

      {/* Header with gradient */}
      <LinearGradient
        colors={['#16a34a', '#18c658']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Profile Image */}
      <View style={styles.profileImageContainer}>
        {profileLoading ? (
          <View style={styles.profileImagePlaceholder}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <Image
            source={
              userProfile?.photoURL
                ? { uri: userProfile.photoURL }
                : require('@/assets/images/avatar/profile.png')
            }
            style={styles.profileImage}
          />
        )}
      </View>

      <View style={styles.mainContent}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {profileLoading ? (
            <View style={styles.profileInfoPlaceholder}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
            </View>
          ) : (
            <>
              <ThemedText style={styles.name}>
                {userProfile?.displayName || user?.displayName || 'User'}
              </ThemedText>
              <View style={styles.ratingContainer}>
                <Image
                  source={require('@/assets/images/icons/star.png')}
                  style={styles.starIcon}
                />
                <ThemedText style={styles.ratingText}>4.8/5.0 (95% Positive)</ThemedText>
              </View>
              <ThemedText style={styles.memberSince}>Member since January 2022</ThemedText>
              <ThemedText style={styles.location}>
                {userProfile?.location || 'Location not set'}
              </ThemedText>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile')}>
            <Image
              source={require('@/assets/images/icons/settings.png')}
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loggingOut}>
            {loggingOut ? (
              <View style={styles.logoutLoading}>
                <ActivityIndicator size="small" color="#fff" />
                <ThemedText style={styles.logoutText}>Logging out...</ThemedText>
              </View>
            ) : (
              <>
                <Image
                  source={require('@/assets/images/icons/logout.png')}
                  style={[styles.buttonIcon, styles.logoutIcon]}
                />
                <ThemedText style={styles.logoutText}>Logout</ThemedText>
              </>
            )}
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
            <ThemedText style={styles.statsNumber}>{itemsSoldCount}</ThemedText>
            <ThemedText style={styles.statsLabel}>Items Sold</ThemedText>
          </View>
          <View style={styles.statsCard}>
            <View style={[styles.iconCircle, styles.blueCircle]}>
              <Image
                source={require('@/assets/images/icons/box.png')}
                style={styles.statsIcon}
              />
            </View>
            <ThemedText style={styles.statsNumber}>{itemsBoughtCount}</ThemedText>
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
            <ThemedText style={styles.statsNumber}>--</ThemedText>
            <ThemedText style={styles.statsLabel}>Reviews</ThemedText>
          </View>
          <View style={styles.statsCard}>
            <View style={[styles.iconCircle, styles.purpleCircle]}>
              <Image
                source={require('@/assets/images/icons/favorite-indigo.png')}
                style={styles.statsIcon}
              />
            </View>
            <ThemedText style={styles.statsNumber}>{favoritesCount}</ThemedText>
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
              style={[styles.tabButton, activeTab === 'orders' && styles.activeTab]}
              onPress={() => setActiveTab('orders')}
            >
              <ThemedText style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
                My Orders
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
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 94,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
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
  profileInfoPlaceholder: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  logoutLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
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
  ordersContainer: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginVertical: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    position: 'relative',
  },
  ordersHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ordersFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ordersFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ordersFilterIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  ordersFilterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  ordersFilterMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    paddingVertical: 6,
    width: 200,
    zIndex: 10,
  },
  ordersFilterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  ordersFilterMenuIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    resizeMode: 'contain',
  },
  ordersFilterMenuLabel: {
    fontSize: 13,
    color: '#111827',
  },
  soldItemsSection: {
    gap: 16,
  },
  pendingDeliverySection: {
    gap: 16,
    marginBottom: 24,
  },
  pendingScrollContent: {
    paddingVertical: 8,
  },
  pendingRow: {
    width: width - 32,
    flexDirection: 'row',
    gap: 12,
    paddingRight: 8,
  },
  pendingItemContainer: {
    flex: 1,
  },
  optionsMenu: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  optionsMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionsMenuText: {
    fontSize: 14,
    color: '#111827',
  },
  emptyStateContainer: {
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
  // emptyStateText: {
  //   fontSize: 16,
  //   color: '#6B7280',
  // },
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
