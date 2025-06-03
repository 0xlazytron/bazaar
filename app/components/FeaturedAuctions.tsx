import { router } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, ImageSourcePropType, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProductCard } from './ProductCard';
import { ProductType } from './ProductCard.types';
import { ThemedText } from './ThemedText';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // Full width minus padding

interface Product {
  image: ImageSourcePropType;
  title: string;
  description: string;
  currentBid: number;
  buyNowPrice: number;
  timeLeft: string;
  bids: number;
  condition: 'New' | 'Used';
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

  const featuredProducts: Product[] = [
    {
      image: require('../../assets/images/products/iphone13.png'),
      title: "Apple iPhone 13 Pro Max - 256GB - Pacific Blue",
      description: "Excellent condition, 92% battery health, includes original accessories",
      currentBid: 24500,
      buyNowPrice: 32000,
      timeLeft: "2d 14h",
      bids: 18,
      condition: "Used",
      type: "Featured"
    },
    {
      image: require('../../assets/images/products/macbook.png'),
      title: "MacBook Pro 16-inch M1 Pro - Space Gray",
      description: "Like new, AppleCare+ until 2024, includes original box and charger",
      currentBid: 185000,
      buyNowPrice: 215000,
      timeLeft: "1d 8h",
      bids: 24,
      condition: "Used",
      type: "Featured"
    },
    {
      image: require('../../assets/images/products/apple-watch.png'),
      title: "Apple Watch Series 7 - 45mm GPS + Cellular",
      description: "Brand new in box, never opened, full warranty",
      currentBid: 45000,
      buyNowPrice: 52000,
      timeLeft: "3d 6h",
      bids: 12,
      condition: "New",
      type: "Featured"
    }
  ];

  const endingSoonProducts: Product[] = [
    {
      image: require('../../assets/images/products/macbook.png'),
      title: "MacBook Air M2 - Midnight",
      description: "8-core CPU, 10-core GPU, 16GB RAM, 512GB SSD",
      currentBid: 145000,
      buyNowPrice: 165000,
      timeLeft: "2h 30m",
      bids: 32,
      condition: "Used",
      type: "Ending Soon"
    },
    {
      image: require('../../assets/images/products/iphone13.png'),
      title: "iPhone 14 Pro - 128GB - Deep Purple",
      description: "Sealed in box, never opened, full warranty",
      currentBid: 135000,
      buyNowPrice: 150000,
      timeLeft: "4h 15m",
      bids: 28,
      condition: "New",
      type: "Ending Soon"
    }
  ];

  const newlyListedProducts: Product[] = [
    {
      image: require('../../assets/images/products/apple-watch.png'),
      title: "Apple Watch Ultra - Titanium Case",
      description: "49mm case, cellular, includes Alpine Loop band",
      currentBid: 85000,
      buyNowPrice: 95000,
      timeLeft: "6d 23h",
      bids: 3,
      condition: "New",
      type: "Newly Listed"
    },
    {
      image: require('../../assets/images/products/macbook.png'),
      title: "MacBook Pro 14-inch M2 Max",
      description: "32-core GPU, 32GB RAM, 1TB SSD, Space Gray",
      currentBid: 255000,
      buyNowPrice: 285000,
      timeLeft: "6d 22h",
      bids: 5,
      condition: "New",
      type: "Newly Listed"
    }
  ];

  const popularProducts: Product[] = [
    {
      image: require('../../assets/images/products/iphone13.png'),
      title: "iPhone 13 Mini - 256GB - Starlight",
      description: "Perfect condition, includes original box and accessories",
      currentBid: 75000,
      buyNowPrice: 85000,
      timeLeft: "3d 12h",
      bids: 45,
      condition: "Used",
      type: "Popular"
    },
    {
      image: require('../../assets/images/products/apple-watch.png'),
      title: "Apple Watch Series 8 - Stainless Steel",
      description: "45mm case, cellular, graphite color with Milanese loop",
      currentBid: 55000,
      buyNowPrice: 65000,
      timeLeft: "4d 8h",
      bids: 38,
      condition: "Used",
      type: "Popular"
    }
  ];

  const getProductsByFilter = () => {
    const products = {
      'Featured': featuredProducts,
      'Ending Soon': endingSoonProducts,
      'Newly Listed': newlyListedProducts,
      'Popular': popularProducts
    };
    return products[activeFilter];
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>{activeFilter} Auctions</ThemedText>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/all-categories')}
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

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}
        pagingEnabled
        snapToInterval={CARD_WIDTH + 16} // Card width + gap
        decelerationRate="fast"
      >
        {getProductsByFilter().map((product, index) => (
          <View key={index} style={styles.cardContainer}>
            <ProductCard 
              image={product.image}
              title={product.title}
              description={product.description}
              currentBid={product.currentBid}
              timeLeft={product.timeLeft}
              bids={product.bids}
              type={product.type}
            />
          </View>
        ))}
      </ScrollView>
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
}); 