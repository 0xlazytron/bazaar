import { Stack } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ThemedText from '../components/ThemedText';

export default function CartScreen() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          <TouchableOpacity style={styles.clearButton}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Cart Items List */}
        <ScrollView style={styles.content}>
          {/* Cart Item */}
          <View style={styles.cartItemCard}>
            <View style={styles.cartItemContent}>
              <View style={styles.productImageContainer}>
                <Image 
                  source={require('../../assets/images/products/iphone.png')}
                  style={styles.productImage}
                />
              </View>
              <View style={styles.itemDetails}>
                <View style={styles.itemHeader}>
                  <ThemedText style={styles.itemTitle}>
                    Apple iPhone 13 Pro Max
                  </ThemedText>
                  <Text style={styles.timeText}>Added 2h ago</Text>
                </View>
                <Text style={styles.itemDescription}>
                  256GB, Graphite, 1 Year Warranty
                </Text>
                <Text style={styles.priceText}>Rs 24,500</Text>
                
                <View style={styles.quantityContainer}>
                  <TouchableOpacity style={styles.quantityButton}>
                    <Text style={styles.quantityButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>1</Text>
                  <TouchableOpacity style={styles.quantityButton}>
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Cart Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>Rs 24,500</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>Rs 150</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>Rs 24,650</Text>
            </View>
          </View>

          {/* Checkout Button */}
          <TouchableOpacity style={styles.checkoutButton}>
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#020817',
  },
  clearButton: {
    height: 36,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartItemCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cartItemContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#020817',
  },
  timeText: {
    fontSize: 12,
    color: '#64748B',
  },
  itemDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 16,
    color: '#64748B',
  },
  quantityText: {
    fontSize: 14,
    color: '#020817',
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#EF4444',
  },
  summaryContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    color: '#020817',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020817',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  checkoutButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 