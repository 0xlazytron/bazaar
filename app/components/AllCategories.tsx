import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './ThemedText';

interface Category {
  id: number;
  title: string;
  emoji: string;
  bgColor: string;
  listingsCount: number;
  subcategories: string[];
}

const categories: Category[] = [
  {
    id: 1,
    title: 'Electronics',
    emoji: '📱',
    bgColor: '#EFF6FF',
    listingsCount: 1245,
    subcategories: [
      'Phones & Tablets',
      'Computers & Laptops',
      'TV & Audio',
      'Cameras',
      'Accessories'
    ]
  },
  {
    id: 2,
    title: 'Furniture',
    emoji: '🪑',
    bgColor: '#FEF3C7',
    listingsCount: 853,
    subcategories: [
      'Sofas & Armchairs',
      'Tables & Chairs',
      'Beds & Mattresses',
      'Storage & Organization',
      'Garden Furniture'
    ]
  },
  {
    id: 3,
    title: 'Vehicles',
    emoji: '🚗',
    bgColor: '#FEE2E2',
    listingsCount: 426,
    subcategories: [
      'Cars',
      'Motorcycles',
      'Spare Parts & Accessories',
      'Boats & Watercraft',
      'Other Vehicles'
    ]
  },
  {
    id: 4,
    title: 'Clothing',
    emoji: '👕',
    bgColor: '#F3E8FF',
    listingsCount: 1089,
    subcategories: [
      'Men\'s Clothing',
      'Women\'s Clothing',
      'Kids\' Clothing',
      'Bags & Accessories',
      'Shoes'
    ]
  },
  {
    id: 5,
    title: 'Hobbies',
    emoji: '🎨',
    bgColor: '#ECFDF5',
    listingsCount: 738,
    subcategories: [
      'Books & Magazines',
      'Musical Instruments',
      'Collectibles',
      'Sports Equipment',
      'Toys & Games'
    ]
  },
  {
    id: 6,
    title: 'Home & Garden',
    emoji: '🏡',
    bgColor: '#F0FDF4',
    listingsCount: 574,
    subcategories: [
      'Appliances',
      'Kitchenware',
      'Home Decor',
      'Garden & Outdoor',
      'Tools & DIY'
    ]
  },
  {
    id: 7,
    title: 'Property',
    emoji: '🏢',
    bgColor: '#FFF7ED',
    listingsCount: 235,
    subcategories: [
      'For Rent',
      'For Sale',
      'Vacation Rentals',
      'Commercial Property',
      'Land'
    ]
  },
  {
    id: 8,
    title: 'Services',
    emoji: '🛠️',
    bgColor: '#F0F9FF',
    listingsCount: 329,
    subcategories: [
      'Trades & Construction',
      'Household Services',
      'Transport & Delivery',
      'Professional Services',
      'Events & Catering'
    ]
  }
];

function CategoryCard({ category }: { category: Category }) {
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={[styles.emojiContainer, { backgroundColor: category.bgColor }]}>
          <Text style={styles.emoji}>{category.emoji}</Text>
        </View>
        <View style={styles.categoryInfo}>
          <ThemedText style={styles.categoryTitle}>{category.title}</ThemedText>
          <Text style={styles.listingsCount}>{category.listingsCount} listings</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.subcategoriesList}>
        {category.subcategories.map((subcategory, index) => (
          <TouchableOpacity key={index} style={styles.subcategoryItem}>
            <Text style={styles.subcategoryText}>{subcategory}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function AllCategories() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Image 
          source={require('../../assets/images/icons/chevron-left.png')}
          style={styles.backIcon}
        />
        <Text style={styles.backText}>Back to home</Text>
      </TouchableOpacity>

      <ThemedText style={styles.title}>All Categories</ThemedText>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesContainer}>
          {categories.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  backIcon: {
    width: 16,
    height: 16,
    tintColor: '#4B5563',
    marginRight: 4,
  },
  backText: {
    fontSize: 14,
    color: '#4B5563',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#020817',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    gap: 24,
    paddingBottom: 24,
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  categoryInfo: {
    marginLeft: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#020817',
  },
  listingsCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  subcategoriesList: {
    padding: 12,
  },
  subcategoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 14,
  },
  subcategoryText: {
    fontSize: 14,
    color: '#4B5563',
  },
}); 