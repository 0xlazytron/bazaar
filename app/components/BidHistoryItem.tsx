import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface Props {
  itemName: string;
  amount: number;
  time: string;
  isHighestBid?: boolean;
  image: ImageSourcePropType;
}

export const BidHistoryItem = ({ itemName, amount, time, isHighestBid, image }: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Image source={image} style={styles.avatar} />
        <View>
          <ThemedText style={styles.name}>{itemName}</ThemedText>
          <ThemedText style={styles.time}>{time}</ThemedText>
        </View>
      </View>
      <View>
        <ThemedText style={[styles.amount, isHighestBid && styles.highestBid]}>
          Rs {amount.toLocaleString()}
        </ThemedText>
        {isHighestBid && (
          <View style={styles.badge}>
            <ThemedText style={styles.badgeText}>Highest bid</ThemedText>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.moreButton}>
        <Image 
          source={require('../../assets/images/icons/more.png')}
          style={styles.moreIcon}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020817',
  },
  time: {
    fontSize: 12,
    color: '#64748B',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020817',
    textAlign: 'right',
  },
  highestBid: {
    color: '#16A34A',
  },
  badge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F0FDF4',
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 12,
    color: '#16A34A',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  moreIcon: {
    width: 16,
    height: 16,
  },
}); 