import { router } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FeaturedAuctions } from '../components/FeaturedAuctions';
import { ThemedText } from '../components/ThemedText';
import { TopHeader } from '../components/TopHeader';

const { width } = Dimensions.get('window');

const categories = [
  {
    id: 1,
    emoji: '📱',
    name: 'Electronics',
  },
  {
    id: 2,
    emoji: '🪑',
    name: 'Furniture',
  },
  {
    id: 3,
    emoji: '🚗',
    name: 'Vehicles',
  },
  {
    id: 4,
    emoji: '👕',
    name: 'Clothing',
  },
  {
    id: 5,
    emoji: '🎮',
    name: 'Gaming',
  },
  {
    id: 6,
    emoji: '🏡',
    name: 'Home & Garden',
  },
];

const CategoryCard = ({ emoji, name }: { emoji: string; name: string }) => (
  <TouchableOpacity style={styles.categoryCard}>
    <Text style={styles.categoryEmoji}>{emoji}</Text>
    <ThemedText style={styles.categoryName}>{name}</ThemedText>
  </TouchableOpacity>
);

export default function CategoriesScreen() {
  return (
    <View style={styles.container}>
      <TopHeader />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Categories</ThemedText>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/(tabs)/all-categories')}
          >
            <ThemedText style={styles.viewAllText}>View All Categories</ThemedText>
            <View style={styles.chevronContainer}>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              emoji={category.emoji}
              name={category.name}
            />
          ))}
        </View>

        <FeaturedAuctions />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#64748B',
  },
  chevronContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 18,
    color: '#64748B',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  categoryCard: {
    width: (width - 48) / 2,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#020817',
    textAlign: 'center',
  },
}); 