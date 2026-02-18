import { OrderItem } from "@/app/components/OrderItem";
import { ThemedText } from "@/app/components/ThemedText";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import { getUserOrders, updateOrder, updateProduct, type Order } from "@/lib/firestore";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const shortId = (value: string) =>
  value.length > 16 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

export default function ItemsSoldScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const from = typeof params.from === "string" ? params.from : "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "delivered"
  >("all");
  const [markingOrderId, setMarkingOrderId] = useState<string>("");

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
        const data = await getUserOrders(user.uid, "seller");
        if (!active) return;
        setOrders(data);

        const buyerIds = Array.from(
          new Set(data.map((o) => o.buyerId).filter(Boolean)),
        );
        const entries = await Promise.all(
          buyerIds.map(async (uid) => {
            try {
              const p = await getUserProfile(uid);
              return [uid, p?.displayName || ""] as const;
            } catch {
              return [uid, ""] as const;
            }
          }),
        );
        if (!active) return;
        const next: Record<string, string> = {};
        for (const [uid, name] of entries) next[uid] = name;
        setNameByUserId(next);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const openMessage = (
    otherUserId: string,
    otherName: string,
    order: Order,
  ) => {
    const avatar = "";
    const productId = order.productId || "";
    const productTitle = order.productTitle || "";
    const productImage = order.productImage || "";
    const productPrice = (order.itemPrice ?? order.totalAmount ?? 0).toString();
    router.push(
      `/(tabs)/message/${otherUserId}?name=${encodeURIComponent(otherName)}&avatar=${encodeURIComponent(avatar)}&online=true&productId=${encodeURIComponent(productId)}&productTitle=${encodeURIComponent(productTitle)}&productImage=${encodeURIComponent(productImage)}&productPrice=${encodeURIComponent(productPrice)}&returnTo=items-sold&returnFrom=${encodeURIComponent(from)}&returnOrderId=${encodeURIComponent(order.id || "")}`,
    );
  };

  const normalizedQuery = query.trim().toLowerCase();
  const statusFilteredOrders = orders.filter((order) => {
    if (statusFilter === "all") return true;
    const isPendingDelivery =
      order.status === "pending" ||
      order.status === "confirmed" ||
      order.status === "shipped";
    if (statusFilter === "pending") return isPendingDelivery;
    return order.status === "delivered";
  });

  const filteredOrders =
    normalizedQuery.length === 0
      ? statusFilteredOrders
      : statusFilteredOrders.filter((order) => {
        const otherUserId = order.buyerId;
        const otherName =
          order.buyerName ||
          order.buyerEmail ||
          nameByUserId[otherUserId] ||
          otherUserId ||
          "";

        const haystack = [
          order.productTitle,
          order.orderNumber,
          order.status,
          order.id,
          otherName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      });

  const markAsSold = async (order: Order) => {
    if (!order.id || !order.productId) return;
    if (markingOrderId) return;
    if (
      !(
        order.status === "pending" ||
        order.status === "confirmed" ||
        order.status === "shipped"
      )
    )
      return;

    setMarkingOrderId(order.id);
    try {
      const completedAt = new Date();
      const taxBase =
        typeof order.itemPrice === "number"
          ? order.itemPrice
          : parseFloat(String(order.itemPrice || 0));
      const productTax = parseFloat((taxBase * 0.0515).toFixed(2));

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
              ...o,
              status: "delivered",
              completedAt,
              productTax,
              taxPaid: false,
              taxProof: "",
            }
            : o,
        ),
      );

      await updateOrder(order.id, {
        status: "delivered",
        completedAt,
        productTax,
        taxPaid: false,
        taxProof: "",
      });
      await updateProduct(order.productId, { status: "sold" });
    } catch {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)),
      );
      Alert.alert("Error", "Could not mark item as sold. Please try again.");
    } finally {
      setMarkingOrderId("");
    }
  };

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
        <ThemedText style={styles.headerTitle}>Items Sold</ThemedText>
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
              placeholder="Search orders"
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <View style={styles.filtersRow}>
            <TouchableOpacity
              style={[
                styles.filterPill,
                statusFilter === "all" ? styles.filterPillActive : undefined,
              ]}
              onPress={() => setStatusFilter("all")}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  statusFilter === "all"
                    ? styles.filterTextActive
                    : undefined,
                ]}
              >
                All
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterPill,
                statusFilter === "pending"
                  ? styles.filterPillActive
                  : undefined,
              ]}
              onPress={() => setStatusFilter("pending")}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  statusFilter === "pending"
                    ? styles.filterTextActive
                    : undefined,
                ]}
              >
                Pending
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterPill,
                statusFilter === "delivered"
                  ? styles.filterPillActive
                  : undefined,
              ]}
              onPress={() => setStatusFilter("delivered")}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  statusFilter === "delivered"
                    ? styles.filterTextActive
                    : undefined,
                ]}
              >
                Delivered
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>
                  No sold orders yet
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Your sold orders will show up here.
                </ThemedText>
              </View>
            ) : filteredOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>No matches</ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Try a different search.
                </ThemedText>
              </View>
            ) : (
              filteredOrders.map((order) => {
                const otherUserId = order.buyerId;
                const otherName =
                  order.buyerName ||
                  order.buyerEmail ||
                  nameByUserId[otherUserId] ||
                  shortId(otherUserId);
                const canOpenTax = order.status === "delivered" && !!order.id;
                const canMarkSold =
                  (order.status === "pending" ||
                    order.status === "confirmed" ||
                    order.status === "shipped") &&
                  !!order.id &&
                  !!order.productId;
                return (
                  <OrderItem
                    key={order.id}
                    id={order.id || ""}
                    orderNumber={order.orderNumber}
                    productTitle={order.productTitle || "Unknown Product"}
                    productImage={order.productImage}
                    amount={order.totalAmount}
                    status={order.status}
                    orderDate={
                      order.createdAt instanceof Date
                        ? order.createdAt.toLocaleDateString()
                        : new Date(
                          (order.createdAt as any).seconds * 1000,
                        ).toLocaleDateString()
                    }
                    deliveryAddress={
                      order.deliveryAddress ||
                      order.pickupLocation ||
                      "Address not specified"
                    }
                    counterpartyLabel="Buyer"
                    counterpartyName={otherName}
                    productTax={order.productTax}
                    taxPaid={order.taxPaid}
                    isSeller={true}
                    onPress={() => {
                      if (!order.id) return;
                      router.push({
                        pathname: "/(tabs)/order/[id]",
                        params: { id: order.id, from: "items-sold" },
                      } as any);
                    }}
                    onMessagePress={
                      otherUserId
                        ? () => openMessage(otherUserId, otherName, order)
                        : undefined
                    }
                    messageLabel="Message buyer"
                    messageIcon={require("@/assets/images/icons/messages.png")}
                    onSecondaryPress={
                      canMarkSold ? () => markAsSold(order) : undefined
                    }
                    secondaryLabel={
                      canMarkSold
                        ? markingOrderId === order.id
                          ? "Marking…"
                          : "Mark as sold"
                        : undefined
                    }
                    secondaryIcon={
                      canMarkSold
                        ? require("@/assets/images/icons/check.png")
                        : undefined
                    }
                    secondaryVariant={canMarkSold ? "success" : "default"}
                    onTaxPress={
                      canOpenTax
                        ? () =>
                          router.push({
                            pathname: "/(tabs)/order-tax/[id]",
                            params: {
                              id: order.id!,
                              returnTo: "items-sold",
                              returnFrom: from || undefined,
                              highlightOrderId: order.id!,
                            },
                          } as any)
                        : undefined
                    }
                    taxLabel="Tax proof"
                    taxIcon={require("@/assets/images/icons/star-yellow.png")}
                  />
                );
              })
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
  filtersRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 10,
    gap: 10,
  },
  filterPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  filterPillActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  filterTextActive: {
    color: "#FFFFFF",
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
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
