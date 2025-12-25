import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getEndingSoonProducts, getFeaturedProducts, getMainCategories, getNewlyListedProducts, getPopularProducts, getProducts, Product } from '../../lib/firestore';
import { ProductCard } from '../components/ProductCard';
import { ProductType } from '../components/ProductCard.types';

type UICard = {
  id: string;
  image: any;
  title: string;
  description: string;
  currentBid: number;
  timeLeft: string;
  bids: number;
  type?: ProductType;
};

const toCard = (p: Product, type?: ProductType): UICard => {
  const imgUrl = Array.isArray(p.images) && p.images.length ? p.images[0] : (p.productImage || undefined);
  const image = imgUrl ? { uri: imgUrl as any } : require('../assets/images/products/iphone.png');
  const title = p.title || 'Untitled';
  const description = p.description || '';
  const currentBid = Number(p.currentBid ?? p.price ?? 0);
  const bids = Number(p.bidCount ?? 0);
  const end = p.auctionEndTime as any;
  const toDate = end?.toDate ? end.toDate() : (end instanceof Date ? end : end ? new Date(end) : null);
  let timeLeft = '—';
  if (toDate && toDate instanceof Date && !isNaN(toDate.getTime())) {
    const diff = toDate.getTime() - Date.now();
    if (diff <= 0) timeLeft = 'Ended'; else {
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      timeLeft = d > 0 ? `${d}d ${h}h` : `${h}h`;
    }
  }
  return { id: p.id || '', image, title, description, currentBid, bids, timeLeft, type };
};

const isVisibleProduct = (p: Product) => p.status !== 'sold' && p.status !== 'pending_delivery';

type FilterType = 'All' | ProductType;

export default function AllProductsScreen() {
  const params = useLocalSearchParams();
  const [activeFilter, setActiveFilter] = useState<FilterType>((params.filter as FilterType) || 'All');
  const [cards, setCards] = useState<UICard[]>([]);
  const [search, setSearch] = useState<string>((params.q as string) || '');
  const [category, setCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showCat, setShowCat] = useState(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const filterTabs: { label: FilterType; icon: any }[] = [
    { label: 'All', icon: require('../assets/images/icons/explore.png') },
    { label: 'Featured', icon: require('../assets/images/icons/star.png') },
    { label: 'Ending Soon', icon: require('../assets/images/icons/clock.png') },
    { label: 'Newly Listed', icon: require('../assets/images/icons/tag.png') },
    { label: 'Popular', icon: require('../assets/images/icons/star-filled.png') },
  ];

  const load = async (filter: FilterType) => {
    setLoading(true);
    if (filter === 'All') {
      const { products } = await getProducts({ limitCount: 30 });
      setCards(products.filter(isVisibleProduct).map((p) => toCard(p)));
    } else if (filter === 'Featured') {
      const list = await getFeaturedProducts(30);
      setCards(list.filter(isVisibleProduct).map((p) => toCard(p, 'Featured')));
    } else if (filter === 'Ending Soon') {
      const list = await getEndingSoonProducts(30);
      setCards(list.filter(isVisibleProduct).map((p) => toCard(p, 'Ending Soon')));
    } else if (filter === 'Newly Listed') {
      const list = await getNewlyListedProducts(30);
      setCards(list.filter(isVisibleProduct).map((p) => toCard(p, 'Newly Listed')));
    } else {
      const list = await getPopularProducts(30);
      setCards(list.filter(isVisibleProduct).map((p) => toCard(p, 'Popular')));
    }
    setLoading(false);
  };

  useEffect(() => { load(activeFilter).catch(() => setCards([])); }, [activeFilter]);

  useEffect(() => {
    (async () => {
      const mains = await getMainCategories();
      setCategories(mains.map((c) => String(c.name || '')));
    })();
  }, []);

  const applySearch = (items: UICard[]) => {
    let res = items;
    const q = search.trim().toLowerCase();
    if (q) res = res.filter((i) => (i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)));
    if (category) res = res.filter((i) => (i.description + ' ' + i.title).toLowerCase().includes(category.toLowerCase()));
    const min = parseFloat(minPrice || '');
    const max = parseFloat(maxPrice || '');
    if (!isNaN(min)) res = res.filter((i) => i.currentBid >= min);
    if (!isNaN(max)) res = res.filter((i) => i.currentBid <= max);
    return res;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backRow} onPress={() => router.push('/(tabs)')}>
          <Image source={require('../assets/images/icons/chevron-left.png')} style={styles.backIcon} />
          <Text style={styles.backText}>Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Products</Text>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.filtersRow}>
          <TouchableOpacity style={styles.filterChip} onPress={() => setShowCat(true)}>
            <Text style={styles.filterChipText}>{category ? category : 'Category'}</Text>
          </TouchableOpacity>
          <TextInput value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" placeholder="Min" placeholderTextColor="#6B7280" style={styles.priceInput} />
          <TextInput value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" placeholder="Max" placeholderTextColor="#6B7280" style={styles.priceInput} />
          <TouchableOpacity style={styles.clearButton} onPress={() => { setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); load(activeFilter).catch(() => setCards([])); }}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search products" placeholderTextColor="#6B7280" style={styles.searchInput} />
        <TouchableOpacity style={styles.searchActionButton} onPress={() => load(activeFilter).then(() => setCards((prev) => applySearch(prev))).catch(() => setCards([]))}>
          <Text style={styles.searchActionText}>Search</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.tabsRow, { paddingBottom: 0 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {filterTabs.map((t) => (
            <TouchableOpacity key={t.label} style={[styles.tab, activeFilter === t.label && styles.activeTab]} onPress={() => setActiveFilter(t.label)}>
              <Image source={t.icon} style={[styles.tabIcon, activeFilter === t.label && styles.activeTabIcon]} />
              <Text style={[styles.tabText, activeFilter === t.label && styles.activeTabText]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Loading products...</Text>
          </View>
        )}
        {!loading && applySearch(cards).length === 0 && (
          <View style={styles.emptyState}>
            <Image source={require('../assets/images/icons/box.png')} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}
        {!loading && applySearch(cards).length > 0 && (
          applySearch(cards).map((p) => (
            <View key={p.id} style={styles.cardWrapper}>
              <ProductCard image={p.image} title={p.title} description={p.description} currentBid={p.currentBid} timeLeft={p.timeLeft} bids={p.bids} type={p.type} id={p.id} />
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showCat} transparent animationType="fade" onRequestClose={() => setShowCat(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map((c) => (
                <TouchableOpacity key={c} style={styles.modalItem} onPress={() => { setCategory(c); setShowCat(false); }}>
                  <Text style={styles.modalItemText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowCat(false)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerRow: { paddingTop: 48, paddingHorizontal: 16, paddingBottom: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center' },
  backIcon: { width: 16, height: 16, tintColor: '#4B5563', marginRight: 4 },
  backText: { color: '#4B5563', fontSize: 14 },
  title: { fontSize: 24, fontWeight: '700', color: '#020817', marginTop: 8 },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, marginBottom: 12 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchInput: { height: 44, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, marginBottom: 8, backgroundColor: '#FFFFFF', color: '#111827' },
  filtersRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 12 },
  tabsContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, backgroundColor: '#F3F4F6' },
  filterChipText: { color: '#374151' },
  priceInput: { width: 80, height: 40, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 8, backgroundColor: '#FFFFFF', color: '#111827' },
  clearButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F3F4F6' },
  clearButtonText: { color: '#111827' },
  searchActionButton: { height: 44, borderRadius: 12, backgroundColor: '#16A34A', justifyContent: 'center', alignItems: 'center' },
  searchActionText: { color: '#FFFFFF', fontWeight: '600' },
  tab: { height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: '#F3F4F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  activeTab: { backgroundColor: '#16A34A' },
  tabText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },
  activeTabText: { color: '#FFFFFF' },
  tabIcon: { width: 14, height: 14, tintColor: '#4B5563' },
  activeTabIcon: { tintColor: '#FFFFFF' },
  list: { flex: 1, marginTop: 0 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },
  cardWrapper: { width: '100%', marginBottom: 16 },
  emptyState: { alignItems: 'center', paddingTop: 32 },
  emptyIcon: { width: 48, height: 48, tintColor: '#9CA3AF', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280' },
  loadingState: { paddingTop: 32, alignItems: 'center' },
  loadingText: { marginTop: 8, color: '#6B7280' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  modalItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  modalItemText: { fontSize: 14, color: '#111827' },
  modalClose: { alignSelf: 'flex-end', marginTop: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },
  modalCloseText: { color: '#111827' },
});
