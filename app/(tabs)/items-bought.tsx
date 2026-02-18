import { OrderItem } from "@/app/components/OrderItem";
import { ThemedText } from "@/app/components/ThemedText";
import { getCurrentUser, getUserProfile } from "@/lib/auth";
import { getUserOrders, type Order } from "@/lib/firestore";
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

const shortId = (value: string) =>
  value.length > 16 ? `${value.slice(0, 6)}…${value.slice(-4)}` : value;

export default function ItemsBoughtScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const from = typeof params.from === "string" ? params.from : "";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
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
        const data = await getUserOrders(user.uid, "buyer");
        if (!active) return;
        setOrders(data);

        const sellerIds = Array.from(
          new Set(data.map((o) => o.sellerId).filter(Boolean)),
        );
        const entries = await Promise.all(
          sellerIds.map(async (uid) => {
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
      `/(tabs)/message/${otherUserId}?name=${encodeURIComponent(otherName)}&avatar=${encodeURIComponent(avatar)}&online=true&productId=${encodeURIComponent(productId)}&productTitle=${encodeURIComponent(productTitle)}&productImage=${encodeURIComponent(productImage)}&productPrice=${encodeURIComponent(productPrice)}&returnTo=items-bought&returnFrom=${encodeURIComponent(from)}&returnOrderId=${encodeURIComponent(order.id || "")}`,
    );
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOrders =
    normalizedQuery.length === 0
      ? orders
      : orders.filter((order) => {
        const otherUserId = order.sellerId;
        const otherName =
          order.sellerName || nameByUserId[otherUserId] || otherUserId || "";

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
        <ThemedText style={styles.headerTitle}>Items Bought</ThemedText>
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
              placeholder="Search bought orders"
              placeholderTextColor="#6B7280"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyTitle}>
                  No bought orders yet
                </ThemedText>
                <ThemedText style={styles.emptySubtitle}>
                  Your purchased orders will show up here.
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
                const otherUserId = order.sellerId;
                const otherName =
                  order.sellerName ||
                  nameByUserId[otherUserId] ||
                  shortId(otherUserId);
                const canRateSeller =
                  order.status === "delivered" && !!order.id;
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
                    counterpartyLabel="Seller"
                    counterpartyName={otherName}
                    productTax={order.productTax}
                    taxPaid={order.taxPaid}
                    isSeller={false}
                    onPress={() => {
                      if (!order.id) return;
                      router.push({
                        pathname: "/(tabs)/order/[id]",
                        params: { id: order.id },
                      } as any);
                    }}
                    onMessagePress={
                      otherUserId
                        ? () => openMessage(otherUserId, otherName, order)
                        : undefined
                    }
                    messageLabel="Message seller"
                    messageIcon={require("@/assets/images/icons/messages.png")}
                    onSecondaryPress={
                      canRateSeller
                        ? () =>
                          router.push({
                            pathname: "/(tabs)/review-seller/[id]",
                            params: {
                              id: order.id!,
                              returnTo: "items-bought",
                              returnFrom: from || undefined,
                              highlightOrderId: order.id!,
                            },
                          } as any)
                        : undefined
                    }
                    secondaryLabel="Rate seller"
                    secondaryIcon={require("@/assets/images/icons/star-filled.png")}
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
