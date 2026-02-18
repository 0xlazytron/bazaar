import { ReviewItem } from "@/app/components/ReviewItem";
import { ThemedText } from "@/app/components/ThemedText";
import { getCurrentUser } from "@/lib/auth";
import { getSellerReviews, type Review } from "@/lib/firestore";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function MyReviewsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const from = typeof params.from === "string" ? params.from : "";
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const user = getCurrentUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getSellerReviews(user.uid);
        if (!active) return;
        setReviews(data);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredReviews =
    normalizedQuery.length === 0
      ? reviews
      : reviews.filter((review) => {
        const haystack = [
          review.buyerName,
          review.sentiment,
          review.comment,
          review.orderId,
          review.productId,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            from === "profile"
              ? router.replace("/(tabs)/profile")
              : router.back()
          }
        >
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Reviews</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <View style={styles.listContainer}>
          <View style={styles.searchContainer}>
            <Image
              source={require("@/assets/images/icons/search.png")}
              style={styles.searchIcon}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search reviews"
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {reviews.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>
                  No reviews yet
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Buyer feedback on your orders will show up here.
                </ThemedText>
              </View>
            ) : filteredReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>No matches</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Try a different search.
                </ThemedText>
              </View>
            ) : (
              filteredReviews.map((review) => (
                <TouchableOpacity
                  key={review.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (review.productId)
                      router.push(`/(tabs)/product/${review.productId}`);
                  }}
                >
                  <ReviewItem
                    name={review.buyerName || "Buyer"}
                    avatar={
                      review.buyerAvatar
                        ? { uri: review.buyerAvatar }
                        : require("@/assets/images/avatar/profile.png")
                    }
                    time={
                      review.createdAt instanceof Date
                        ? review.createdAt.toLocaleDateString()
                        : new Date(
                          (review.createdAt as any).seconds * 1000,
                        ).toLocaleDateString()
                    }
                    sentiment={review.sentiment}
                    comment={review.comment}
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    color: "#6B7280",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  searchIcon: {
    width: 18,
    height: 18,
    tintColor: "#6B7280",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 0,
  },
  content: {
    paddingVertical: 8,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
});
