/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BiddingModals } from '@/app/components/BiddingModals';
import { ImageWithLoader } from '@/app/components/ImageWithLoader';
import { ThemedText } from '@/components/ThemedText';
import { getCurrentUser, getUserProfile, UserProfile } from '@/lib/auth';
import { Bid, createOrder, getBidHistory, getProduct, placeBid, Product, updateProduct } from '@/lib/firestore';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { User } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const PRODUCT_IMAGE_HEIGHT = 384;
const THUMBNAIL_SIZE = 80;

export default function ProductDetails() {
  const router = useRouter();
  const { id, highlightBid } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [placeBidVisible, setPlaceBidVisible] = useState(false);
  const [confirmBidVisible, setConfirmBidVisible] = useState(false);
  const [bidPlacedVisible, setBidPlacedVisible] = useState(false);
  const [buyNowVisible, setBuyNowVisible] = useState(false);
  const [confirmPurchaseVisible, setConfirmPurchaseVisible] = useState(false);

  // Payment and delivery state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'juice'>('cash');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCost] = useState(500); // Fixed delivery cost

  // New state for real product data
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<UserProfile | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [placingBid, setPlacingBid] = useState(false);
  const [newlyPlacedBidId, setNewlyPlacedBidId] = useState<string | null>(null);
  const [highlightedBidId, setHighlightedBidId] = useState<string | null>(null);

  const formatMemberSince = (value: any) => {
    if (!value) return 'Unknown';
    const date = value?.toDate ? value.toDate() : (value instanceof Date ? value : new Date(value));
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const monthsTotal = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    const years = Math.floor(monthsTotal / 12);
    const months = monthsTotal % 12;
    const relative = years > 0 ? `${years}y${months ? ` ${months}m` : ''}` : `${months}m`;
    const formatted = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `${formatted} • ${relative} ago`;
  };

  // Refs for auto-scroll functionality
  const scrollViewRef = useRef<ScrollView>(null);
  const bidHistoryRef = useRef<View>(null);
  const hasDelistedRef = useRef(false);

  useEffect(() => {
    const fetchProductAndUser = async () => {
      try {
        setLoading(true);

        // Get current user
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Fetch product data
        if (id && typeof id === 'string') {
          const productData = await getProduct(id);
          if (productData) {
            setProduct(productData);
            // Check if current user is the owner
            setIsOwner(currentUser?.uid === productData.sellerId);

            // Fetch seller profile
            try {
              const seller = await getUserProfile(productData.sellerId);
              setSellerProfile(seller);
            } catch (error) {
              console.error('Error fetching seller profile:', error);
            }

            // Fetch bid history
            try {
              const bids = await getBidHistory(id);
              setBidHistory(bids);
            } catch (error) {
              console.error('Error fetching bid history:', error);
            }
          } else {
            Alert.alert('Error', 'Product not found');
            router.back();
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        Alert.alert('Error', 'Failed to load product details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndUser();
  }, [id]);

  // Handle bid highlighting from navigation
  useEffect(() => {
    if (highlightBid && typeof highlightBid === 'string') {
      setHighlightedBidId(highlightBid);
      setActiveTab('seller'); // Switch to seller tab where bid history is shown

      // Auto-scroll to bid history section after a short delay
      const scrollTimer = setTimeout(() => {
        if (bidHistoryRef.current && scrollViewRef.current) {
          bidHistoryRef.current.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({
                y: y - 50, // Offset to show some content above
                animated: true,
              });
            },
            () => {
              // Fallback: scroll to a reasonable position
              scrollViewRef.current?.scrollTo({
                y: 600, // Approximate position of bid history
                animated: true,
              });
            }
          );
        }
      }, 100); // Small delay to ensure tab switch is complete

      // Clear highlight after 3 seconds
      const highlightTimer = setTimeout(() => {
        setHighlightedBidId(null);
      }, 3000);

      return () => {
        clearTimeout(scrollTimer);
        clearTimeout(highlightTimer);
      };
    }
  }, [highlightBid]);

  const handlePlaceBid = () => {
    setPlaceBidVisible(true);
  };

  const handleReviewBid = () => {
    // Check if user is authenticated
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to place a bid');
      return;
    }

    // Check if user is trying to bid on their own product
    if (isOwner) {
      Alert.alert('Error', 'You cannot bid on your own product');
      return;
    }

    // Validate bid amount
    if (!bidAmount || isNaN(Number(bidAmount))) {
      Alert.alert('Error', 'Please enter a valid bid amount');
      return;
    }

    const bidAmountNum = Number(bidAmount);
    const currentBidNum = Number(product?.currentBid || product?.price || 0);

    if (bidAmountNum <= currentBidNum) {
      Alert.alert('Error', `Bid must be higher than current bid of Rs ${currentBidNum}`);
      return;
    }

    // Check minimum bid increment (at least Rs 1 more than current bid)
    if (bidAmountNum < currentBidNum + 1) {
      Alert.alert('Error', `Minimum bid is Rs ${currentBidNum + 1}`);
      return;
    }

    // Check for reasonable maximum bid (optional safety check)
    if (bidAmountNum > 10000000) { // 1 crore limit
      Alert.alert('Error', 'Bid amount seems unusually high. Please verify the amount.');
      return;
    }

    setPlaceBidVisible(false);
    setConfirmBidVisible(true);
  };

  const handleBuyNow = () => {
    // Check if user is authenticated
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to purchase this item');
      return;
    }

    // Check if user is trying to buy their own product
    if (isOwner) {
      Alert.alert('Error', 'You cannot purchase your own product');
      return;
    }

    // Check if product is available
    if (product?.status !== 'active') {
      Alert.alert('Error', 'This product is no longer available for purchase');
      return;
    }

    setBuyNowVisible(true);
  };

  const handleContinueToPurchase = () => {
    // Validate delivery address if delivery is selected
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      Alert.alert('Error', 'Please enter a delivery address');
      return;
    }

    setBuyNowVisible(false);
    setConfirmPurchaseVisible(true);
  };

  const handleConfirmBid = async () => {
    if (placingBid) return; // Prevent multiple submissions

    try {
      setPlacingBid(true);

      if (!user || !product) {
        Alert.alert('Error', 'Please sign in to place a bid');
        return;
      }

      if (!bidAmount || isNaN(Number(bidAmount))) {
        Alert.alert('Error', 'Please enter a valid bid amount');
        return;
      }

      const bidAmountNum = Number(bidAmount);
      const currentBidNum = Number(product.currentBid || product.price || 0);

      if (bidAmountNum <= currentBidNum) {
        Alert.alert('Error', `Bid must be higher than current bid of Rs ${currentBidNum}`);
        return;
      }

      // Get user profile for bidder name
      const userProfile = await getUserProfile(user.uid);

      const newBidId = await placeBid({
        productId: product.id!,
        bidderId: user.uid,
        bidderName: userProfile?.displayName || userProfile?.email || 'Anonymous',
        bidderAvatar: userProfile?.photoURL || '',
        amount: bidAmountNum,
      });

      // Store the newly placed bid ID for highlighting
      setNewlyPlacedBidId(newBidId);

      // Update local product state
      setProduct(prev => prev ? {
        ...prev,
        currentBid: bidAmountNum,
        bidCount: (prev.bidCount || 0) + 1
      } : null);

      // Refresh bid history
      if (product?.id) {
        try {
          const updatedBids = await getBidHistory(product.id);
          setBidHistory(updatedBids);
        } catch (error) {
          console.error('Error refreshing bid history:', error);
        }
      }

      setConfirmBidVisible(false);
      setBidPlacedVisible(true);
      setBidAmount(''); // Clear bid amount
    } catch (error) {
      console.error('Error placing bid:', error);

      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('offline')) {
          Alert.alert('Network Error', 'Please check your internet connection and try again.');
        } else if (error.message.includes('permission')) {
          Alert.alert('Permission Error', 'You do not have permission to place this bid.');
        } else if (error.message.includes('auction ended')) {
          Alert.alert('Auction Ended', 'This auction has already ended.');
        } else {
          Alert.alert('Error', error.message);
        }
      } else {
        Alert.alert('Error', 'Failed to place bid. Please try again.');
      }
    } finally {
      setPlacingBid(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!user || !product) {
      Alert.alert('Error', 'Unable to complete purchase. Please try again.');
      return;
    }

    try {
      setPlacingBid(true); // Reuse loading state for purchase

      // Calculate total amount
      const itemPrice = parseInt(product.price.toString());
      const totalAmount = itemPrice + (deliveryMethod === 'delivery' ? deliveryCost : 0);

      const buyerName = user.displayName || user.email || 'Buyer';
      const buyerEmail = user.email || '';
      const sellerName = product.sellerName || 'Seller';

      const orderId = await createOrder({
        productId: product.id!,
        buyerId: user.uid,
        buyerName,
        buyerEmail,
        sellerId: product.sellerId,
        sellerName,
        productTitle: product.title || 'Product',
        productImage: product.images?.[0],
        itemPrice,
        deliveryCost: deliveryMethod === 'delivery' ? deliveryCost : 0,
        totalAmount,
        paymentMethod,
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress : '',
        status: 'pending',
      });

      setProduct(prev => prev ? { ...prev, status: 'pending_delivery' } : null);

      setConfirmPurchaseVisible(false);

      Alert.alert(
        'Purchase Successful!',
        `Your order has been placed successfully. Order ID: ${orderId.substring(0, 8)}...\n\nThe seller will contact you soon to arrange ${deliveryMethod === 'pickup' ? 'pickup' : 'delivery'}.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

    } catch (error) {
      console.error('Error completing purchase:', error);

      if (error instanceof Error) {
        Alert.alert('Purchase Failed', error.message);
      } else {
        Alert.alert('Purchase Failed', 'Unable to complete your purchase. Please try again.');
      }
    } finally {
      setPlacingBid(false);
    }
  };

  const handleLocationPicker = async () => {
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable location permissions to use this feature.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show loading state
      Alert.alert('Getting Location', 'Please wait while we get your current location...');

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const formattedAddress = [
          address.streetNumber,
          address.street,
          address.district,
          address.city,
          address.region,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(', ');

        setDeliveryAddress(formattedAddress);
        Alert.alert('Location Found', 'Your current address has been filled in.');
      } else {
        Alert.alert('Location Error', 'Unable to get address for your current location.');
      }
    } catch (error) {
      console.error('Location picker error:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please enter your address manually.'
      );
    }
  };

  const handleViewBids = () => {
    // Close the bid placed modal first
    setBidPlacedVisible(false);

    // Stay on details tab where bid history is located
    setActiveTab('details');

    // Scroll to bid history section
    if (bidHistoryRef.current && scrollViewRef.current) {
      bidHistoryRef.current.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: y - 50, // Offset to show some content above
            animated: true,
          });
        },
        () => {
          // Fallback scroll position if measureLayout fails
          scrollViewRef.current?.scrollTo({
            y: 600, // Approximate position of bid history
            animated: true,
          });
        }
      );
    }

    // Highlight the newly placed bid if available
    if (newlyPlacedBidId) {
      setHighlightedBidId(newlyPlacedBidId);

      // Clear the highlight after a few seconds
      setTimeout(() => {
        setHighlightedBidId(null);
        setNewlyPlacedBidId(null);
      }, 3000);
    }
  };

  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const updateTime = () => {
      if (!product) {
        setTimeLeft('');
        return;
      }
      if (product.pricingType === 'Fixed Price (Buy Now)') {
        setTimeLeft('Buy Now');
        return;
      }
      const isAuctionType = product.pricingType?.includes('Auction') || product.pricingType === 'both';
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
        if (!hasDelistedRef.current && product.status === 'active') {
          hasDelistedRef.current = true;
          updateProduct(product.id!, { status: 'inactive' }).catch(() => { });
          setProduct(prev => prev ? { ...prev, status: 'inactive' } : null);
        }
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s left`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s left`);
      } else {
        setTimeLeft(`${seconds}s left`);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [product?.auctionEndTime, product?.pricingType, product?.status]);

  // Get product images or use fallback
  const productImages = product?.images && product.images.length > 0
    ? product.images.map(url => ({ uri: url }))
    : [
      require('@/assets/images/products/product-1.png'),
      require('@/assets/images/products/product-2.png'),
      require('@/assets/images/products/product-3.png'),
      require('@/assets/images/products/product-4.png'),
    ];

  // Show loading screen while fetching data
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#22C55E" />
        <ThemedText style={styles.loadingText}>Loading product details...</ThemedText>
      </View>
    );
  }

  // Show error if product not found
  if (!product) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ThemedText style={styles.errorText}>Product not found</ThemedText>
      </View>
    );
  }

  // Check if product is auction type
  const isAuction = product.pricingType?.includes('Auction') || product.pricingType === 'both';

  // Helper function to format time
  const formatTimeAgo = (timestamp: any) => {
    const now = new Date();
    const bidTime = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - bidTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Image
          source={require('@/assets/images/icons/back-arrow.png')}
          style={styles.backIcon}
        />
        <ThemedText style={styles.backText}>Back to listings</ThemedText>
      </TouchableOpacity>

      {/* Product Images */}
      <View style={styles.imageContainer}>
        <ImageWithLoader
          source={productImages[currentImageIndex]}
          style={styles.mainImage}
          resizeMode="cover"
          debugLabel={`Product Main Image ${currentImageIndex + 1}`}
        />

        {/* Image Navigation */}
        <TouchableOpacity
          style={[styles.imageNav, styles.imageNavLeft]}
          onPress={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : productImages.length - 1)}
        >
          <Image
            source={require('@/assets/images/icons/back-arrow.png')}
            style={styles.navIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.imageNav, styles.imageNavRight]}
          onPress={() => setCurrentImageIndex(prev => (prev + 1) % productImages.length)}
        >
          <Image
            source={require('@/assets/images/icons/back-arrow.png')}
            style={[styles.navIcon, styles.navIconRight]}
          />
        </TouchableOpacity>

        {/* Image Dots */}
        <View style={styles.imageDots}>
          {productImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentImageIndex && styles.activeDot
              ]}
            />
          ))}
        </View>
      </View>

      {/* Thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.thumbnailContainer}
        contentContainerStyle={styles.thumbnailContent}
      >
        {productImages.map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setCurrentImageIndex(index)}
            style={[
              styles.thumbnailWrapper,
              index === currentImageIndex && styles.activeThumbnail
            ]}
          >
            <ImageWithLoader
              source={image}
              style={styles.thumbnail}
              loaderSize="small"
              debugLabel={`Product Thumbnail ${index + 1}`}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>
            {product.title || product.data || 'Product Title'}
          </ThemedText>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <Image
                source={require('@/assets/images/icons/favorite.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Image
                source={require('@/assets/images/icons/share.png')}
                style={styles.actionIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Product Status */}
        <View style={styles.statusContainer}>
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>{product.condition || product.itemCondition || 'Used'}</ThemedText>
          </View>
          {/* Show auction timer and bid count for auction items and "Both" pricing type */}
          {(isAuction || product.pricingType?.includes('Both')) && (
            <>
              <View style={styles.statusItem}>
                <Image
                  source={require('@/assets/images/icons/clock.png')}
                  style={styles.statusIcon}
                />
                <ThemedText style={styles.statusTextRed}>{timeLeft}</ThemedText>
              </View>
              <View style={styles.statusItem}>
                <Image
                  source={require('@/assets/images/icons/bid.png')}
                  style={styles.statusIcon}
                />
                <ThemedText style={styles.statusTextAmber}>{product.bidCount || 0} bids</ThemedText>
              </View>
            </>
          )}
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          {isAuction ? (
            <View>
              <ThemedText style={styles.priceLabel}>Current bid</ThemedText>
              <ThemedText style={styles.currentPrice}>Rs {product.currentBid || product.price}</ThemedText>
            </View>
          ) : (
            <View>
              <ThemedText style={styles.priceLabel}>Price</ThemedText>
              <ThemedText style={styles.currentPrice}>Rs {product.price}</ThemedText>
            </View>
          )}
          {(product.status === 'active' && (product.pricingType === 'Fixed Price (Buy Now)' || product.pricingType?.includes('Both') || product.pricingType === 'both')) && (
            <ThemedText style={styles.buyNowPrice}>Buy now: Rs {product.price}</ThemedText>
          )}
        </View>

        {/* Bid Actions - Only show if user is not the owner */}
        {!isOwner && (
          <View style={styles.bidContainer}>
            {/* Auction (7 days) - Show bid input and Place Bid button only */}
            {product.pricingType?.startsWith('Auction') && (
              <>
                <ThemedText style={styles.bidHint}>
                  Enter at least Rs {(Number(product.currentBid || product.price) + 1)}
                </ThemedText>
                <View style={styles.bidInputContainer}>
                  <Image
                    source={require('@/assets/images/icons/rupee.png')}
                    style={styles.rupeeIcon}
                  />
                  <TextInput
                    style={styles.bidInput}
                    placeholder="Enter your bid"
                    value={bidAmount}
                    onChangeText={setBidAmount}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity
                  style={styles.placeBidButton}
                  onPress={handlePlaceBid}
                >
                  <ThemedText style={styles.placeBidText}>Place Bid</ThemedText>
                </TouchableOpacity>
              </>
            )}

            {/* Fixed Price (Buy Now) - Show Buy Now button only, hide bid input */}
            {product.status === 'active' && product.pricingType === 'Fixed Price (Buy Now)' && (
              <TouchableOpacity
                style={styles.buyNowButton}
                onPress={handleBuyNow}
              >
                <ThemedText style={styles.buyNowText}>Buy Now</ThemedText>
              </TouchableOpacity>
            )}

            {/* Both (Auction with Buy Now option) - Show both bid input and Buy Now button */}
            {(product.status === 'active' && (product.pricingType === 'Both (Auction with Buy Now option)'
              || product.pricingType === 'Both (Auction with Buy Now Option 7 days)'
              || product.pricingType === 'Both (Auction with Buy Now Option 1 day)')) && (
                <>
                  <ThemedText style={styles.bidHint}>
                    Enter at least Rs {(Number(product.currentBid || product.price) + 1)}
                  </ThemedText>
                  <View style={styles.bidInputContainer}>
                    <Image
                      source={require('@/assets/images/icons/rupee.png')}
                      style={styles.rupeeIcon}
                    />
                    <TextInput
                      style={styles.bidInput}
                      placeholder="Enter your bid"
                      value={bidAmount}
                      onChangeText={setBidAmount}
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.placeBidButton}
                    onPress={handlePlaceBid}
                  >
                    <ThemedText style={styles.placeBidText}>Place Bid</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buyNowButton, styles.buyNowButtonWithMargin]}
                    onPress={handleBuyNow}
                  >
                    <ThemedText style={styles.buyNowText}>Buy Now</ThemedText>
                  </TouchableOpacity>
                </>
              )}
          </View>
        )}

        {/* Owner message */}
        {isOwner && (
          <View style={styles.ownerContainer}>
            <ThemedText style={styles.ownerText}>
              This is your listing. You cannot bid on your own item.
            </ThemedText>
          </View>
        )}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Details
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'seller' && styles.activeTab]}
            onPress={() => setActiveTab('seller')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'seller' && styles.activeTabText]}>
              Seller
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <View style={styles.detailsContainer}>
            <ThemedText style={styles.description}>
              {product.description || product.data || 'No description available'}
            </ThemedText>

            {/* Additional Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Image
                  source={require('@/assets/images/icons/delivery.png')}
                  style={styles.infoIcon}
                />
                <View>
                  <ThemedText style={styles.infoTitle}>Delivery Options</ThemedText>
                  <ThemedText style={styles.infoText}>
                    {product.deliveryOption || 'Pickup or delivery'}
                    {product.deliveryCost ? ` (+Rs ${product.deliveryCost})` : ''}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Image
                  source={require('@/assets/images/icons/location.png')}
                  style={styles.infoIcon}
                />
                <View>
                  <ThemedText style={styles.infoTitle}>Location</ThemedText>
                  <ThemedText style={styles.infoText}>
                    {product.pickupLocation || product.location || 'Location not specified'}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Image
                  source={require('@/assets/images/icons/payment.png')}
                  style={styles.infoIcon}
                />
                <View>
                  <ThemedText style={styles.infoTitle}>Payment Options</ThemedText>
                  <ThemedText style={styles.infoText}>
                    {product.paymentOption || 'Cash, Juice'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Bid History - Show for auction items and "Both" pricing type */}
            {(isAuction || product.pricingType?.includes('Both')) && (
              <View ref={bidHistoryRef} style={styles.bidHistoryContainer}>
                <View style={styles.bidHistoryHeader}>
                  <Image
                    source={require('@/assets/images/icons/bid-history.png')}
                    style={styles.bidHistoryIcon}
                  />
                  <ThemedText style={styles.bidHistoryTitle}>Bid History</ThemedText>
                </View>
                <View style={styles.bidHistoryTable}>
                  <View style={styles.bidHistoryTableHeader}>
                    <ThemedText style={styles.tableHeaderText}>Bidder</ThemedText>
                    <ThemedText style={styles.tableHeaderText}>Amount</ThemedText>
                    <ThemedText style={styles.tableHeaderText}>Time</ThemedText>
                  </View>
                  {/* Bid History Items */}
                  {bidHistory.length > 0 ? bidHistory.map((bid, index) => (
                    <View
                      key={bid.id || index}
                      style={[
                        styles.bidHistoryRow,
                        highlightedBidId === bid.id && styles.highlightedBidRow
                      ]}
                    >
                      <View style={styles.bidderInfo}>
                        <Image
                          source={bid.bidderAvatar ? { uri: bid.bidderAvatar } : require('@/assets/images/avatar/profile.png')}
                          style={styles.bidderAvatar}
                        />
                        <View>
                          <ThemedText style={styles.bidderName}>{bid.bidderName}</ThemedText>
                          {bid.isHighest && (
                            <View style={styles.highestBidBadge}>
                              <ThemedText style={styles.highestBidText}>Highest Bid</ThemedText>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.bidAmount}>
                        <Image
                          source={require('@/assets/images/icons/arrow-up.png')}
                          style={[styles.arrowIcon, bid.isHighest && styles.greenArrow]}
                        />
                        <ThemedText style={[styles.amountText, bid.isHighest && styles.greenAmount]}>
                          Rs {bid.amount.toLocaleString()}
                        </ThemedText>
                      </View>
                      <ThemedText style={styles.bidTime}>{formatTimeAgo(bid.createdAt)}</ThemedText>
                    </View>
                  )) : (
                    <View style={styles.noBidsContainer}>
                      <ThemedText style={styles.noBidsText}>No bids yet. Be the first to bid!</ThemedText>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Seller Profile */}
        {activeTab === 'seller' && (
          <View style={styles.sellerContainer}>
            <View style={styles.sellerHeader}>
              <Image
                source={sellerProfile?.photoURL ? { uri: sellerProfile.photoURL } : require('@/assets/images/seller-avatar.jpg')}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerInfo}>
                <ThemedText style={styles.sellerName}>
                  {sellerProfile?.displayName || product.sellerName || 'Anonymous Seller'}
                </ThemedText>
                <View style={styles.ratingContainer}>
                  <Image
                    source={require('@/assets/images/icons/star.png')}
                    style={styles.starIcon}
                  />
                  <ThemedText style={styles.ratingText}>
                    4.8/5.0 <ThemedText style={styles.positiveText}>(95% Positive)</ThemedText>
                  </ThemedText>
                </View>
                <ThemedText style={styles.memberSince}>
                  {`Member since ${formatMemberSince(sellerProfile?.createdAt)}`}
                </ThemedText>
                <ThemedText style={styles.sellerLocation}>
                  {product.pickupLocation || product.location || 'Location not specified'}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.contactButton, isOwner && styles.contactButtonDisabled]}
              disabled={isOwner}
              onPress={() => {
                if (!product || isOwner) return;
                const sellerName = sellerProfile?.displayName || product.sellerName || 'Seller';
                const sellerAvatar = sellerProfile?.photoURL || '';
                router.push(
                  `/(tabs)/message/${product.sellerId}?name=${encodeURIComponent(sellerName)}&avatar=${encodeURIComponent(sellerAvatar)}&online=true&productId=${product.id}&productTitle=${encodeURIComponent(product.title || '')}&productImage=${encodeURIComponent(product.images?.[0] || '')}&productPrice=${encodeURIComponent(product.price?.toString() || '0')}`
                );
              }}
            >
              <ThemedText style={[styles.contactButtonText, isOwner && styles.contactButtonTextDisabled]}>Contact Seller</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bidding Modals */}
      <BiddingModals
        placeBidVisible={placeBidVisible}
        confirmBidVisible={confirmBidVisible}
        bidPlacedVisible={bidPlacedVisible}
        buyNowVisible={buyNowVisible}
        confirmPurchaseVisible={confirmPurchaseVisible}
        bidAmount={bidAmount}
        productTitle={product.title || 'Product'}
        currentBid={product.currentBid?.toString() || product.price?.toString() || '0'}
        itemPrice={product.price?.toString() || '0'}
        placingBid={placingBid}
        paymentMethod={paymentMethod}
        deliveryMethod={deliveryMethod}
        deliveryAddress={deliveryAddress}
        deliveryCost={deliveryCost}
        onBidAmountChange={setBidAmount}
        onClosePlaceBid={() => setPlaceBidVisible(false)}
        onCloseConfirmBid={() => setConfirmBidVisible(false)}
        onCloseBidPlaced={() => setBidPlacedVisible(false)}
        onCloseBuyNow={() => setBuyNowVisible(false)}
        onCloseConfirmPurchase={() => setConfirmPurchaseVisible(false)}
        onPlaceBid={handleReviewBid}
        onConfirmBid={handleConfirmBid}
        onBuyNow={handleContinueToPurchase}
        onConfirmPurchase={handleConfirmPurchase}
        onViewBids={handleViewBids}
        onPaymentMethodChange={setPaymentMethod}
        onDeliveryMethodChange={setDeliveryMethod}
        onDeliveryAddressChange={setDeliveryAddress}
        onLocationPicker={handleLocationPicker}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 24,
    marginLeft: 16,
  },
  backIcon: {
    width: 16,
    height: 16,
    tintColor: '#4B5563',
  },
  backText: {
    fontSize: 14,
    color: '#4B5563',
  },
  imageContainer: {
    height: PRODUCT_IMAGE_HEIGHT,
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageNav: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',

  },
  imageNavLeft: {
    left: 8,
  },
  imageNavRight: {
    right: 8,
  },
  navIcon: {
    width: 20,
    height: 20,
    tintColor: '#1F2937',
  },
  navIconRight: {
    transform: [{ rotate: '180deg' }],
  },
  imageDots: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  activeDot: {
    backgroundColor: '#16A34A',
  },
  thumbnailContainer: {
    marginTop: 16,
  },
  thumbnailContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnailWrapper: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeThumbnail: {
    borderColor: '#16A34A',
    borderWidth: 2,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
    lineHeight: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    width: 16,
    height: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 17,
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 3,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIcon: {
    width: 14,
    height: 14,
  },
  statusTextRed: {
    fontSize: 14,
    color: '#EF4444',
  },
  statusTextAmber: {
    fontSize: 14,
    color: '#F59E0B',
  },
  pricingContainer: {
    marginTop: 16,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  currentPrice: {
    fontSize: 30,
    lineHeight: 30,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  buyNowPrice: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  bidContainer: {
    marginTop: 16,
  },
  bidHint: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  rupeeIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  bidInput: {
    flex: 1,
    fontSize: 16,
    color: '#020817',
  },
  placeBidButton: {
    height: 44,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buyNowButton: {
    height: 40,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buyNowButtonWithMargin: {
    marginTop: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    marginTop: 24,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  activeTabText: {
    color: '#020817',
  },
  detailsContainer: {
    marginTop: 16,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  specTitle: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 16,
  },
  specItem: {
    fontSize: 16,
    color: '#4B5563',
    marginTop: 8,
  },
  infoSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 18,
    height: 18,
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#020817',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#020817',
  },
  noBidsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  noBidsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
  },
  bidHistoryContainer: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
  },
  bidHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bidHistoryIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  bidHistoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#020817',
  },
  bidHistoryTable: {
    backgroundColor: '#FFFFFF',
  },
  bidHistoryTableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    flex: 1,
    paddingHorizontal: 16,
  },
  bidHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'rgba(242, 252, 226, 0.2)',
  },
  highlightedBidRow: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bidderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  bidderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  bidderName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#020817',
  },
  highestBidBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  highestBidText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  bidAmount: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  arrowIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  greenArrow: {
    tintColor: '#16A34A',
  },
  amountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#020817',
  },
  greenAmount: {
    color: '#16A34A',
  },
  bidTime: {
    flex: 1,
    fontSize: 10,
    color: '#6B7280',
    paddingHorizontal: 16,
  },
  sellerContainer: {
    marginTop: 16,
  },
  sellerHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F3F4F6',
  },
  sellerInfo: {
    marginLeft: 16,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  positiveText: {
    fontWeight: '600',
    color: '#F59E0B',
  },
  memberSince: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 4,
  },
  sellerLocation: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 4,
  },
  contactButton: {
    height: 41,
    borderWidth: 2,
    borderColor: '#16A34A',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonDisabled: {
    opacity: 0.5,
    borderColor: '#9CA3AF',
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  contactButtonTextDisabled: {
    color: '#9CA3AF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  ownerContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  ownerText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    fontWeight: '500',
  },
  placeBidText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
