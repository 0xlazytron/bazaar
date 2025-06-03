import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProductCardProps } from './ProductCard.types';

const tagColors = {
  'Featured': '#16A34A',
  'Ending Soon': '#EF4444',
  'Newly Listed': '#6366F1',
  'Popular': '#F59E0B'
};

export const ProductCard = ({ 
  image, 
  title, 
  description, 
  currentBid, 
  timeLeft, 
  bids,
  type 
}: ProductCardProps) => {
  return (
    <TouchableOpacity style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {type && (
          <View style={[styles.tagBadge, { backgroundColor: tagColors[type] }]}>
            <Text style={styles.tagText}>{type}</Text>
          </View>
        )}
        <Image source={image} style={styles.image} />
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>{description}</Text>

        {/* Current Bid */}
        <View style={styles.bidContainer}>
          <Text style={styles.bidLabel}>Current Bid</Text>
          <Text style={styles.bidAmount}>Rs {currentBid.toLocaleString()}</Text>
        </View>

        {/* Time & Bids */}
        <View style={styles.statsContainer}>
          <View style={styles.timeContainer}>
            <Image 
              source={require('../../assets/images/icons/clock.png')}
              style={styles.icon}
            />
            <Text style={styles.timeText}>{timeLeft}</Text>
          </View>
          <View style={styles.bidsContainer}>
            <Image 
              source={require('../../assets/images/icons/hammer.png')}
              style={styles.icon}
            />
            <Text style={styles.bidsText}>{bids} bids</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  tagBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020817',
    marginBottom: 4,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  bidContainer: {
    marginBottom: 16,
  },
  bidLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  bidAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#16A34A',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bidsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  icon: {
    width: 16,
    height: 16,
    tintColor: '#64748B',
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
  },
  bidsText: {
    fontSize: 14,
    color: '#64748B',
  },
}); 