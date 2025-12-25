import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/ThemedText';
import { TopHeader } from '../components/TopHeader';
import { ImageWithLoader } from '../components/ImageWithLoader';
import { getUserFavorites, getProduct, removeFromFavorites, Product } from '../../lib/firestore';
import { getCurrentUser, onAuthStateChange } from '../../lib/auth';

const filterTabs = [
  {
    id: 1,
    label: 'All',
    color: '#16A34A'
  },
  {
    id: 2,
    label: 'Ending Soon',
    color: '#EF4444'
  },
  {
    id: 3,
    label: 'Newly Listed',
    color: '#6366F1'
  },
  {
    id: 4,
    label: 'Popular',
    color: '#F59E0B'
  },
];

export function FavoritesScreen() {
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  // Load favorites from Firebase
  const loadFavorites = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      const favoriteIds = await getUserFavorites(currentUser.uid);
      const products: Product[] = [];
      
      // Fetch product details for each favorite
      for (const productId of favoriteIds) {
        const product = await getProduct(productId);
        if (product && product.status === 'active') {
          products.push(product);
        }
      }
      
      setFavoriteProducts(products);
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  // Handle unfavorite action
  const handleUnfavorite = async (productId: string) => {
    if (!currentUser) return;

    try {
      await removeFromFavorites(currentUser.uid, productId);
      setFavoriteProducts(prev => prev.filter(product => product.id !== productId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
      Alert.alert('Error', 'Failed to remove from favorites');
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  // Filter products based on selected filter
  const getFilteredProducts = () => {
    if (selectedFilter === 'All') {
      return favoriteProducts;
    }
    
    const now = new Date();
    
    switch (selectedFilter) {
      case 'Ending Soon':
        return favoriteProducts.filter(product => {
          if (!product.auctionEndTime) return false;
          const endTime = product.auctionEndTime instanceof Date 
            ? product.auctionEndTime 
            : new Date(product.auctionEndTime);
          const hoursLeft = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          return hoursLeft > 0 && hoursLeft <= 24;
        });
      
      case 'Newly Listed':
        return favoriteProducts.filter(product => {
          if (!product.createdAt) return false;
          try {
            const createdAt = product.createdAt instanceof Date 
              ? product.createdAt 
              : new Date(product.createdAt);
            if (isNaN(createdAt.getTime())) return false;
            const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysOld <= 7;
          } catch (error) {
            console.warn('Invalid createdAt date for product:', product.id, error);
            return false;
          }
        });
      
      case 'Popular':
        return [...favoriteProducts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
      
      default:
        return favoriteProducts;
    }
  };

  // Calculate time remaining for auctions
  const getTimeRemaining = (auctionEndTime?: any) => {
    if (!auctionEndTime) return null;
    
    const endTime = (auctionEndTime as any)?.toDate
      ? (auctionEndTime as any).toDate()
      : auctionEndTime instanceof Date 
        ? auctionEndTime 
        : new Date(auctionEndTime as any);
    if (!(endTime instanceof Date) || isNaN(endTime.getTime())) return null;
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const filteredProducts = getFilteredProducts();

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <TopHeader />

      {/* Favorites Header */}
      <View style={styles.header}>
        <ThemedText type="heading" style={styles.headerTitle}>Favorites</ThemedText>
      </View>

      {/* Filter Options - Vertical Layout */}
      <View style={styles.filterContainer}>
        <View style={styles.filterGrid}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterOption,
                selectedFilter === tab.label && [styles.filterOptionSelected, { backgroundColor: tab.color }]
              ]}
              onPress={() => setSelectedFilter(tab.label)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === tab.label && styles.filterTextSelected
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      ) : !currentUser ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={80} color="#ccc" />
          <ThemedText type="heading" style={styles.emptyText}>Please log in</ThemedText>
          <Text style={styles.emptySubText}>
            You need to be logged in to view your favorites
          </Text>
        </View>
      ) : filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id || ''}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          renderItem={({ item }) => {
            const timeRemaining = getTimeRemaining(item.auctionEndTime);
            const isNewListing = (() => {
              if (!item.createdAt) return false;
              try {
                const createdAt = item.createdAt instanceof Date 
                  ? item.createdAt 
                  : new Date(item.createdAt);
                if (isNaN(createdAt.getTime())) return false;
                const daysOld = (new Date().getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
                return daysOld <= 7;
              } catch (error) {
                console.warn('Invalid createdAt date for product:', item.id, error);
                return false;
              }
            })();

            return (
              <View style={styles.favoriteItemCard}>
                {/* Product Image */}
                 <View style={styles.productImageContainer}>
                    <ImageWithLoader 
                      source={item.images && item.images.length > 0 ? { uri: item.images[0] } : require('@/assets/images/products/product-1.png')} 
                      style={styles.productImage}
                      resizeMode="cover"
                      debugLabel={`FavoriteProduct-${item.id}`}
                    />
                    {isNewListing && (
                      <View style={styles.newListingBadge}>
                        <Text style={styles.newListingText}>New Listing</Text>
                      </View>
                    )}
                    <TouchableOpacity 
                      style={styles.favoriteButton}
                      onPress={() => handleUnfavorite(item.id || '')}
                    >
                      <Ionicons name="heart" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                {/* Product Details */}
                <View style={styles.itemDetails}>
                  <ThemedText numberOfLines={2} style={styles.itemTitle}>
                    {item.title || item.data || 'Untitled Product'}
                  </ThemedText>

                  <View style={styles.bidSection}>
                    <View>
                      <Text style={styles.bidLabel}>
                        {item.pricingType?.includes('Auction') ? 'Current bid' : 'Price'}
                      </Text>
                      <Text style={styles.priceText}>
                        Rs {typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
                      </Text>
                    </View>
                    <View style={[
                      styles.conditionBadge, 
                      item.itemCondition === 'new' ? styles.newBadge : styles.usedBadge
                    ]}>
                      <Text style={[
                        styles.conditionText, 
                        item.itemCondition === 'new' ? styles.newText : styles.usedText
                      ]}>
                        {item.itemCondition || item.condition || 'Used'}
                      </Text>
                    </View>
                  </View>

                  {(item.pricingType === 'both' || item.pricingType?.includes('Both')) && (
                    <View style={styles.buyNowSection}>
                      <Text style={styles.buyNowLabel}>Buy now</Text>
                      <Text style={styles.buyNowPrice}>
                        Rs {typeof item.price === 'number' ? (item.price * 1.2).toLocaleString() : item.price}
                      </Text>
                    </View>
                  )}

                  <View style={styles.infoSection}>
                    {timeRemaining && (
                      <View style={styles.timeInfo}>
                        <Ionicons name="time-outline" size={14} color="#4B5563" style={styles.infoIcon} />
                        <Text style={styles.infoText}>{timeRemaining}</Text>
                      </View>
                    )}
                    <View style={styles.bidInfo}>
                      <Ionicons name="eye-outline" size={14} color="#4B5563" style={styles.infoIcon} />
                      <Text style={styles.infoText}>{item.views || 0} views</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color="#ccc" />
          <ThemedText type="heading" style={styles.emptyText}>
            {selectedFilter === 'All' ? 'No favorites yet' : `No ${selectedFilter.toLowerCase()} favorites`}
          </ThemedText>
          <Text style={styles.emptySubText}>
            {selectedFilter === 'All' 
              ? 'Items added to your favorites will appear here'
              : `No favorites match the ${selectedFilter.toLowerCase()} filter`
            }
          </Text>
          {selectedFilter !== 'All' && (
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => setSelectedFilter('All')}
            >
              <Text style={styles.browseButtonText}>Show All Favorites</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 80,
    alignItems: 'center',
  },
  filterOptionSelected: {
    backgroundColor: '#10B981',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  filterTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  favoriteItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  productImageContainer: {
    position: 'relative',
    height: 200,
    width: '100%',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newListingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  newListingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemDetails: {
    padding: 16,
    gap: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  bidSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bidLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#059669',
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  usedBadge: {
    backgroundColor: '#DBEAFE',
  },
  newBadge: {
    backgroundColor: '#D1FAE5',
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  usedText: {
    color: '#1E40AF',
  },
  newText: {
    color: '#065F46',
  },
  buyNowSection: {
    marginTop: 4,
  },
  buyNowLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  buyNowPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bidInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});