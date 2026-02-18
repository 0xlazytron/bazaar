import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { User } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  getUserProfile,
  onAuthStateChange,
  signOutUser,
  UserProfile,
} from "../../lib/auth";
import {
  BidWithDetails,
  getProductOrders,
  getProducts,
  getSellerReviews,
  getUserBidsWithDetails,
  getUserOrders,
  Order,
  Product,
  Review,
  subscribeUserFavorites,
  updateOrder,
  updateProduct,
} from "../../lib/firestore";
import { testStorageConnectivity } from "../../lib/storage";
import { BidHistoryItem } from "../components/BidHistoryItem";
import { ImageWithLoader } from "../components/ImageWithLoader";
import { ListingCard } from "../components/ListingCard";
import { OrderItem } from "../components/OrderItem";
import { ReviewItem } from "../components/ReviewItem";
import { ThemedText } from "../components/ThemedText";

const { width } = Dimensions.get("window");

type OrderFilter =
  | "all"
  | "bought"
  | "sold"
  | "delivered"
  | "pending_delivery"
  | "tax_unpaid"
  | "tax_paid";

export default function ProfileScreen() {
  const {
    activeTab: paramActiveTab,
    scrollTo,
    highlightProductId,
    highlightBidId,
    highlightOrderId,
  } = useLocalSearchParams<{
    activeTab?: string;
    scrollTo?: string;
    highlightProductId?: string;
    highlightBidId?: string;
    highlightOrderId?: string;
  }>();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [userBids, setUserBids] = useState<BidWithDetails[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [counterpartyNameByUserId, setCounterpartyNameByUserId] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState(
    (paramActiveTab as string) || "listings",
  );
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [ordersFilterOpen, setOrdersFilterOpen] = useState(false);
  const [taxFilter, setTaxFilter] = useState<"all" | "unpaid" | "paid">(
    "unpaid",
  );
  const [taxPage, setTaxPage] = useState(1);
  const [updatingListingId, setUpdatingListingId] = useState<string | null>(
    null,
  );
  const [itemsSoldCount, setItemsSoldCount] = useState(0);
  const [itemsBoughtCount, setItemsBoughtCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [sellerReviews, setSellerReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const resolveJoinDate = () => {
    const rawCreatedAt: any = (userProfile as any)?.createdAt;
    if (rawCreatedAt) {
      if (rawCreatedAt instanceof Date) return rawCreatedAt;
      if (typeof rawCreatedAt?.toDate === "function") return rawCreatedAt.toDate();
      const d = new Date(rawCreatedAt);
      if (!Number.isNaN(d.getTime())) return d;
    }

    const creationTime = user?.metadata?.creationTime;
    if (creationTime) {
      const d = new Date(creationTime);
      if (!Number.isNaN(d.getTime())) return d;
    }

    return null;
  };

  const joinDate = resolveJoinDate();
  const joinDateText = joinDate
    ? joinDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : "—";

  const scrollViewRef = useRef<ScrollView>(null);
  const sectionYRef = useRef<Record<string, number>>({});
  const [flashProductId, setFlashProductId] = useState<string | null>(null);
  const [flashBidId, setFlashBidId] = useState<string | null>(null);
  const [flashOrderId, setFlashOrderId] = useState<string | null>(null);

  const setSectionY =
    (key: string) => (e: { nativeEvent: { layout: { y: number } } }) => {
      sectionYRef.current[key] = e.nativeEvent.layout.y;
    };

  useEffect(() => {
    if (typeof paramActiveTab === "string" && paramActiveTab) {
      setActiveTab(paramActiveTab);
    }
  }, [paramActiveTab]);

  useEffect(() => {
    if (activeTab === "tax") setTaxPage(1);
  }, [activeTab]);

  useEffect(() => {
    setTaxPage(1);
  }, [taxFilter]);

  useEffect(() => {
    if (typeof highlightProductId !== "string" || !highlightProductId) return;
    setFlashProductId(highlightProductId);
    const t = setTimeout(() => setFlashProductId(null), 2000);
    return () => clearTimeout(t);
  }, [highlightProductId]);

  useEffect(() => {
    if (typeof highlightBidId !== "string" || !highlightBidId) return;
    setFlashBidId(highlightBidId);
    const t = setTimeout(() => setFlashBidId(null), 2000);
    return () => clearTimeout(t);
  }, [highlightBidId]);

  useEffect(() => {
    if (typeof highlightOrderId !== "string" || !highlightOrderId) return;
    setFlashOrderId(highlightOrderId);
    const t = setTimeout(() => setFlashOrderId(null), 2000);
    return () => clearTimeout(t);
  }, [highlightOrderId]);

  // Helper function to map listing data to display format
  const mapListingToDisplay = (product: Product) => {
    console.log("🔍 Product Debug:", {
      productId: product.id,
      originalImages: product.images,
      mappedImages: product.images?.map((url: string) => ({ uri: url })),
      hasImages: product.images && product.images.length > 0,
      firstImage: product.images?.[0],
    });

    // Temporary test: Use a known working image URL to test the component
    const testImageUrl =
      "https://firebasestorage.googleapis.com/v0/b/bazaar-b558d.appspot.com/o/listings%2F1759182418933?alt=media&token=eb122e5e-4c0e-4394-8b3c-5379627cd6ab";

    return {
      ...product,
      title: product.title || `${product.category} Item`,
      description:
        product.description || product.data || "No description available",
      condition:
        product.condition || (product.itemCondition === "New" ? "new" : "good"),
      images:
        product.images && product.images.length > 0
          ? product.images
          : [testImageUrl],
      price:
        typeof product.price === "string"
          ? parseInt(product.price)
          : product.price,
      location:
        product.location || product.pickupLocation || "Location not specified",
      currentBid:
        product.currentBid ||
        (typeof product.price === "string"
          ? parseInt(product.price)
          : product.price),
      bidCount: product.bidCount || 0,
      auctionEndTime: product.auctionEndTime,
      isAuction: product.pricingType?.includes("Auction") || false,
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
      console.error("Error fetching user profile:", error);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadCounterpartyNames = async () => {
      if (!user) return;
      if (!userOrders.length) return;

      const idsToLoad = new Set<string>();
      for (const order of userOrders) {
        const isSeller = order.sellerId === user.uid;
        const counterpartyId = isSeller ? order.buyerId : order.sellerId;
        if (!counterpartyId) continue;
        const alreadyProvided = isSeller
          ? !!(order.buyerName || order.buyerEmail)
          : !!order.sellerName;
        if (alreadyProvided) continue;
        if (counterpartyNameByUserId[counterpartyId]) continue;
        idsToLoad.add(counterpartyId);
      }

      if (!idsToLoad.size) return;

      try {
        const entries = await Promise.all(
          Array.from(idsToLoad).map(async (id) => {
            try {
              const profile = await getUserProfile(id);
              const name = profile?.displayName || profile?.email || id;
              return [id, name] as const;
            } catch {
              return [id, id] as const;
            }
          }),
        );
        if (!active) return;
        setCounterpartyNameByUserId((prev) => {
          const next = { ...prev };
          for (const [id, name] of entries) next[id] = name;
          return next;
        });
      } catch {
        return;
      }
    };

    loadCounterpartyNames();
    return () => {
      active = false;
    };
  }, [user, userOrders, counterpartyNameByUserId]);

  // Fetch user's products
  const fetchUserProducts = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const result = await getProducts({
        sellerId: userId,
      });
      setProducts(result.products);
    } catch (error) {
      console.error("Error fetching user products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's bids
  const fetchUserBids = useCallback(async (userId: string) => {
    setBidsLoading(true);
    try {
      const bids = await getUserBidsWithDetails(userId);
      setUserBids(bids);
    } catch (error) {
      console.error("❌ [PROFILE] Error fetching user bids:", error);
    } finally {
      setBidsLoading(false);
    }
  }, []);

  // Fetch user's orders
  const fetchUserOrders = useCallback(async (userId: string) => {
    setOrdersLoading(true);
    try {
      console.log("🔍 [PROFILE] Fetching orders for user:", userId);
      const buyerOrders = await getUserOrders(userId, "buyer");
      const sellerOrders = await getUserOrders(userId, "seller");
      const allOrders = [...buyerOrders, ...sellerOrders].sort((a, b) => {
        const aValue: any = a.createdAt;
        const bValue: any = b.createdAt;
        const aDate =
          aValue instanceof Date
            ? aValue
            : aValue?.toDate
              ? aValue.toDate()
              : new Date(aValue);
        const bDate =
          bValue instanceof Date
            ? bValue
            : bValue?.toDate
              ? bValue.toDate()
              : new Date(bValue);
        return bDate.getTime() - aDate.getTime();
      });
      console.log(
        "🔍 [PROFILE] Fetched orders buyer:",
        buyerOrders.length,
        "seller:",
        sellerOrders.length,
      );
      setUserOrders(allOrders);
      setItemsBoughtCount(buyerOrders.length);
      setItemsSoldCount(sellerOrders.length);
    } catch (error) {
      console.error("❌ [PROFILE] Error fetching user orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchSellerReviews = useCallback(async (sellerId: string) => {
    setReviewsLoading(true);
    try {
      const items = await getSellerReviews(sellerId);
      setSellerReviews(items);
    } catch (error) {
      console.error("Error fetching seller reviews:", error);
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
        sellerId: user.uid,
      });
      setProducts(result.products);

      // Also refresh bids and orders
      await fetchUserBids(user.uid);
      await fetchUserOrders(user.uid);
    } catch (error) {
      console.error("Error refreshing user data:", error);
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
        setFavoritesLoading(false);
        setSellerReviews([]);
      }
    });

    // Test Firebase Storage connectivity
    testStorageConnectivity().catch((error) => {
      console.error("Storage connectivity test failed:", error);
    });

    return () => unsubscribe();
  }, [
    fetchUserProfile,
    fetchUserProducts,
    fetchUserBids,
    fetchUserOrders,
    fetchSellerReviews,
  ]);

  useEffect(() => {
    if (!user?.uid) return;
    setFavoritesLoading(true);
    let didReceive = false;
    const unsubscribe = subscribeUserFavorites(user.uid, (ids) => {
      didReceive = true;
      setFavoritesCount(ids.length);
      setFavoritesLoading(false);
    });
    return () => {
      unsubscribe();
      if (!didReceive) setFavoritesLoading(false);
    };
  }, [user?.uid]);

  // Auto-refresh listings when screen comes into focus (e.g., after creating a new listing)
  useFocusEffect(
    useCallback(() => {
      if (user) {
        fetchUserProfile(user.uid);
        fetchUserProducts(user.uid);
        fetchUserBids(user.uid);
        fetchUserOrders(user.uid);
        fetchSellerReviews(user.uid);
      }
    }, [
      user,
      fetchUserProfile,
      fetchUserProducts,
      fetchUserBids,
      fetchUserOrders,
      fetchSellerReviews,
    ]),
  );

  useFocusEffect(
    useCallback(() => {
      const scrollKey = typeof scrollTo === "string" ? scrollTo : "";
      const shouldScrollToTabs =
        typeof paramActiveTab === "string" && paramActiveTab.length > 0;
      const key = shouldScrollToTabs ? "tabs" : scrollKey;
      if (!key) return;

      const tryScroll = (attempt: number) => {
        const y =
          typeof sectionYRef.current[key] === "number"
            ? sectionYRef.current[key]
            : typeof sectionYRef.current.tabs === "number"
              ? sectionYRef.current.tabs
              : undefined;
        if (typeof y === "number" && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: Math.max(y - (key === "tabs" ? 0 : 24), 0),
            animated: true,
          });
          return;
        }
        if (attempt >= 30) return;
        setTimeout(() => tryScroll(attempt + 1), 100);
      };

      setTimeout(() => tryScroll(0), 50);
    }, [scrollTo, paramActiveTab]),
  );

  // Handle new listing button press
  const handleNewListing = () => {
    if (user) {
      router.push({
        pathname: "/(tabs)/new-listing",
        params: { newListingKey: Date.now().toString() },
      } as any);
    } else {
      router.push("/auth/sign-in");
    }
  };

  const calculateTimeLeft = (endTime: any): string => {
    if (!endTime) return "No time limit";

    const end =
      typeof endTime?.toDate === "function"
        ? endTime.toDate()
        : endTime instanceof Date
          ? endTime
          : new Date(endTime);

    if (!(end instanceof Date) || isNaN(end.getTime())) return "No time limit";

    const now = new Date();
    const timeDiff = end.getTime() - now.getTime();

    if (timeDiff <= 0) return "Ended";

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

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
      if (createdAt && typeof createdAt.toDate === "function") {
        date = createdAt.toDate();
      } else if (createdAt instanceof Date) {
        date = createdAt;
      } else if (typeof createdAt === "string") {
        date = new Date(createdAt);
      } else {
        // If createdAt is undefined or invalid, consider it not new
        return false;
      }

      const timeDiff = now.getTime() - date.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
      return daysDiff <= 7; // Consider listings new if created within 7 days
    } catch (error) {
      console.error("Error checking if listing is new:", error);
      return false;
    }
  };

  const getOrderFilterLabel = (value: OrderFilter = orderFilter) => {
    if (value === "bought") return "Bought";
    if (value === "sold") return "Sold";
    if (value === "pending_delivery") return "Pending delivery";
    if (value === "tax_unpaid") return "Tax unpaid";
    if (value === "tax_paid") return "Tax paid";
    if (value === "delivered") return "Delivered";
    return "All";
  };

  const getOrderFilterIcon = (value: OrderFilter = orderFilter) => {
    if (value === "bought") {
      return require("@/assets/images/icons/box.png");
    }
    if (value === "sold") {
      return require("@/assets/images/icons/bag.png");
    }
    if (value === "pending_delivery") {
      return require("@/assets/images/icons/delivery.png");
    }
    if (value === "tax_unpaid" || value === "tax_paid") {
      return require("@/assets/images/icons/star-yellow.png");
    }
    return require("@/assets/images/icons/favorite-indigo.png");
  };

  const shortId = (value: string) =>
    value.length > 16 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

  const openMessage = (
    otherUserId: string,
    otherName: string,
    order: Order,
  ) => {
    const avatar = "";
    const productId = order.productId || "";
    const productTitle = order.productTitle || "";
    const productImage = order.productImage || "";
    const productPrice = (order.itemPrice ?? order.totalAmount ?? 0).toString();
    router.push(
      `/(tabs)/message/${otherUserId}?name=${encodeURIComponent(otherName)}&avatar=${encodeURIComponent(avatar)}&online=true&productId=${encodeURIComponent(productId)}&productTitle=${encodeURIComponent(productTitle)}&productImage=${encodeURIComponent(productImage)}&productPrice=${encodeURIComponent(productPrice)}&returnTo=profile&returnActiveTab=orders&returnScrollTo=my_orders&returnOrderId=${encodeURIComponent(order.id || "")}`,
    );
  };

  const getFilteredOrders = () => {
    return userOrders.filter((order) => {
      const isSellerOrder = user && order.sellerId === user.uid;
      const isBuyerOrder = user && order.buyerId === user.uid;

      if (orderFilter === "delivered") {
        return order.status === "delivered";
      }
      if (orderFilter === "pending_delivery") {
        return (
          order.status === "pending" ||
          order.status === "confirmed" ||
          order.status === "shipped"
        );
      }
      if (orderFilter === "tax_unpaid") {
        return (
          isSellerOrder &&
          typeof order.productTax === "number" &&
          order.productTax > 0 &&
          order.taxPaid === false
        );
      }
      if (orderFilter === "tax_paid") {
        return (
          isSellerOrder &&
          typeof order.productTax === "number" &&
          order.productTax > 0 &&
          !!order.taxPaid
        );
      }
      if (orderFilter === "sold") {
        return isSellerOrder && order.status === "delivered";
      }
      if (orderFilter === "bought") {
        return isBuyerOrder;
      }
      return true;
    });
  };

  const totalReviews = sellerReviews.length;
  const positiveCount = sellerReviews.filter(
    (r) => r.sentiment === "positive",
  ).length;
  const neutralCount = sellerReviews.filter(
    (r) => r.sentiment === "neutral",
  ).length;
  const negativeCount = sellerReviews.filter(
    (r) => r.sentiment === "negative",
  ).length;
  const positivePercentage =
    totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0;
  const averageRating =
    totalReviews > 0
      ? (positiveCount * 5 + neutralCount * 3 + negativeCount * 1) /
      totalReviews
      : 0;
  const ratingSummaryText =
    totalReviews > 0
      ? `${averageRating.toFixed(1)}/5.0 (${positivePercentage}% Positive)`
      : "--/5.0 (-- Positive)";

  const soldBoughtLoading = !!user && (ordersLoading || refreshing);
  const reviewsStatLoading = !!user && (reviewsLoading || refreshing);
  const favoritesStatLoading = !!user && (favoritesLoading || refreshing);

  const getReviewTime = (createdAt: any) => {
    if (!createdAt) return "";
    const date =
      createdAt instanceof Date
        ? createdAt
        : createdAt.toDate
          ? createdAt.toDate()
          : new Date(createdAt);
    return date.toLocaleDateString();
  };

  const renderTabContent = () => {
    const activeListings = products.filter(
      (product) => product.status === "active",
    );
    const pendingDeliveryListings = products.filter(
      (product) => product.status === "pending_delivery",
    );

    switch (activeTab) {
      case "listings":
        return (
          <View style={styles.tabContent}>
            <View onLayout={setSectionY("active_listings")}>
              <View style={styles.listingHeader}>
                <ThemedText style={styles.sectionTitle}>
                  Active Listings
                </ThemedText>
                <View style={styles.headerButtons}>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                    disabled={refreshing}
                  >
                    {refreshing ? (
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
                  <TouchableOpacity
                    style={styles.newListingButton}
                    onPress={handleNewListing}
                  >
                    <ThemedText style={styles.newListingButtonText}>
                      + New Listing
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.listingsContainer}>
                {loading ? (
                  <ActivityIndicator
                    size="large"
                    color="#16A34A"
                    style={{ marginTop: 20 }}
                  />
                ) : activeListings.length > 0 ? (
                  activeListings.map((product) => {
                    const mappedProduct = mapListingToDisplay(product);
                    console.log("🖼️ DEBUG: Product images data:", {
                      productId: product.id,
                      originalImages: product.images,
                      mappedImages: mappedProduct.images,
                      hasImages:
                        mappedProduct.images && mappedProduct.images.length > 0,
                      firstImage: mappedProduct.images?.[0],
                    });
                    return (
                      <View
                        key={product.id}
                        style={
                          flashProductId === product.id
                            ? styles.flashCard
                            : undefined
                        }
                      >
                        <ListingCard
                          id={product.id}
                          title={mappedProduct.title}
                          currentBid={mappedProduct.currentBid}
                          buyNowPrice={mappedProduct.price}
                          timeLeft={
                            mappedProduct.auctionEndTime
                              ? calculateTimeLeft(mappedProduct.auctionEndTime)
                              : "Buy Now"
                          }
                          bidsCount={mappedProduct.bidCount}
                          condition={
                            mappedProduct.condition === "new" ||
                              mappedProduct.condition === "like-new"
                              ? "New"
                              : "Used"
                          }
                          image={
                            mappedProduct.images &&
                              mappedProduct.images.length > 0
                              ? { uri: mappedProduct.images[0] }
                              : require("@/assets/images/products/product-1.png")
                          }
                          isNewListing={isNewListing(product.createdAt)}
                          onPress={() => {
                            if (!product.id) return;
                            router.push({
                              pathname: "/(tabs)/product/[id]",
                              params: {
                                id: product.id,
                                returnTo: "profile",
                                returnTab: "listings",
                                returnSection: "active_listings",
                                returnLabel: "Active Listings",
                                highlightProductId: product.id,
                              },
                            } as any);
                          }}
                        />
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>
                      No active listings yet
                    </ThemedText>
                    <ThemedText style={styles.emptyStateSubtext}>
                      Start selling by creating your first listing
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
            <View
              style={styles.pendingDeliverySection}
              onLayout={setSectionY("pending_delivery")}
            >
              <ThemedText style={styles.sectionTitle}>
                Pending Delivery
              </ThemedText>
              {pendingDeliveryListings.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pendingScrollContent}
                >
                  {Array.from({
                    length: Math.ceil(pendingDeliveryListings.length / 2),
                  }).map((_, index) => {
                    const start = index * 2;
                    const pair = pendingDeliveryListings.slice(
                      start,
                      start + 2,
                    );
                    return (
                      <View key={index} style={styles.pendingRow}>
                        {pair.map((product) => {
                          const mappedProduct = mapListingToDisplay(product);
                          return (
                            <View
                              key={product.id}
                              style={[
                                styles.pendingItemContainer,
                                flashProductId === product.id
                                  ? styles.flashCard
                                  : undefined,
                              ]}
                            >
                              <ListingCard
                                id={product.id}
                                title={mappedProduct.title}
                                currentBid={mappedProduct.currentBid}
                                buyNowPrice={mappedProduct.price}
                                timeLeft={
                                  mappedProduct.auctionEndTime
                                    ? calculateTimeLeft(
                                      mappedProduct.auctionEndTime,
                                    )
                                    : "Buy Now"
                                }
                                bidsCount={mappedProduct.bidCount}
                                condition={
                                  mappedProduct.condition === "new" ||
                                    mappedProduct.condition === "like-new"
                                    ? "New"
                                    : "Used"
                                }
                                image={
                                  mappedProduct.images &&
                                    mappedProduct.images.length > 0
                                    ? { uri: mappedProduct.images[0] }
                                    : require("@/assets/images/products/product-1.png")
                                }
                                isNewListing={isNewListing(product.createdAt)}
                                onPress={() => {
                                  if (!product.id) return;
                                  router.push({
                                    pathname: "/(tabs)/product/[id]",
                                    params: {
                                      id: product.id,
                                      returnTo: "profile",
                                      returnTab: "listings",
                                      returnSection: "pending_delivery",
                                      returnLabel: "Pending Delivery",
                                      highlightProductId: product.id,
                                    },
                                  } as any);
                                }}
                                showMarkSoldButton={true}
                                markSoldLoading={updatingListingId === product.id}
                                onMarkSoldPress={async () => {
                                  if (!product.id || updatingListingId) return;
                                  const listingId = product.id;
                                  try {
                                    setUpdatingListingId(listingId);
                                    setProducts((prev) =>
                                      prev.map((p) =>
                                        p.id === listingId
                                          ? { ...p, status: "sold" }
                                          : p,
                                      ),
                                    );
                                    const orders = await getProductOrders(
                                      listingId,
                                    );
                                    if (orders.length > 0 && orders[0].id) {
                                      const latestOrder = orders[0];
                                      const completedAt = new Date();
                                      const taxBase =
                                        typeof latestOrder.itemPrice ===
                                          "number"
                                          ? latestOrder.itemPrice
                                          : parseFloat(
                                            String(
                                              latestOrder.itemPrice || 0,
                                            ),
                                          );
                                      const productTax = parseFloat(
                                        (taxBase * 0.0515).toFixed(2),
                                      );

                                      setUserOrders((prev) =>
                                        prev.map((o) =>
                                          o.id === latestOrder.id
                                            ? {
                                              ...o,
                                              status: "delivered",
                                              completedAt,
                                              productTax,
                                              taxPaid: false,
                                              taxProof: "",
                                            }
                                            : o,
                                        ),
                                      );

                                      await updateOrder(latestOrder.id!, {
                                        status: "delivered",
                                        completedAt,
                                        productTax,
                                        taxPaid: false,
                                        taxProof: "",
                                      });
                                    }
                                    await updateProduct(listingId, {
                                      status: "sold",
                                    });
                                  } catch (error) {
                                    setProducts((prev) =>
                                      prev.map((p) =>
                                        p.id === listingId
                                          ? { ...p, status: "pending_delivery" }
                                          : p,
                                      ),
                                    );
                                    console.error(
                                      "Error marking product as sold:",
                                      error,
                                    );
                                    Alert.alert(
                                      "Error",
                                      "Could not mark item as sold. Please try again.",
                                    );
                                  } finally {
                                    setUpdatingListingId(null);
                                  }
                                }}
                              />
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </ScrollView>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <ThemedText style={styles.emptyStateText}>
                    No items pending delivery.
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        );
      case "bids":
        return (
          <View style={styles.tabContent}>
            <View
              style={styles.bidHistoryHeader}
              onLayout={setSectionY("my_bids")}
            >
              <Image
                source={require("@/assets/images/icons/bid-history.png")}
                style={styles.bidHistoryIcon}
              />
              <ThemedText style={styles.sectionTitle}>Bid History</ThemedText>
            </View>
            {bidsLoading ? (
              <ActivityIndicator
                size="large"
                color="#16A34A"
                style={{ marginTop: 20 }}
              />
            ) : (() => {
              console.log("🔍 [RENDER] userBids state:", userBids);
              console.log("🔍 [RENDER] userBids length:", userBids.length);
              console.log("🔍 [RENDER] bidsLoading:", bidsLoading);
              return userBids.length > 0;
            })() ? (
              <View style={styles.bidHistoryTable}>
                <View style={styles.tableHeader}>
                  <View style={styles.itemHeaderColumn}>
                    <ThemedText style={styles.tableHeaderText}>Item</ThemedText>
                  </View>
                  <View style={styles.amountHeaderColumn}>
                    <ThemedText style={styles.tableHeaderText}>
                      Amount
                    </ThemedText>
                  </View>
                  <View style={styles.timeHeaderColumn}>
                    <ThemedText style={styles.tableHeaderText}>Time</ThemedText>
                  </View>
                </View>
                {userBids.map((bid) => (
                  <View
                    key={bid.id}
                    style={flashBidId === bid.id ? styles.flashRow : undefined}
                  >
                    <BidHistoryItem
                      itemName={bid.productTitle}
                      amount={bid.amount}
                      time={bid.timeAgo}
                      isHighestBid={bid.isHighestBid}
                      image={
                        bid.productImage
                          ? { uri: bid.productImage }
                          : require("@/assets/images/products/product-1.png")
                      }
                      onPress={() => {
                        if (!bid.productId) return;
                        router.push({
                          pathname: "/(tabs)/product/[id]",
                          params: {
                            id: bid.productId,
                            highlightBid: bid.id,
                            returnTo: "profile",
                            returnTab: "bids",
                            returnSection: "my_bids",
                            returnLabel: "My Bids",
                            highlightBidId: bid.id,
                          },
                        } as any);
                      }}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyStateText}>
                  No bids placed yet
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  Start bidding on items you&apos;re interested in
                </ThemedText>
              </View>
            )}
          </View>
        );
      case "orders":
        return (
          <View style={styles.tabContent}>
            <View
              style={styles.ordersHeader}
              onLayout={setSectionY("my_orders")}
            >
              <View style={styles.ordersHeaderLeft}>
                <Image
                  source={require("@/assets/images/icons/box.png")}
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
                  <ThemedText style={styles.ordersFilterButtonText}>
                    {getOrderFilterLabel()}
                  </ThemedText>
                </View>
              </TouchableOpacity>
              {ordersFilterOpen && (
                <View style={styles.ordersFilterMenu}>
                  {(
                    [
                      "all",
                      "bought",
                      "sold",
                      "delivered",
                      "pending_delivery",
                      "tax_unpaid",
                      "tax_paid",
                    ] as OrderFilter[]
                  ).map((value) => (
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
                  ))}
                </View>
              )}
            </View>
            {ordersLoading ? (
              <ActivityIndicator
                size="large"
                color="#16A34A"
                style={{ marginTop: 20 }}
              />
            ) : (
              (() => {
                const filteredOrders = getFilteredOrders();
                return filteredOrders.length > 0 ? (
                  <View style={styles.ordersContainer}>
                    {filteredOrders.map((order) => {
                      const isSellerOrder = order.sellerId === user?.uid;
                      const otherUserId = isSellerOrder
                        ? order.buyerId
                        : order.sellerId;
                      const otherName = isSellerOrder
                        ? order.buyerName ||
                        order.buyerEmail ||
                        counterpartyNameByUserId[order.buyerId] ||
                        shortId(order.buyerId)
                        : order.sellerName ||
                        counterpartyNameByUserId[order.sellerId] ||
                        shortId(order.sellerId);
                      const canRateSeller =
                        !isSellerOrder &&
                        order.status === "delivered" &&
                        !!order.id;

                      return (
                        <View
                          key={order.id}
                          style={
                            flashOrderId === order.id
                              ? styles.flashCard
                              : undefined
                          }
                        >
                          <OrderItem
                            id={order.id || ""}
                            orderNumber={order.orderNumber}
                            productTitle={
                              order.productTitle || "Unknown Product"
                            }
                            productImage={order.productImage}
                            amount={order.totalAmount}
                            status={order.status}
                            orderDate={
                              order.createdAt instanceof Date
                                ? order.createdAt.toLocaleDateString()
                                : new Date(
                                  (order.createdAt as any).seconds * 1000,
                                ).toLocaleDateString()
                            }
                            deliveryAddress={
                              order.deliveryAddress ||
                              order.pickupLocation ||
                              "Address not specified"
                            }
                            counterpartyLabel={
                              isSellerOrder ? "Buyer" : "Seller"
                            }
                            counterpartyName={otherName}
                            productTax={order.productTax}
                            taxPaid={order.taxPaid}
                            isSeller={isSellerOrder}
                            onPress={() => {
                              if (!otherUserId) return;
                              openMessage(otherUserId, otherName, order);
                            }}
                            onMessagePress={
                              otherUserId
                                ? () =>
                                  openMessage(otherUserId, otherName, order)
                                : undefined
                            }
                            messageLabel={
                              isSellerOrder ? "Message buyer" : "Message seller"
                            }
                            messageIcon={require("@/assets/images/icons/messages.png")}
                            onSecondaryPress={
                              canRateSeller
                                ? () =>
                                  router.push({
                                    pathname: "/(tabs)/review-seller/[id]",
                                    params: {
                                      id: order.id!,
                                      returnTo: "profile",
                                      returnActiveTab: "orders",
                                      returnScrollTo: "my_orders",
                                      highlightOrderId: order.id!,
                                    },
                                  } as any)
                                : undefined
                            }
                            secondaryLabel="Rate seller"
                            secondaryIcon={require("@/assets/images/icons/star-filled.png")}
                            onTaxPress={
                              isSellerOrder &&
                                order.status === "delivered" &&
                                order.id
                                ? () =>
                                  router.push({
                                    pathname: "/(tabs)/order-tax/[id]",
                                    params: {
                                      id: order.id!,
                                      returnTo: "profile",
                                      returnActiveTab: "orders",
                                      returnScrollTo: "my_orders",
                                      highlightOrderId: order.id!,
                                    },
                                  } as any)
                                : undefined
                            }
                            taxLabel="Tax proof"
                            taxIcon={require("@/assets/images/icons/star-yellow.png")}
                          />
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <ThemedText style={styles.emptyStateText}>
                      {orderFilter === "all"
                        ? "No orders yet"
                        : "No orders found for this filter"}
                    </ThemedText>
                    <ThemedText style={styles.emptyStateSubtext}>
                      Start shopping to see your orders here
                    </ThemedText>
                  </View>
                );
              })()
            )}
          </View>
        );
      case "tax":
        return (
          <View style={styles.tabContent}>
            <View style={styles.taxHeader} onLayout={setSectionY("tax_management")}>
              <View style={styles.ordersHeaderLeft}>
                <Image
                  source={require("@/assets/images/icons/star-yellow.png")}
                  style={styles.bidHistoryIcon}
                />
                <ThemedText style={styles.sectionTitle}>
                  Tax Management
                </ThemedText>
              </View>
            </View>
            <View style={styles.taxFiltersRow}>
              <TouchableOpacity
                style={[
                  styles.taxFilterPill,
                  taxFilter === "all" ? styles.taxFilterPillActive : undefined,
                ]}
                onPress={() => setTaxFilter("all")}
              >
                <ThemedText
                  style={[
                    styles.taxFilterText,
                    taxFilter === "all" ? styles.taxFilterTextActive : undefined,
                  ]}
                >
                  All
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.taxFilterPill,
                  taxFilter === "unpaid"
                    ? styles.taxFilterPillActive
                    : undefined,
                ]}
                onPress={() => setTaxFilter("unpaid")}
              >
                <ThemedText
                  style={[
                    styles.taxFilterText,
                    taxFilter === "unpaid"
                      ? styles.taxFilterTextActive
                      : undefined,
                  ]}
                >
                  Unpaid
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.taxFilterPill,
                  taxFilter === "paid" ? styles.taxFilterPillActive : undefined,
                ]}
                onPress={() => setTaxFilter("paid")}
              >
                <ThemedText
                  style={[
                    styles.taxFilterText,
                    taxFilter === "paid" ? styles.taxFilterTextActive : undefined,
                  ]}
                >
                  Paid
                </ThemedText>
              </TouchableOpacity>
            </View>
            {ordersLoading ? (
              <ActivityIndicator
                size="large"
                color="#16A34A"
                style={{ marginTop: 20 }}
              />
            ) : (() => {
              const taxOrdersBase = userOrders.filter((order) => {
                const isSellerOrder = order.sellerId === user?.uid;
                const hasTax =
                  typeof order.productTax === "number" && order.productTax > 0;
                return isSellerOrder && order.status === "delivered" && hasTax;
              });
              const taxOrdersBaseTotalTax = taxOrdersBase.reduce(
                (sum, o) => sum + (typeof o.productTax === "number" ? o.productTax : 0),
                0,
              );
              const taxOrdersBasePaid = taxOrdersBase.filter((o) => !!o.taxPaid);
              const taxOrdersBasePaidTax = taxOrdersBasePaid.reduce(
                (sum, o) => sum + (typeof o.productTax === "number" ? o.productTax : 0),
                0,
              );
              const taxOrdersBaseUnpaidCount =
                taxOrdersBase.length - taxOrdersBasePaid.length;
              const taxOrdersBaseUnpaidTax =
                taxOrdersBaseTotalTax - taxOrdersBasePaidTax;
              const taxPaidRatio =
                taxOrdersBaseTotalTax > 0
                  ? taxOrdersBasePaidTax / taxOrdersBaseTotalTax
                  : 0;
              const taxPaidPercent = Math.round(taxPaidRatio * 100);
              const taxUnpaidPercent = 100 - taxPaidPercent;

              const taxOrders =
                taxFilter === "all"
                  ? taxOrdersBase
                  : taxFilter === "paid"
                    ? taxOrdersBase.filter((o) => !!o.taxPaid)
                    : taxOrdersBase.filter((o) => o.taxPaid === false);

              const taxItemsPerPage = 5;
              const taxVisibleCount = taxPage * taxItemsPerPage;
              const taxOrdersVisible = taxOrders.slice(0, taxVisibleCount);
              const taxHasMore = taxOrdersVisible.length < taxOrders.length;
              const taxPaidBarWidth =
                `${Math.max(0, Math.min(100, taxPaidRatio * 100))}%` as `${number}%`;
              const taxUnpaidBarWidth =
                `${Math.max(0, Math.min(100, 100 - taxPaidRatio * 100))}%` as `${number}%`;

              return taxOrders.length > 0 ? (
                <View style={styles.ordersContainer}>
                  <View style={styles.taxAnalyticsSection}>
                    <LinearGradient
                      colors={["#ECFDF5", "#FFFFFF"]}
                      style={[
                        styles.taxAnalyticsCard,
                        styles.taxAnalyticsCardTotal,
                        styles.taxAnalyticsCardWide,
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.taxAnalyticsTopRow}>
                        <ThemedText style={styles.taxAnalyticsLabel}>
                          Total
                        </ThemedText>
                        <View
                          style={[
                            styles.taxAnalyticsIconCircle,
                            styles.taxAnalyticsIconCircleTotal,
                          ]}
                        >
                          <Image
                            source={require("@/assets/images/icons/rupee.png")}
                            style={[styles.taxAnalyticsIcon, styles.taxAnalyticsIconTotal]}
                          />
                        </View>
                      </View>
                      <ThemedText
                        style={styles.taxAnalyticsValue}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.85}
                      >
                        Rs {taxOrdersBaseTotalTax.toLocaleString()}
                      </ThemedText>
                      <ThemedText style={styles.taxAnalyticsMeta}>
                        {taxOrdersBase.length} orders
                      </ThemedText>
                    </LinearGradient>

                    <View style={styles.taxAnalyticsRow}>
                      <LinearGradient
                        colors={["#EFF6FF", "#FFFFFF"]}
                        style={[styles.taxAnalyticsCard, styles.taxAnalyticsCardPaid]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.taxAnalyticsTopRow}>
                          <ThemedText style={styles.taxAnalyticsLabel}>
                            Paid
                          </ThemedText>
                          <View
                            style={[
                              styles.taxAnalyticsIconCircle,
                              styles.taxAnalyticsIconCirclePaid,
                            ]}
                          >
                            <Image
                              source={require("@/assets/images/icons/success.png")}
                              style={[styles.taxAnalyticsIcon, styles.taxAnalyticsIconPaid]}
                            />
                          </View>
                        </View>
                        <ThemedText
                          style={styles.taxAnalyticsValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          Rs {taxOrdersBasePaidTax.toLocaleString()}
                        </ThemedText>
                        <ThemedText style={styles.taxAnalyticsMeta}>
                          {taxOrdersBasePaid.length} orders
                        </ThemedText>
                      </LinearGradient>

                      <LinearGradient
                        colors={["#FEF3C7", "#FFFFFF"]}
                        style={[styles.taxAnalyticsCard, styles.taxAnalyticsCardUnpaid]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <View style={styles.taxAnalyticsTopRow}>
                          <ThemedText style={styles.taxAnalyticsLabel}>
                            Unpaid
                          </ThemedText>
                          <View
                            style={[
                              styles.taxAnalyticsIconCircle,
                              styles.taxAnalyticsIconCircleUnpaid,
                            ]}
                          >
                            <Image
                              source={require("@/assets/images/icons/warning.png")}
                              style={[styles.taxAnalyticsIcon, styles.taxAnalyticsIconUnpaid]}
                            />
                          </View>
                        </View>
                        <ThemedText
                          style={styles.taxAnalyticsValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.85}
                        >
                          Rs {taxOrdersBaseUnpaidTax.toLocaleString()}
                        </ThemedText>
                        <ThemedText style={styles.taxAnalyticsMeta}>
                          {taxOrdersBaseUnpaidCount} orders
                        </ThemedText>
                      </LinearGradient>
                    </View>
                  </View>
                  <View style={styles.taxProgressContainer}>
                    <View style={styles.taxProgressBar}>
                      <View
                        style={[
                          styles.taxProgressPaid,
                          { width: taxPaidBarWidth },
                        ]}
                      />
                      <View
                        style={[
                          styles.taxProgressUnpaid,
                          { width: taxUnpaidBarWidth },
                        ]}
                      />
                    </View>
                    <View style={styles.taxProgressLegend}>
                      <View style={styles.taxLegendItem}>
                        <View
                          style={[
                            styles.taxLegendDot,
                            styles.taxLegendDotPaid,
                          ]}
                        />
                        <ThemedText style={styles.taxLegendText}>
                          Paid {taxPaidPercent}%
                        </ThemedText>
                      </View>
                      <View style={styles.taxLegendItem}>
                        <View
                          style={[
                            styles.taxLegendDot,
                            styles.taxLegendDotUnpaid,
                          ]}
                        />
                        <ThemedText style={styles.taxLegendText}>
                          Unpaid {taxUnpaidPercent}%
                        </ThemedText>
                      </View>
                    </View>
                  </View>

                  {taxOrdersVisible.map((order) => {
                    const otherName =
                      order.buyerName ||
                      order.buyerEmail ||
                      counterpartyNameByUserId[order.buyerId] ||
                      shortId(order.buyerId);
                    return (
                      <View
                        key={order.id}
                        style={
                          flashOrderId === order.id
                            ? styles.flashCard
                            : undefined
                        }
                      >
                        <OrderItem
                          id={order.id || ""}
                          orderNumber={order.orderNumber}
                          productTitle={order.productTitle || "Unknown Product"}
                          productImage={order.productImage}
                          amount={order.totalAmount}
                          status={order.status}
                          orderDate={
                            order.createdAt instanceof Date
                              ? order.createdAt.toLocaleDateString()
                              : new Date(
                                (order.createdAt as any).seconds * 1000,
                              ).toLocaleDateString()
                          }
                          deliveryAddress={
                            order.deliveryAddress ||
                            order.pickupLocation ||
                            "Address not specified"
                          }
                          counterpartyLabel="Buyer"
                          counterpartyName={otherName}
                          productTax={order.productTax}
                          taxPaid={order.taxPaid}
                          isSeller={true}
                          onPress={() => {
                            if (!order.id) return;
                            router.push({
                              pathname: "/(tabs)/order-tax/[id]",
                              params: {
                                id: order.id!,
                                returnTo: "profile",
                                returnActiveTab: "tax",
                                returnScrollTo: "tax_management",
                                highlightOrderId: order.id!,
                              },
                            } as any);
                          }}
                          onTaxPress={
                            order.id
                              ? () =>
                                router.push({
                                  pathname: "/(tabs)/order-tax/[id]",
                                  params: {
                                    id: order.id!,
                                    returnTo: "profile",
                                    returnActiveTab: "tax",
                                    returnScrollTo: "tax_management",
                                    highlightOrderId: order.id!,
                                  },
                                } as any)
                              : undefined
                          }
                          taxLabel="Tax proof"
                          taxIcon={require("@/assets/images/icons/star-yellow.png")}
                        />
                      </View>
                    );
                  })}

                  <View style={styles.taxPaginationRow}>
                    <ThemedText style={styles.taxPaginationText}>
                      Showing {taxOrdersVisible.length} of {taxOrders.length}
                    </ThemedText>
                    {taxHasMore && (
                      <TouchableOpacity
                        style={styles.taxLoadMoreButton}
                        onPress={() => setTaxPage((p) => p + 1)}
                      >
                        <ThemedText style={styles.taxLoadMoreText}>
                          Load more
                        </ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <ThemedText style={styles.emptyStateText}>
                    No tax items found
                  </ThemedText>
                  <ThemedText style={styles.emptyStateSubtext}>
                    Delivered orders with tax will show up here
                  </ThemedText>
                </View>
              );
            })()}
          </View>
        );
      case "reviews":
        return (
          <View style={styles.tabContent}>
            <View style={styles.reviewsStats}>
              <View style={styles.reviewsLeft}>
                <View style={styles.reviewRow}>
                  <Image
                    source={require("@/assets/images/icons/happy.png")}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            totalReviews > 0
                              ? `${(positiveCount / totalReviews) * 100}%`
                              : "0%",
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.reviewCount}>
                    Positive({positiveCount})
                  </ThemedText>
                </View>
                <View style={styles.reviewRow}>
                  <Image
                    source={require("@/assets/images/icons/neutral.png")}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            totalReviews > 0
                              ? `${(neutralCount / totalReviews) * 100}%`
                              : "0%",
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.reviewCount}>
                    Neutral({neutralCount})
                  </ThemedText>
                </View>
                <View style={styles.reviewRow}>
                  <Image
                    source={require("@/assets/images/icons/sad.png")}
                    style={styles.moodIcon}
                  />
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width:
                            totalReviews > 0
                              ? `${(negativeCount / totalReviews) * 100}%`
                              : "0%",
                        },
                      ]}
                    />
                  </View>
                  <ThemedText style={styles.reviewCount}>
                    Negative({negativeCount})
                  </ThemedText>
                </View>
              </View>
              <View style={styles.reviewsRight}>
                <ThemedText style={styles.ratingPercentage}>
                  {totalReviews > 0 ? `${positivePercentage}%` : "--"}
                </ThemedText>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4].map((_, index) => (
                    <Image
                      key={index}
                      source={require("@/assets/images/icons/star-filled.png")}
                      style={styles.starIconSmall}
                    />
                  ))}
                  <Image
                    source={require("@/assets/images/icons/star-outline.png")}
                    style={styles.starIconSmall}
                  />
                </View>
                <ThemedText style={styles.totalReviews}>
                  {totalReviews === 1 ? "1 Review" : `${totalReviews} Reviews`}
                </ThemedText>
              </View>
            </View>
            <View style={styles.reviewsList}>
              <ThemedText style={styles.reviewsTitle}>
                {totalReviews === 1
                  ? "All Reviews (1)"
                  : `All Reviews (${totalReviews})`}
              </ThemedText>
              {reviewsLoading && (
                <ActivityIndicator
                  size="small"
                  color="#16A34A"
                  style={{ marginTop: 8 }}
                />
              )}
              {totalReviews === 0 && !reviewsLoading && (
                <ThemedText style={styles.emptyStateSubtext}>
                  No reviews yet
                </ThemedText>
              )}
              {sellerReviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  name={review.buyerName || "Buyer"}
                  avatar={
                    review.buyerAvatar
                      ? { uri: review.buyerAvatar }
                      : require("@/assets/images/avatar/profile.png")
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
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          // Add delay for better UX
          setTimeout(async () => {
            try {
              await signOutUser();
              router.replace("/auth/sign-in");
            } catch (error) {
              console.error("Error logging out:", error);
              Alert.alert("Error", "Failed to logout");
            } finally {
              setLoggingOut(false);
            }
          }, 2000);
        },
      },
    ]);
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#16A34A"
          colors={["#16A34A"]}
        />
      }
    >
      {/* Header with gradient */}
      <LinearGradient
        colors={["#16a34a", "#18c658"]}
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
          <ImageWithLoader
            source={
              userProfile?.photoURL
                ? { uri: userProfile.photoURL }
                : require("@/assets/images/avatar/profile.png")
            }
            style={styles.profileImage}
            loaderSize="small"
            debugLabel="ProfileAvatar"
          />
        )}
      </View>

      <View style={styles.mainContent}>
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          {profileLoading ? (
            <View style={styles.profileInfoPlaceholder}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <ThemedText style={styles.loadingText}>
                Loading profile...
              </ThemedText>
            </View>
          ) : (
            <>
              <ThemedText style={styles.name}>
                {userProfile?.displayName || user?.displayName || "User"}
              </ThemedText>
              <View style={styles.ratingContainer}>
                <Image
                  source={require("@/assets/images/icons/star.png")}
                  style={styles.starIcon}
                />
                <ThemedText style={styles.ratingText}>
                  {ratingSummaryText}
                </ThemedText>
              </View>
              <View style={styles.profileMetaRow}>
                <Image
                  source={require("@/assets/images/icons/clock.png")}
                  style={styles.profileMetaIcon}
                />
                <ThemedText style={styles.profileMetaText}>
                  {joinDateText}
                </ThemedText>
              </View>
              <View style={styles.profileMetaRow}>
                <Image
                  source={require("@/assets/images/icons/location.png")}
                  style={styles.profileMetaIcon}
                />
                <ThemedText style={styles.profileMetaText}>
                  {userProfile?.location || "Location not set"}
                </ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/edit-profile")}
          >
            <Image
              source={require("@/assets/images/icons/settings.png")}
              style={styles.buttonIcon}
            />
            <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <View style={styles.logoutLoading}>
                <ActivityIndicator size="small" color="#fff" />
                <ThemedText style={styles.logoutText}>
                  Logging out...
                </ThemedText>
              </View>
            ) : (
              <>
                <Image
                  source={require("@/assets/images/icons/logout.png")}
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
          <TouchableOpacity
            style={styles.statsCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/items-sold",
                params: { from: "profile" },
              } as any)
            }
          >
            <View style={[styles.iconCircle, styles.greenCircle]}>
              <Image
                source={require("@/assets/images/icons/bag.png")}
                style={styles.statsIcon}
              />
            </View>
            {soldBoughtLoading ? (
              <View style={styles.statsNumberLoader}>
                <ActivityIndicator size="small" color="#020817" />
              </View>
            ) : (
              <ThemedText style={styles.statsNumber}>
                {itemsSoldCount}
              </ThemedText>
            )}
            <ThemedText style={styles.statsLabel}>Items Sold</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statsCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/items-bought",
                params: { from: "profile" },
              } as any)
            }
          >
            <View style={[styles.iconCircle, styles.blueCircle]}>
              <Image
                source={require("@/assets/images/icons/box.png")}
                style={styles.statsIcon}
              />
            </View>
            {soldBoughtLoading ? (
              <View style={styles.statsNumberLoader}>
                <ActivityIndicator size="small" color="#020817" />
              </View>
            ) : (
              <ThemedText style={styles.statsNumber}>
                {itemsBoughtCount}
              </ThemedText>
            )}
            <ThemedText style={styles.statsLabel}>Items Bought</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={styles.statsCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/my-reviews",
                params: { from: "profile" },
              } as any)
            }
          >
            <View style={[styles.iconCircle, styles.amberCircle]}>
              <Image
                source={require("@/assets/images/icons/star-yellow.png")}
                style={styles.statsIcon}
              />
            </View>
            {reviewsStatLoading ? (
              <View style={styles.statsNumberLoader}>
                <ActivityIndicator size="small" color="#020817" />
              </View>
            ) : (
              <ThemedText style={styles.statsNumber}>{totalReviews}</ThemedText>
            )}
            <ThemedText style={styles.statsLabel}>Reviews</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statsCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/favorites",
                params: { from: "profile" },
              } as any)
            }
          >
            <View style={[styles.iconCircle, styles.purpleCircle]}>
              <Image
                source={require("@/assets/images/icons/favorite-indigo.png")}
                style={styles.statsIcon}
              />
            </View>
            {favoritesStatLoading ? (
              <View style={styles.statsNumberLoader}>
                <ActivityIndicator size="small" color="#020817" />
              </View>
            ) : (
              <ThemedText style={styles.statsNumber}>
                {favoritesCount}
              </ThemedText>
            )}
            <ThemedText style={styles.statsLabel}>Favorites</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Section */}
      <View style={styles.reviewsSection} onLayout={setSectionY("tabs")}>
        <View style={styles.reviewsHeader}>
          <View style={styles.reviewsTab}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "listings" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("listings")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "listings" && styles.activeTabText,
                ]}
              >
                My Listing
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "bids" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("bids")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "bids" && styles.activeTabText,
                ]}
              >
                My Bids
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "orders" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("orders")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "orders" && styles.activeTabText,
                ]}
              >
                My Orders
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "tax" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("tax")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "tax" && styles.activeTabText,
                ]}
              >
                Tax
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === "reviews" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("reviews")}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === "reviews" && styles.activeTabText,
                ]}
              >
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
    backgroundColor: "#FFFFFF",
  },
  flashCard: {
    borderWidth: 2,
    borderColor: "#16A34A",
    borderRadius: 18,
  },
  flashRow: {
    backgroundColor: "#ECFDF5",
  },
  mainContent: {
    flex: 1,
    backgroundColor: "white",
    marginTop: -98,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: 1,
  },
  headerGradient: {
    height: 310,
    width: width,
    position: "relative",
    zIndex: 1,
  },
  profileImageContainer: {
    position: "absolute",
    top: 100, // 243 - 98
    left: (width - 196) / 2, // Center horizontally
    width: 196,
    height: 196,
    borderRadius: 98,
    padding: 4,
    backgroundColor: "white",
    zIndex: 2,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 94,
    overflow: "hidden",
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 94,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "white",
    paddingTop: 98,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#020817",
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    color: "#6B7280",
  },
  profileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  profileMetaIcon: {
    width: 14,
    height: 14,
    marginRight: 6,
    tintColor: "#6B7280",
  },
  profileMetaText: {
    fontSize: 16,
    color: "#6B7280",
  },
  profileInfoPlaceholder: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  logoutLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  logoutIcon: {
    tintColor: "#EF4444",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#020817",
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  statsGrid: {
    padding: 16,
    marginTop: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  greenCircle: {
    backgroundColor: "#f2fce2",
  },
  blueCircle: {
    backgroundColor: "#dbeafe",
  },
  amberCircle: {
    backgroundColor: "#fef3c7",
  },
  purpleCircle: {
    backgroundColor: "#f3e8ff",
  },
  statsIcon: {
    width: 22,
    height: 22,
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#020817",
    marginTop: 12,
  },
  statsNumberLoader: {
    height: 28,
    justifyContent: "center",
    marginTop: 12,
  },
  statsLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  reviewsSection: {
    padding: 16,
  },
  reviewsHeader: {
    marginBottom: 24,
  },
  reviewsTab: {
    flexDirection: "row",
    backgroundColor: "#f3fcf7",
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "white",
    borderRadius: 11,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  activeTabText: {
    color: "#020817",
  },
  reviewsStats: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    padding: 16,
  },
  reviewsLeft: {
    flex: 1,
    gap: 12,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodIcon: {
    width: 24,
    height: 24,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#16A34A",
    borderRadius: 3,
  },
  reviewCount: {
    fontSize: 10,
    fontWeight: "500",
    color: "#333",
  },
  reviewsRight: {
    alignItems: "flex-end",
  },
  ratingPercentage: {
    fontSize: 40,
    lineHeight: 42,
    marginLeft: 16,
    color: "#333",
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  starIconSmall: {
    width: 12,
    height: 12,
  },
  totalReviews: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginTop: 8,
  },
  reviewsList: {
    marginTop: 24,
  },
  reviewsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  tabContent: {
    padding: 16,
  },
  listingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#020817",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1FAE5",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newListingButton: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    elevation: 2,
  },
  newListingButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
  listingsContainer: {
    marginBottom: 24,
  },
  ordersContainer: {
    marginBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginVertical: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
  },
  ordersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    position: "relative",
  },
  taxHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  ordersHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taxFiltersRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  taxFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  taxFilterPillActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  taxFilterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  taxFilterTextActive: {
    color: "white",
  },
  taxAnalyticsSection: {
    marginBottom: 16,
  },
  taxAnalyticsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  taxAnalyticsCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    overflow: "hidden",
  },
  taxAnalyticsCardWide: {
    flex: 0,
    width: "100%",
  },
  taxAnalyticsCardTotal: {
    borderColor: "#D1FAE5",
  },
  taxAnalyticsCardPaid: {
    borderColor: "#DBEAFE",
  },
  taxAnalyticsCardUnpaid: {
    borderColor: "#FDE68A",
  },
  taxAnalyticsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  taxAnalyticsLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  taxAnalyticsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#020817",
    marginTop: 6,
  },
  taxAnalyticsMeta: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 4,
  },
  taxAnalyticsIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  taxAnalyticsIconCircleTotal: {
    backgroundColor: "#DCFCE7",
  },
  taxAnalyticsIconCirclePaid: {
    backgroundColor: "#DBEAFE",
  },
  taxAnalyticsIconCircleUnpaid: {
    backgroundColor: "#FEF3C7",
  },
  taxAnalyticsIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  taxAnalyticsIconTotal: {
    tintColor: "#16A34A",
  },
  taxAnalyticsIconPaid: {
    tintColor: "#2563EB",
  },
  taxAnalyticsIconUnpaid: {
    tintColor: "#D97706",
  },
  taxProgressContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginBottom: 16,
  },
  taxProgressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    overflow: "hidden",
    flexDirection: "row",
  },
  taxProgressPaid: {
    height: "100%",
    backgroundColor: "#16A34A",
  },
  taxProgressUnpaid: {
    height: "100%",
    backgroundColor: "#F59E0B",
  },
  taxProgressLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  taxLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  taxLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  taxLegendDotPaid: {
    backgroundColor: "#16A34A",
  },
  taxLegendDotUnpaid: {
    backgroundColor: "#F59E0B",
  },
  taxLegendText: {
    fontSize: 12,
    color: "#64748B",
  },
  taxPaginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  taxPaginationText: {
    fontSize: 12,
    color: "#64748B",
  },
  taxLoadMoreButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#16A34A",
  },
  taxLoadMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  ordersFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ordersFilterContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ordersFilterIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  ordersFilterButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },
  ordersFilterMenu: {
    position: "absolute",
    top: 44,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    paddingVertical: 6,
    width: 200,
    zIndex: 10,
  },
  ordersFilterMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  ordersFilterMenuIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    resizeMode: "contain",
  },
  ordersFilterMenuLabel: {
    fontSize: 13,
    color: "#111827",
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
    flexDirection: "row",
    gap: 12,
    paddingRight: 8,
  },
  pendingItemContainer: {
    flex: 1,
  },
  optionsMenu: {
    position: "absolute",
    right: 16,
    top: 16,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
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
    color: "#111827",
  },
  emptyStateContainer: {
    padding: 24,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
  },
  // emptyStateText: {
  //   fontSize: 16,
  //   color: '#6B7280',
  // },
  bidHistoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  bidHistoryIcon: {
    width: 20,
    height: 20,
    tintColor: "#10B981",
  },
  bidHistoryTable: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 0.8,
    borderBottomColor: "#E5E7EB",
    paddingVertical: 14,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
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
