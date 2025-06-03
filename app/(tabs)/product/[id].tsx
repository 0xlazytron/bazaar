import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
  const [activeTab, setActiveTab] = useState('details');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productImages = [
    require('@/assets/images/products/product-1.png'),
    require('@/assets/images/products/product-2.png'),
    require('@/assets/images/products/product-3.png'),
    require('@/assets/images/products/product-4.png'),
  ];

  const bidHistory = [
    {
      name: "John Deo",
      avatar: require('@/assets/images/avatar/profile.png'),
      amount: "Rs24,500",
      time: "2 hours ago",
      isHighest: true
    },
    {
      name: "Gushpoor",
      avatar: require('@/assets/images/avatar/profile.png'),
      amount: "Rs24,300",
      time: "3 hours ago",
      isHighest: false
    },
    {
      name: "Karim",
      avatar: require('@/assets/images/avatar/profile.png'),
      amount: "Rs24,100",
      time: "4 hours ago",
      isHighest: false
    }
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
        <Image 
          source={productImages[currentImageIndex]}
          style={styles.mainImage}
          resizeMode="cover"
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
            <Image 
              source={image}
              style={styles.thumbnail}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Info */}
      <View style={styles.productInfo}>
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title}>
            Apple iPhone 13 Pro{'\n'}
            Max - 256GB - Pacific{'\n'}
            Blue
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
            <ThemedText style={styles.badgeText}>Used</ThemedText>
          </View>
          <View style={styles.statusItem}>
            <Image 
              source={require('@/assets/images/icons/clock.png')}
              style={styles.statusIcon}
            />
            <ThemedText style={styles.statusTextRed}>2d 14h left</ThemedText>
          </View>
          <View style={styles.statusItem}>
            <Image 
              source={require('@/assets/images/icons/bid.png')}
              style={styles.statusIcon}
            />
            <ThemedText style={styles.statusTextAmber}>18 bids</ThemedText>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <View>
            <ThemedText style={styles.priceLabel}>Current bid</ThemedText>
            <ThemedText style={styles.currentPrice}>Rs 24,500</ThemedText>
          </View>
          <ThemedText style={styles.buyNowPrice}>Buy now: Rs 32,000</ThemedText>
        </View>

        {/* Bid Input */}
        <View style={styles.bidContainer}>
          <ThemedText style={styles.bidHint}>Enter at least Rs 24,501</ThemedText>
          <View style={styles.bidInputContainer}>
            <Image 
              source={require('@/assets/images/icons/rupee.png')}
              style={styles.rupeeIcon}
            />
            <TextInput
              style={styles.bidInput}
              placeholder="Rs 24,600 or more"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.placeBidButton}>
          <ThemedText style={styles.buttonText}>Place Bid</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton}>
          <ThemedText style={styles.buttonText}>Buy Now - Rs 32,000</ThemedText>
        </TouchableOpacity>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
              Product Details
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'seller' && styles.activeTab]}
            onPress={() => setActiveTab('seller')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'seller' && styles.activeTabText]}>
              Seller Profile
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        {activeTab === 'details' && (
          <View style={styles.detailsContainer}>
            <ThemedText style={styles.description}>
              Selling my iPhone 13 Pro Max that I bought{'\n'}
              last year. It's in excellent condition with no{'\n'}
              scratches or dents. The battery health is at{'\n'}
              92%. Comes with original box, charger, and{'\n'}
              unused earphones. 256GB storage capacity,{'\n'}
              Pacific Blue color.
            </ThemedText>
            <ThemedText style={styles.specTitle}>Technical specs:</ThemedText>
            <ThemedText style={styles.specItem}>- A15 Bionic chip</ThemedText>
            <ThemedText style={styles.specItem}>- ProMotion Super Retina XDR display</ThemedText>
            <ThemedText style={styles.specItem}>- Pro camera system with 3x optical zoom</ThemedText>
            <ThemedText style={styles.specItem}>- Cinematic mode video recording</ThemedText>
            <ThemedText style={styles.specItem}>- Up to 28 hours of video playback</ThemedText>

            {/* Additional Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Image 
                  source={require('@/assets/images/icons/delivery.png')}
                  style={styles.infoIcon}
                />
                <View>
                  <ThemedText style={styles.infoTitle}>Delivery Options</ThemedText>
                  <ThemedText style={styles.infoText}>Pickup or delivery (+Rs 500)</ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Image 
                  source={require('@/assets/images/icons/location.png')}
                  style={styles.infoIcon}
                />
                <View>
                  <ThemedText style={styles.infoTitle}>Location</ThemedText>
                  <ThemedText style={styles.infoText}>Port Louis, Mauritius</ThemedText>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Image 
                  source={require('@/assets/images/icons/payment.png')}
                  style={styles.infoIcon}
                />
                <View>
                  <ThemedText style={styles.infoTitle}>Payment Options</ThemedText>
                  <ThemedText style={styles.infoText}>Cash, Juice</ThemedText>
                </View>
              </View>
            </View>

            {/* Bid History */}
            <View style={styles.bidHistoryContainer}>
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
                {bidHistory.map((bid, index) => (
                  <View key={index} style={styles.bidHistoryRow}>
                    <View style={styles.bidderInfo}>
                      <Image 
                        source={bid.avatar}
                        style={styles.bidderAvatar}
                      />
                      <View>
                        <ThemedText style={styles.bidderName}>{bid.name}</ThemedText>
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
                        {bid.amount}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.bidTime}>{bid.time}</ThemedText>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Seller Profile */}
        {activeTab === 'seller' && (
          <View style={styles.sellerContainer}>
            <View style={styles.sellerHeader}>
              <Image 
                source={require('@/assets/images/seller-avatar.jpg')}
                style={styles.sellerAvatar}
              />
              <View style={styles.sellerInfo}>
                <View style={styles.ratingContainer}>
                  <Image 
                    source={require('@/assets/images/icons/star.png')}
                    style={styles.starIcon}
                  />
                  <ThemedText style={styles.ratingText}>
                    4.8/5.0 <ThemedText style={styles.positiveText}>(95% Positive)</ThemedText>
                  </ThemedText>
                </View>
                <ThemedText style={styles.memberSince}>Member since January 2022</ThemedText>
                <ThemedText style={styles.sellerLocation}>Port Louis, Mauritius</ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.contactButton}>
              <ThemedText style={styles.contactButtonText}>Contact Seller</ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  contactButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
}); 