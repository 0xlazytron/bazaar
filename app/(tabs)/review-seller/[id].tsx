import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getCurrentUser } from '../../../lib/auth';
import { createReview, getOrder, getReviewForOrder, type Order, type Review, type ReviewSentiment } from '../../../lib/firestore';

const ReviewSellerScreen = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sentiment, setSentiment] = useState<ReviewSentiment | null>(null);
  const [comment, setComment] = useState('');
  const [existingReview, setExistingReview] = useState<Review | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id || typeof id !== 'string') {
        setLoading(false);
        return;
      }
      try {
        const [orderData, reviewData] = await Promise.all([
          getOrder(id),
          getReviewForOrder(id),
        ]);
        if (!active) return;
        setOrder(orderData);
        setExistingReview(reviewData);
        if (reviewData) {
          setSentiment(reviewData.sentiment);
          setComment(reviewData.comment || '');
        }
      } catch (error) {
        console.error('Error loading review data:', error);
        Alert.alert('Error', 'Failed to load review details.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = async () => {
    const user = getCurrentUser();
    if (!user || !order || !id || typeof id !== 'string' || existingReview) {
      return;
    }
    if (!sentiment) {
      Alert.alert('Select feedback', 'Please select how your experience was.');
      return;
    }
    try {
      setSubmitting(true);
      const data: Omit<Review, 'id' | 'createdAt'> = {
        orderId: id,
        productId: order.productId,
        buyerId: user.uid,
        buyerName: user.displayName || order.buyerName || '',
        buyerAvatar: user.photoURL || undefined,
        sellerId: order.sellerId,
        sentiment,
        comment: comment.trim(),
      };
      const reviewId = await createReview(data);
      const created: Review = {
        ...data,
        id: reviewId,
        createdAt: new Date(),
      };
      setExistingReview(created);
      Alert.alert('Thank you', 'Your review has been submitted.', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
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
    const isBuyer = user && order.buyerId === user.uid;

    if (!isBuyer || order.status !== 'delivered') {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Reviews are only available for your delivered orders.</Text>
        </View>
      );
    }

    const disabled = !!existingReview || submitting;

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Rate Seller</Text>
          <Text style={styles.subtitle}>
            Order #{order.orderNumber || (order.id || '').slice(-8)}
          </Text>
          <Text style={styles.productTitle}>{order.productTitle}</Text>
          <View style={styles.sellerRow}>
            <Text style={styles.sellerLabel}>Seller</Text>
            <Text style={styles.sellerName}>{order.sellerName || order.sellerId}</Text>
          </View>

          <Text style={styles.sectionLabel}>How was your experience?</Text>
          <View style={styles.moodRow}>
            <TouchableOpacity
              style={[
                styles.moodButton,
                sentiment === 'positive' && styles.moodButtonSelected,
                disabled && styles.moodButtonDisabled,
              ]}
              onPress={() => {
                if (disabled) return;
                setSentiment('positive');
              }}
              disabled={disabled}
            >
              <Image
                source={require('@/assets/images/icons/happy.png')}
                style={styles.moodIcon}
              />
              <Text style={styles.moodText}>Happy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.moodButton,
                sentiment === 'neutral' && styles.moodButtonSelected,
                disabled && styles.moodButtonDisabled,
              ]}
              onPress={() => {
                if (disabled) return;
                setSentiment('neutral');
              }}
              disabled={disabled}
            >
              <Image
                source={require('@/assets/images/icons/neutral.png')}
                style={styles.moodIcon}
              />
              <Text style={styles.moodText}>Neutral</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.moodButton,
                sentiment === 'negative' && styles.moodButtonSelected,
                disabled && styles.moodButtonDisabled,
              ]}
              onPress={() => {
                if (disabled) return;
                setSentiment('negative');
              }}
              disabled={disabled}
            >
              <Image
                source={require('@/assets/images/icons/sad.png')}
                style={styles.moodIcon}
              />
              <Text style={styles.moodText}>Sad</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Write a review</Text>
          <TextInput
            style={styles.input}
            placeholder="Share more about your experience"
            value={comment}
            onChangeText={setComment}
            editable={!disabled}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              (disabled || !sentiment) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={disabled || !sentiment}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {existingReview ? 'Review Submitted' : 'Submit Review'}
              </Text>
            )}
          </TouchableOpacity>

          {existingReview && (
            <Text style={styles.infoText}>You have already reviewed this order.</Text>
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
        <Text style={styles.headerTitle}>Rate Seller</Text>
        <View style={styles.headerSpacer} />
      </View>
      {renderContent()}
    </View>
  );
};

export default ReviewSellerScreen;

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
  productTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111827',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginTop: 12,
    marginBottom: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  moodButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  moodButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#ECFDF5',
  },
  moodButtonDisabled: {
    opacity: 0.6,
  },
  moodIcon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  moodText: {
    fontSize: 13,
    color: '#111827',
  },
  input: {
    marginTop: 4,
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
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

