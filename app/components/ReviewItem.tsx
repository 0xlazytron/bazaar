import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface Props {
  name: string;
  avatar: ImageSourcePropType;
  time: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  comment: string;
}

export const ReviewItem = ({ name, avatar, time, sentiment, comment }: Props) => {
  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return require('@/assets/images/icons/happy.png');
      case 'neutral':
        return require('@/assets/images/icons/neutral.png');
      case 'negative':
        return require('@/assets/images/icons/sad.png');
    }
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case 'positive':
        return '#16A34A';
      case 'neutral':
        return '#F59E0B';
      case 'negative':
        return '#EF4444';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={avatar} style={styles.avatar} />
          <View>
            <ThemedText style={styles.name}>{name}</ThemedText>
            <View style={styles.sentimentContainer}>
              <Image source={getSentimentIcon()} style={styles.sentimentIcon} />
              <ThemedText style={[styles.sentiment, { color: getSentimentColor() }]}>
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </ThemedText>
              <ThemedText style={styles.time}>{time}</ThemedText>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Image 
            source={require('@/assets/images/icons/more.png')}
            style={styles.moreIcon}
          />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.comment}>{comment}</ThemedText>
      <View style={styles.divider} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  sentimentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sentimentIcon: {
    width: 16,
    height: 16,
  },
  sentiment: {
    fontSize: 12,
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    color: '#64748B',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIcon: {
    width: 16,
    height: 16,
  },
  comment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
}); 