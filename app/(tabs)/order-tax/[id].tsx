import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentUser } from '../../../lib/auth';
import { getOrder, updateOrder, type Order } from '../../../lib/firestore';
import { uploadImage } from '../../../lib/storage';

const TaxProofScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id || typeof id !== 'string') {
        setLoading(false);
        return;
      }
      try {
        const data = await getOrder(id);
        if (!active) return;
        setOrder(data);
      } catch (error) {
        console.error('Error loading order:', error);
        Alert.alert('Error', 'Failed to load order details.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handlePickImage = async () => {
    const user = getCurrentUser();
    if (!user || !order || !id || typeof id !== 'string') return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photos to upload tax proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    try {
      setUploading(true);
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const path = `taxProof/${user.uid}/${id}_${Date.now()}`;
      const url = await uploadImage(blob, path);

      await updateOrder(id, {
        taxProof: url,
      });

      setOrder((prev) => (prev ? { ...prev, taxProof: url } : prev));
      Alert.alert('Success', 'Tax proof uploaded successfully.');
    } catch (error) {
      console.error('Error uploading tax proof:', error);
      Alert.alert('Error', 'Failed to upload tax proof. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#16A34A" />
        </View>
      );
    }

    if (!order) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Order not found.</Text>
        </View>
      );
    }

    const user = getCurrentUser();
    const isSeller = user && order.sellerId === user.uid;

    if (!isSeller || order.status !== 'delivered') {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Tax payment is only available for your sold orders.</Text>
        </View>
      );
    }

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Tax Proof</Text>
          <Text style={styles.subtitle}>
            Order #{order.orderNumber || (order.id || '').slice(-8)}
          </Text>
          <Text style={styles.amountText}>
            Platform tax: Rs {(order.productTax ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>

          {order.taxProof ? (
            <View style={styles.imageWrapper}>
              <Image source={{ uri: order.taxProof }} style={styles.image} />
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>No tax proof uploaded yet.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handlePickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.uploadButtonText}>
                {order.taxProof ? 'Replace Tax Proof' : 'Upload Tax Proof'}
              </Text>
            )}
          </TouchableOpacity>

          {order.taxPaid && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Tax marked as paid by admin</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Proof</Text>
        <View style={styles.headerSpacer} />
      </View>
      {renderContent()}
    </View>
  );
};

export default TaxProofScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    color: '#6B7280',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
    marginBottom: 16,
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 260,
    resizeMode: 'cover',
  },
  placeholder: {
    height: 260,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  placeholderText: {
    fontSize: 14,
    color: '#6B7280',
  },
  uploadButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    alignItems: 'center',
  },
  uploadButtonDisabled: {
    opacity: 0.7,
  },
  uploadButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: 13,
    color: '#16A34A',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
});
