import React from "react";
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { ImageWithLoader } from "./ImageWithLoader";
import { ThemedText } from "./ThemedText";

interface OrderItemProps {
  id: string;
  orderNumber?: string;
  productTitle: string;
  productImage?: string;
  amount: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  orderDate: string;
  deliveryAddress?: string;
  onPress?: () => void;
  productTax?: number;
  taxPaid?: boolean;
  isSeller?: boolean;
  counterpartyLabel?: string;
  counterpartyName?: string;
  onMessagePress?: () => void;
  messageLabel?: string;
  messageIcon?: ImageSourcePropType;
  onSecondaryPress?: () => void;
  secondaryLabel?: string;
  secondaryIcon?: ImageSourcePropType;
  secondaryVariant?: "default" | "success";
  onTaxPress?: () => void;
  taxLabel?: string;
  taxIcon?: ImageSourcePropType;
}

export function OrderItem({
  id,
  orderNumber,
  productTitle,
  productImage,
  amount,
  status,
  orderDate,
  deliveryAddress,
  productTax,
  taxPaid,
  isSeller,
  onPress,
  counterpartyLabel,
  counterpartyName,
  onMessagePress,
  messageLabel,
  messageIcon,
  onSecondaryPress,
  secondaryLabel,
  secondaryIcon,
  secondaryVariant = "default",
  onTaxPress,
  taxLabel,
  taxIcon,
}: OrderItemProps) {
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

  const showTaxUnpaidIndicator =
    isSeller &&
    typeof productTax === "number" &&
    productTax > 0 &&
    taxPaid === false;

  const actionsCount = [onMessagePress, onSecondaryPress, onTaxPress].filter(
    Boolean,
  ).length;
  const actionButtonStyle =
    actionsCount === 1 ? styles.actionButtonFull : styles.actionButton;

  const secondaryButtonStyle =
    secondaryVariant === "success"
      ? [actionButtonStyle, styles.actionButtonSuccess]
      : actionButtonStyle;
  const secondaryTextStyle =
    secondaryVariant === "success"
      ? [styles.actionText, styles.actionTextSuccess]
      : styles.actionText;
  const secondaryIconStyle =
    secondaryVariant === "success"
      ? [styles.actionIcon, styles.actionIconSuccess]
      : styles.actionIcon;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.mainRow}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.imageContainer}>
          <ImageWithLoader
            source={
              productImage
                ? { uri: productImage }
                : require("@/assets/images/products/product-1.png")
            }
            style={styles.productImage}
            loaderSize="small"
            debugLabel="OrderItem"
          />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <ThemedText style={styles.productTitle} numberOfLines={2}>
              {productTitle}
            </ThemedText>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status) + "20" },
              ]}
            >
              <ThemedText
                style={[styles.statusText, { color: getStatusColor(status) }]}
              >
                {getStatusText(status)}
              </ThemedText>
            </View>
          </View>

          <View style={styles.details}>
            <ThemedText style={styles.amount}>
              Rs {Number.isFinite(amount) ? amount.toLocaleString() : 0}
            </ThemedText>
            <View style={styles.detailsRight}>
              {showTaxUnpaidIndicator && (
                <View style={styles.taxIndicator}>
                  <View style={styles.taxDot} />
                  <ThemedText style={styles.taxIndicatorText}>
                    Fee unpaid
                  </ThemedText>
                </View>
              )}
              <ThemedText style={styles.orderDate}>{orderDate}</ThemedText>
            </View>
          </View>

          {deliveryAddress && (
            <ThemedText style={styles.deliveryAddress} numberOfLines={1}>
              📍 {deliveryAddress}
            </ThemedText>
          )}

          {counterpartyLabel && counterpartyName && (
            <View style={styles.counterpartyRow}>
              <ThemedText style={styles.counterpartyLabel}>
                {counterpartyLabel}:
              </ThemedText>
              <ThemedText style={styles.counterpartyName} numberOfLines={1}>
                {counterpartyName}
              </ThemedText>
            </View>
          )}

          <ThemedText style={styles.orderId}>
            Order #{orderNumber || id.slice(-8)}
          </ThemedText>
        </View>
      </TouchableOpacity>

      {(onMessagePress || onSecondaryPress || onTaxPress) && (
        <View style={styles.actionsRow}>
          {onMessagePress && (
            <TouchableOpacity
              style={actionButtonStyle}
              onPress={onMessagePress}
            >
              {messageIcon && (
                <Image source={messageIcon} style={styles.actionIcon} />
              )}
              <ThemedText style={styles.actionText} numberOfLines={1}>
                {messageLabel || "Message"}
              </ThemedText>
            </TouchableOpacity>
          )}
          {onSecondaryPress && (
            <TouchableOpacity
              style={secondaryButtonStyle}
              onPress={onSecondaryPress}
            >
              {secondaryIcon && (
                <Image source={secondaryIcon} style={secondaryIconStyle} />
              )}
              <ThemedText style={secondaryTextStyle} numberOfLines={1}>
                {secondaryLabel || "Action"}
              </ThemedText>
            </TouchableOpacity>
          )}
          {onTaxPress && (
            <TouchableOpacity style={actionButtonStyle} onPress={onTaxPress}>
              {taxIcon && <Image source={taxIcon} style={styles.actionIcon} />}
              <ThemedText style={styles.actionText} numberOfLines={1}>
                {taxLabel || "Fee proof"}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  mainRow: {
    flexDirection: "row",
  },
  imageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#020817",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16A34A",
  },
  orderDate: {
    fontSize: 14,
    color: "#6B7280",
  },
  taxIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  taxDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 4,
  },
  taxIndicatorText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  deliveryAddress: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  counterpartyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  counterpartyLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginRight: 6,
  },
  counterpartyName: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    flex: 1,
  },
  orderId: {
    fontSize: 12,
    color: "#9CA3AF",
    fontFamily: "monospace",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "48%",
    gap: 8,
  },
  actionButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "100%",
    gap: 8,
  },
  actionIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },
  actionButtonSuccess: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  actionTextSuccess: {
    color: "#FFFFFF",
  },
  actionIconSuccess: {
    tintColor: "#FFFFFF",
  },
});
