import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCategoriesWithSubs, getListingsCountForCategory, subscribeCategoriesWithSubs } from '../../lib/firestore';
import { ThemedText } from './ThemedText';

type UICategory = { id: string; title: string; emoji?: string; iconUrl?: string; bgColor?: string; listingsCount?: number; subcategories: string[] };
const pastelPalette = ['#EFF6FF', '#FEF3C7', '#FEE2E2', '#F3E8FF', '#ECFDF5', '#F0FDF4', '#FFF7ED', '#F0F9FF'];

function CategoryCard({ category }: { category: UICategory }) {
  const [loading, setLoading] = React.useState<boolean>(!!category.iconUrl);
  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <View style={[styles.emojiContainer, { backgroundColor: category.bgColor }]}>
          {category.iconUrl ? (
            <>
              {loading && <ActivityIndicator size="small" color="#9CA3AF" />}
              <Image source={{ uri: category.iconUrl }} style={[styles.iconImage, loading ? { position: 'absolute', opacity: 0 } : {}]} onLoadStart={() => setLoading(true)} onLoadEnd={() => setLoading(false)} />
            </>
          ) : (
            <Text style={styles.emoji}>{category.emoji}</Text>
          )}
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
  const [cats, setCats] = useState<UICategory[]>([]);

  useEffect(() => {
    let unsub: any;
    (async () => {
      const initial = await getCategoriesWithSubs();
      const mapped = initial.map((c, idx) => ({
        id: c.id || c.name,
        title: c.name,
        emoji: c.icon && !String(c.icon).startsWith('http') ? String(c.icon) : undefined,
        iconUrl: c.icon && String(c.icon).startsWith('http') ? String(c.icon) : undefined,
        bgColor: c.bgColor || pastelPalette[idx % pastelPalette.length],
        listingsCount: c.listingsCount,
        subcategories: c.subItems.map(s => s.name)
      }));
      // Compute listing counts if missing
      const withCounts = await Promise.all(mapped.map(async (m) => ({
        ...m,
        listingsCount: m.listingsCount ?? await getListingsCountForCategory(m.title)
      })));
      setCats(withCounts);
      unsub = subscribeCategoriesWithSubs((list) => {
        const mappedLive = list.map((c, idx) => ({
          id: c.id || c.name,
          title: c.name,
          emoji: c.icon && !String(c.icon).startsWith('http') ? String(c.icon) : undefined,
          iconUrl: c.icon && String(c.icon).startsWith('http') ? String(c.icon) : undefined,
          bgColor: c.bgColor || pastelPalette[idx % pastelPalette.length],
          listingsCount: c.listingsCount,
          subcategories: c.subItems.map(s => s.name)
        }));
        Promise.all(mappedLive.map(async (m) => ({ ...m, listingsCount: m.listingsCount ?? await getListingsCountForCategory(m.title) }))).then(setCats).catch(() => setCats(mappedLive));
      });
    })();
    return () => unsub && unsub();
  }, []);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.push('/(tabs)/categories')}
      >
        <Image
          source={require('../../assets/images/icons/chevron-left.png')}
          style={styles.backIcon}
        />
        <Text style={styles.backText}>Back to Categories</Text>
      </TouchableOpacity>

      <ThemedText style={styles.title}>All Categories</ThemedText>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesContainer}>
          {cats.map(category => (
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
  iconImage: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
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
