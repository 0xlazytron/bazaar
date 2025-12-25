import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMainCategories, subscribeMainCategories } from '../../lib/firestore';
import { FeaturedAuctions } from '../components/FeaturedAuctions';
import { ThemedText } from '../components/ThemedText';
import { TopHeader } from '../components/TopHeader';

const { width } = Dimensions.get('window');

type UICategory = { id: string; name: string; emoji?: string; iconUrl?: string };

const CategoryCard = ({ emoji, iconUrl, name }: { emoji?: string; iconUrl?: string; name: string }) => {
  const [loading, setLoading] = React.useState<boolean>(!!iconUrl);
  return (
    <TouchableOpacity style={styles.categoryCard}>
      {iconUrl ? (
        <>
          {loading && <ActivityIndicator size="small" color="#9CA3AF" />}
          <Image source={{ uri: iconUrl }} style={[styles.categoryImage, loading ? { position: 'absolute', opacity: 0 } : {}]} onLoadStart={() => setLoading(true)} onLoadEnd={() => setLoading(false)} />
        </>
      ) : (
        <Text style={styles.categoryEmoji}>{emoji || '📦'}</Text>
      )}
      <ThemedText style={styles.categoryName}>{name}</ThemedText>
    </TouchableOpacity>
  );
};

export default function CategoriesScreen() {
  const [cats, setCats] = useState<UICategory[]>([]);

  useEffect(() => {
    let unsub: any;
    (async () => {
      const initial = await getMainCategories();
      setCats(initial.map((c) => ({ id: c.id || c.name, name: c.name, emoji: c.icon && !String(c.icon).startsWith('http') ? String(c.icon) : undefined, iconUrl: c.icon && String(c.icon).startsWith('http') ? String(c.icon) : undefined })));
      unsub = subscribeMainCategories((list) => {
        setCats(list.map((c) => ({ id: c.id || c.name, name: c.name, emoji: c.icon && !String(c.icon).startsWith('http') ? String(c.icon) : undefined, iconUrl: c.icon && String(c.icon).startsWith('http') ? String(c.icon) : undefined })));
      });
    })();
    return () => unsub && unsub();
  }, []);
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
          {cats.map((category) => (
            <CategoryCard
              key={category.id}
              emoji={category.emoji}
              iconUrl={category.iconUrl}
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
  categoryImage: {
    width: 32,
    height: 32,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  categoryName: {
    fontSize: 14,
    color: '#020817',
    textAlign: 'center',
  },
});
