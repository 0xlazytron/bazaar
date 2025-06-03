import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface Props {
  image: ImageSourcePropType;
  title: string;
  currentBid: number;
  buyNowPrice: number;
  timeLeft: string;
  bidsCount: number;
  condition: 'New' | 'Used';
  isNewListing?: boolean;
}

export const ListingCard = ({ 
  image, 
  title, 
  currentBid, 
  buyNowPrice, 
  timeLeft, 
  bidsCount, 
  condition,
  isNewListing 
}: Props) => {
  return (
    <TouchableOpacity style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} />
        <View style={[styles.badge, { backgroundColor: condition === 'New' ? '#DBEAFE' : '#FEF3C7' }]}>
          <ThemedText style={[styles.badgeText, { color: condition === 'New' ? '#1E40AF' : '#92400E' }]}>
            {condition}
          </ThemedText>
        </View>
        <TouchableOpacity style={styles.favoriteButton}>
          <Image 
            source={require('../../assets/images/icons/heart.png')}
            style={styles.favoriteIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        {isNewListing && (
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>New Listing</ThemedText>
          </View>
        )}
        <ThemedText style={styles.title} numberOfLines={2}>{title}</ThemedText>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <View>
            <ThemedText style={styles.priceLabel}>Current Bid</ThemedText>
            <ThemedText style={styles.currentBid}>Rs {currentBid.toLocaleString()}</ThemedText>
          </View>
          <View>
            <ThemedText style={styles.priceLabel}>Buy Now</ThemedText>
            <ThemedText style={styles.buyNowPrice}>Rs {buyNowPrice.toLocaleString()}</ThemedText>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Image 
              source={require('../../assets/images/icons/clock.png')}
              style={styles.statIcon}
            />
            <ThemedText style={styles.statText}>{timeLeft}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Image 
              source={require('../../assets/images/icons/hammer.png')}
              style={styles.statIcon}
            />
            <ThemedText style={styles.statText}>{bidsCount} bids</ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(8px)',
  },
  favoriteIcon: {
    width: 16,
    height: 16,
    tintColor: '#6B7280',
  },
  infoContainer: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F3FCF7',
    borderRadius: 9999,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#16A34A',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020817',
    marginBottom: 4,
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  currentBid: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  buyNowPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020817',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#64748B',
  },
}); 