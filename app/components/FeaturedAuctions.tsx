import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, ImageSourcePropType, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getEndingSoonProducts, getFeaturedProducts, getNewlyListedProducts, getPopularProducts, Product } from '../../lib/firestore';
import { ProductCard } from './ProductCard';
import { ProductType } from './ProductCard.types';
import { ThemedText } from './ThemedText';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width minus padding

interface UICard {
  id: string;
  image: ImageSourcePropType;
  title: string;
  description: string;
  currentBid: number;
  timeLeft: string;
  bids: number;
  type: ProductType;
}

export function FeaturedAuctions() {
  const [activeFilter, setActiveFilter] = useState<ProductType>('Featured');

  const filterTabs = [
    {
      id: 1,
      label: 'Featured' as ProductType,
      icon: require('../../assets/images/icons/star.png'),
      color: '#16A34A'
    },
    {
      id: 2,
      label: 'Ending Soon' as ProductType,
      icon: require('../../assets/images/icons/clock.png'),
      color: '#EF4444'
    },
    {
      id: 3,
      label: 'Newly Listed' as ProductType,
      icon: require('../../assets/images/icons/tag.png'),
      color: '#6366F1'
    },
    {
      id: 4,
      label: 'Popular' as ProductType,
      icon: require('../../assets/images/icons/star-filled.png'),
      color: '#F59E0B'
    },
  ];

  const [cards, setCards] = useState<UICard[]>([]);

  const toCard = (p: Product, type: ProductType): UICard => {
    const imgUrl = Array.isArray(p.images) && p.images.length ? p.images[0] : (p.productImage || undefined);
    const image: ImageSourcePropType = imgUrl ? { uri: imgUrl as any } : require('../../assets/images/products/iphone.png');
    const title = p.title || 'Untitled';
    const description = p.description || '';
    const currentBid = Number(p.currentBid ?? p.price ?? 0);
    const bids = Number(p.bidCount ?? 0);
    const timeLeft = (() => {
      const end = p.auctionEndTime as any;
      const toDate = end?.toDate ? end.toDate() : (end instanceof Date ? end : end ? new Date(end) : null);
      if (toDate && toDate instanceof Date && !isNaN(toDate.getTime())) {
        const diff = toDate.getTime() - Date.now();
        if (diff <= 0) return 'Ended';
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return d > 0 ? `${d}d ${h}h` : `${h}h`;
      }
      return '—';
    })();
    return { id: p.id || '', image, title, description, currentBid, bids, timeLeft, type };
  };

  const load = React.useCallback(async (filter: ProductType) => {
    if (filter === 'Featured') {
      const list = await getFeaturedProducts(10);
      setCards(list.map((p) => toCard(p, 'Featured')));
    } else if (filter === 'Ending Soon') {
      const list = await getEndingSoonProducts(10);
      setCards(list.map((p) => toCard(p, 'Ending Soon')));
    } else if (filter === 'Newly Listed') {
      const list = await getNewlyListedProducts(10);
      setCards(list.map((p) => toCard(p, 'Newly Listed')));
    } else {
      const list = await getPopularProducts(10);
      setCards(list.map((p) => toCard(p, 'Popular')));
    }
  }, []);

  useEffect(() => {
    load(activeFilter).catch(() => setCards([]));
  }, [activeFilter, load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{activeFilter} Auctions</ThemedText>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push({ pathname: '/(tabs)/all-products', params: { filter: activeFilter } })}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Image
            source={require('../../assets/images/icons/more.png')}
            style={styles.arrowIcon}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.filterTab,
              activeFilter === tab.label && [styles.activeFilterTab, { backgroundColor: tab.color }]
            ]}
            onPress={() => setActiveFilter(tab.label)}
          >
            <Image
              source={tab.icon}
              style={[
                styles.filterIcon,
                activeFilter === tab.label && styles.activeFilterIcon
              ]}
            />
            <Text
              style={[
                styles.filterText,
                activeFilter === tab.label && styles.activeFilterText
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {cards.length === 0 ? (
        <View style={styles.emptyState}>
          <Image source={require('../../assets/images/icons/box.png')} style={styles.emptyIcon} />
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsContainer}
          pagingEnabled
          snapToInterval={CARD_WIDTH + 16}
          decelerationRate="fast"
        >
          {cards.map((product, index) => (
            <View key={index} style={styles.cardContainer}>
              <ProductCard
                image={product.image}
                title={product.title}
                description={product.description}
                currentBid={product.currentBid}
                timeLeft={product.timeLeft}
                bids={product.bids}
                type={product.type} id={product.id} />
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
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
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: '#16A34A',
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#4B5563',
  },
  activeFilterIcon: {
    tintColor: '#FFFFFF',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  productsContainer: {
    paddingHorizontal: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  activeFilterTab: {
    backgroundColor: '#16A34A',
  },
  emptyState: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 48,
    height: 48,
    tintColor: '#9CA3AF',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
