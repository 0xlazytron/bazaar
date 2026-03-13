import { ImageWithLoader } from "@/app/components/ImageWithLoader";
import { ThemedText } from "@/app/components/ThemedText";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import {
  subscribeOrder,
  updateOrder,
  updateProduct,
  type Order,
} from "@/lib/firestore";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const shortId = (value: string) =>
  value.length > 16 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

export default function OrderDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string; from?: string }>();
  const { id } = params;
  const from = typeof params.from === "string" ? params.from : "";
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [counterpartyName, setCounterpartyName] = useState<string>("");
  const [markingSold, setMarkingSold] = useState(false);

  const orderId = typeof id === "string" ? id : "";

  useEffect(() => {
    let active = true;
    if (!orderId) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    const unsubscribe = subscribeOrder(orderId, async (data) => {
      if (!active) return;
      setOrder(data);
      setLoading(false);

      const user = getCurrentUser();
      const isSeller = !!(user && data && data.sellerId === user.uid);
      const otherId = data ? (isSeller ? data.buyerId : data.sellerId) : "";
      const nameFromOrder = data
        ? isSeller
          ? data.buyerName || data.buyerEmail || ""
          : data.sellerName || ""
        : "";

      if (nameFromOrder) {
        setCounterpartyName(nameFromOrder);
        return;
      }
      if (otherId) {
        try {
          const p = await getUserProfile(otherId);
          if (!active) return;
          setCounterpartyName(p?.displayName || shortId(otherId));
        } catch {
          if (!active) return;
          setCounterpartyName(shortId(otherId));
        }
        return;
      }
      setCounterpartyName("");
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [orderId]);

  const user = getCurrentUser();
  const isSeller = !!(user && order && order.sellerId === user.uid);
  const otherUserId = order ? (isSeller ? order.buyerId : order.sellerId) : "";
  const otherLabel = isSeller ? "Buyer" : "Seller";
  const displayOtherName =
    counterpartyName || (otherUserId ? shortId(otherUserId) : "");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "confirmed":
        return "#3B82F6";
      case "shipped":
        return "#8B5CF6";
      case "delivered":
        return "#10B981";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "confirmed":
        return "Confirmed";
      case "shipped":
        return "Shipped";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  const openMessage = () => {
    if (!order || !otherUserId) return;
    const avatar = "";
    const productId = order.productId || "";
    const productTitle = order.productTitle || "";
    const productImage = order.productImage || "";
    const productPrice = (order.itemPrice ?? order.totalAmount ?? 0).toString();
    router.push(
      `/(tabs)/message/${otherUserId}?name=${encodeURIComponent(displayOtherName)}&avatar=${encodeURIComponent(avatar)}&online=true&productId=${encodeURIComponent(productId)}&productTitle=${encodeURIComponent(productTitle)}&productImage=${encodeURIComponent(productImage)}&productPrice=${encodeURIComponent(productPrice)}&returnTo=order&returnFrom=${encodeURIComponent(from)}&returnOrderId=${encodeURIComponent(order.id || "")}`,
    );
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

  const orderNumber = order.orderNumber || (order.id || "").slice(-8);
  const orderDate =
    order.createdAt instanceof Date
      ? order.createdAt.toLocaleDateString()
      : new Date((order.createdAt as any).seconds * 1000).toLocaleDateString();

  const canRateSeller = !isSeller && order.status === "delivered" && !!order.id;
  const canUploadTax = isSeller && order.status === "delivered" && !!order.id;
  const canMarkSold =
    isSeller &&
    (order.status === "pending" ||
      order.status === "confirmed" ||
      order.status === "shipped") &&
    !!order.id &&
    !!order.productId;
  const handleBack = () => {
    if (from === "items-sold") {
      router.replace({
        pathname: "/(tabs)/items-sold",
        params: { from: "profile" },
      } as any);
      return;
    }
    router.back();
  };

  const markAsSold = async () => {
    if (!order?.id || !order.productId) return;
    if (!canMarkSold || markingSold) return;
    setMarkingSold(true);
    try {
      const completedAt = new Date();
      const taxBase =
        typeof order.itemPrice === "number"
          ? order.itemPrice
          : parseFloat(String(order.itemPrice || 0));
      const productTax = parseFloat((taxBase * 0.0575).toFixed(2));

      setOrder((prev) =>
        prev
          ? {
            ...prev,
            status: "delivered",
            completedAt,
            productTax,
            taxPaid: false,
            taxProof: "",
          }
          : prev,
      );

      await updateOrder(order.id, {
        status: "delivered",
        completedAt,
        productTax,
        taxPaid: false,
        taxProof: "",
      });
      await updateProduct(order.productId, { status: "sold" });
    } finally {
      setMarkingSold(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ThemedText style={styles.backText}>Back</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Order Details</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.productRow}>
            <ImageWithLoader
              source={
                order.productImage
                  ? { uri: order.productImage }
                  : require("@/assets/images/products/product-1.png")
              }
              style={styles.productImage}
              loaderSize="small"
              debugLabel="OrderDetails"
            />
            <View style={styles.productText}>
              <ThemedText style={styles.productTitle} numberOfLines={2}>
                {order.productTitle || "Product"}
              </ThemedText>
              <ThemedText style={styles.metaText}>
                Order #{orderNumber}
              </ThemedText>
              <ThemedText style={styles.metaText}>Date: {orderDate}</ThemedText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <ThemedText style={styles.label}>Status</ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(order.status) + "20" },
              ]}
            >
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {getStatusText(order.status)}
              </ThemedText>
            </View>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Total</ThemedText>
            <ThemedText style={styles.value}>
              Rs{" "}
              {Number.isFinite(order.totalAmount)
                ? order.totalAmount.toLocaleString()
                : 0}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Payment</ThemedText>
            <ThemedText style={styles.value}>{order.paymentMethod}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Delivery</ThemedText>
            <ThemedText style={styles.value}>{order.deliveryMethod}</ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>Address</ThemedText>
            <ThemedText style={styles.value} numberOfLines={2}>
              {order.deliveryAddress ||
                order.pickupLocation ||
                "Address not specified"}
            </ThemedText>
          </View>
          <View style={styles.row}>
            <ThemedText style={styles.label}>{otherLabel}</ThemedText>
            <ThemedText style={styles.value} numberOfLines={1}>
              {displayOtherName}
            </ThemedText>
          </View>

          <View style={styles.divider} />

          <View style={styles.actionsRow}>
            {otherUserId ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={openMessage}
              >
                <Image
                  source={require("@/assets/images/icons/messages.png")}
                  style={styles.actionIcon}
                />
                <ThemedText style={styles.actionText} numberOfLines={1}>
                  {isSeller ? "Message buyer" : "Message seller"}
                </ThemedText>
              </TouchableOpacity>
            ) : null}
            {canMarkSold ? (
              <TouchableOpacity
                style={styles.actionButtonSuccess}
                onPress={markAsSold}
                disabled={markingSold}
              >
                {markingSold ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Image
                    source={require("@/assets/images/icons/check.png")}
                    style={styles.actionIconSuccess}
                  />
                )}
                <ThemedText style={styles.actionTextSuccess} numberOfLines={1}>
                  {markingSold ? "Marking…" : "Mark as sold"}
                </ThemedText>
              </TouchableOpacity>
            ) : null}
            {canRateSeller ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/review-seller/[id]",
                    params: {
                      id: order.id!,
                      returnTo: "order",
                      returnFrom: from || undefined,
                      highlightOrderId: order.id!,
                    },
                  } as any)
                }
              >
                <Image
                  source={require("@/assets/images/icons/star-filled.png")}
                  style={styles.actionIcon}
                />
                <ThemedText style={styles.actionText} numberOfLines={1}>
                  Rate seller
                </ThemedText>
              </TouchableOpacity>
            ) : null}
            {canUploadTax ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/order-tax/[id]",
                    params: {
                      id: order.id!,
                      returnTo: "order",
                      returnFrom: from || undefined,
                      highlightOrderId: order.id!,
                    },
                  } as any)
                }
              >
                <Image
                  source={require("@/assets/images/icons/star-yellow.png")}
                  style={styles.actionIcon}
                />
                <ThemedText style={styles.actionText} numberOfLines={1}>
                  Fee proof
                </ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </ScrollView>
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
  productRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  productImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  productText: {
    flex: 1,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  metaText: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
    width: 90,
  },
  value: {
    flex: 1,
    textAlign: "right",
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-end",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "48%",
    gap: 8,
  },
  actionIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    flexShrink: 1,
  },
  actionButtonSuccess: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#16A34A",
    backgroundColor: "#16A34A",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "48%",
    gap: 8,
  },
  actionIconSuccess: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    tintColor: "#FFFFFF",
  },
  actionTextSuccess: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    flexShrink: 1,
  },
});
