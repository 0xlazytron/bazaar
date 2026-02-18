import { ThemedText } from "@/app/components/ThemedText";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import {
  createReview,
  getOrder,
  getReviewForOrder,
  type Order,
  type ReviewSentiment,
} from "@/lib/firestore";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const shortId = (value?: string) => {
  if (!value) return "";
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
};

export default function ReviewSellerScreen() {
  const {
    id,
    returnTo,
    returnActiveTab,
    returnScrollTo,
    highlightOrderId,
    returnFrom,
  } = useLocalSearchParams<{
    id?: string;
    returnTo?: string;
    returnActiveTab?: string;
    returnScrollTo?: string;
    highlightOrderId?: string;
    returnFrom?: string;
  }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [sellerDisplayName, setSellerDisplayName] = useState<string>("");
  const [sentiment, setSentiment] = useState<ReviewSentiment>("positive");
  const [comment, setComment] = useState("");
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const isValidId = typeof id === "string" && id.length > 0;

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!isValidId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [orderData, existingReview] = await Promise.all([
          getOrder(id),
          getReviewForOrder(id),
        ]);
        if (!active) return;

        setOrder(orderData);
        setAlreadyReviewed(!!existingReview);

        const sellerNameFromOrder = orderData?.sellerName || "";
        if (sellerNameFromOrder) {
          setSellerDisplayName(sellerNameFromOrder);
        } else if (orderData?.sellerId) {
          const profile = await getUserProfile(orderData.sellerId);
          if (!active) return;
          setSellerDisplayName(
            profile?.displayName || shortId(orderData.sellerId),
          );
        } else {
          setSellerDisplayName("Seller");
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Failed to load order.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id, isValidId]);

  const canSubmit = useMemo(() => {
    const user = getCurrentUser();
    if (!user) return false;
    if (!order) return false;
    if (alreadyReviewed) return false;
    if (order.buyerId !== user.uid) return false;
    if (order.status !== "delivered") return false;
    if (!comment.trim()) return false;
    return true;
  }, [order, alreadyReviewed, comment]);

  const handleSubmit = async () => {
    const user = getCurrentUser();
    if (!user || !order || !isValidId) return;

    try {
      setSubmitting(true);
      await createReview({
        orderId: id,
        productId: order.productId,
        buyerId: user.uid,
        buyerName: user.displayName || user.email || "Buyer",
        buyerAvatar: user.photoURL || undefined,
        sellerId: order.sellerId,
        sentiment,
        comment: comment.trim(),
      });
      setAlreadyReviewed(true);
      Alert.alert("Success", "Review submitted.");
      if (returnTo === "profile") {
        router.replace({
          pathname: "/(tabs)/profile",
          params: {
            activeTab: returnActiveTab || "orders",
            scrollTo: returnScrollTo || undefined,
            highlightOrderId: highlightOrderId || (id as any) || undefined,
          },
        } as any);
        return;
      }
      if (returnTo === "items-bought") {
        router.replace({
          pathname: "/(tabs)/items-bought",
          params: { from: returnFrom || undefined },
        } as any);
        return;
      }
      if (returnTo === "items-sold") {
        router.replace({
          pathname: "/(tabs)/items-sold",
          params: { from: returnFrom || undefined },
        } as any);
        return;
      }
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.errorText}>Order not found.</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (returnTo === "profile") {
              router.replace({
                pathname: "/(tabs)/profile",
                params: {
                  activeTab: returnActiveTab || "orders",
                  scrollTo: returnScrollTo || undefined,
                  highlightOrderId:
                    highlightOrderId || (id as any) || undefined,
                },
              } as any);
              return;
            }
            if (returnTo === "order") {
              const targetId =
                (typeof highlightOrderId === "string" && highlightOrderId) ||
                (typeof id === "string" ? id : "");
              if (targetId) {
                router.replace({
                  pathname: "/(tabs)/order/[id]",
                  params: { id: targetId, from: returnFrom || undefined },
                } as any);
                return;
              }
            }
            if (returnTo === "items-bought") {
              router.replace({
                pathname: "/(tabs)/items-bought",
                params: { from: returnFrom || undefined },
              } as any);
              return;
            }
            if (returnTo === "items-sold") {
              router.replace({
                pathname: "/(tabs)/items-sold",
                params: { from: returnFrom || undefined },
              } as any);
              return;
            }
            router.back();
          }}
        >
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Rate Seller</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <ThemedText style={styles.title}>Seller</ThemedText>
          <ThemedText style={styles.sellerName} numberOfLines={1}>
            {sellerDisplayName}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Order #{order.orderNumber || (order.id || "").slice(-8)}
          </ThemedText>

          <View style={styles.sentimentRow}>
            {(
              [
                {
                  key: "positive",
                  label: "Positive",
                  icon: require("@/assets/images/icons/happy.png"),
                  color: "#16A34A",
                },
                {
                  key: "neutral",
                  label: "Neutral",
                  icon: require("@/assets/images/icons/neutral.png"),
                  color: "#F59E0B",
                },
                {
                  key: "negative",
                  label: "Negative",
                  icon: require("@/assets/images/icons/sad.png"),
                  color: "#EF4444",
                },
              ] as const
            ).map((opt) => {
              const selected = sentiment === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.sentimentButton,
                    selected && {
                      borderColor: opt.color,
                      backgroundColor: `${opt.color}15`,
                    },
                  ]}
                  onPress={() => setSentiment(opt.key)}
                  disabled={alreadyReviewed}
                >
                  <Image source={opt.icon} style={styles.sentimentIcon} />
                  <ThemedText
                    style={[
                      styles.sentimentLabel,
                      selected && { color: opt.color },
                    ]}
                  >
                    {opt.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          <ThemedText style={styles.commentLabel}>Comment</ThemedText>
          <TextInput
            style={styles.commentInput}
            placeholder="Write your feedback…"
            placeholderTextColor="#94A3B8"
            value={comment}
            onChangeText={setComment}
            editable={!alreadyReviewed}
            multiline
          />

          {alreadyReviewed && (
            <View style={styles.infoBadge}>
              <ThemedText style={styles.infoBadgeText}>
                You already reviewed this order.
              </ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!canSubmit || submitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.submitButtonText}>
                Submit Review
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#111827",
    fontSize: 16,
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
  content: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  title: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  sellerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748B",
  },
  sentimentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  sentimentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "30%",
    justifyContent: "center",
  },
  sentimentIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  sentimentLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  commentLabel: {
    marginTop: 18,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  commentInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    textAlignVertical: "top",
  },
  infoBadge: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  infoBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#92400E",
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.55,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
