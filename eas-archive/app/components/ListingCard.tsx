import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { getCurrentUser } from "../../lib/auth";
import {
  addToFavorites,
  isProductFavorited,
  removeFromFavorites,
} from "../../lib/firestore";
import { ImageWithLoader } from "./ImageWithLoader";
import { ThemedText } from "./ThemedText";

interface Props {
  id?: string;
  image: ImageSourcePropType;
  title: string;
  currentBid: number;
  buyNowPrice: number;
  timeLeft: string;
  bidsCount: number;
  condition: 'New' | 'Used';
  isNewListing?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  showMarkSoldButton?: boolean;
  markSoldLoading?: boolean;
  onMarkSoldPress?: () => void;
}

export const ListingCard = ({
  id,
  image,
  title,
  currentBid,
  buyNowPrice,
  timeLeft,
  bidsCount,
  condition,
  isNewListing,
  onPress,
  onLongPress,
  showMarkSoldButton,
  markSoldLoading,
  onMarkSoldPress,
}: Props) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const user = getCurrentUser();
    const listingId = typeof id === "string" ? id : "";
    if (!user || !listingId) {
      setIsFavorited(false);
      return () => {
        active = false;
      };
    }

    isProductFavorited(user.uid, listingId)
      .then((v) => {
        if (!active) return;
        setIsFavorited(v);
      })
      .catch(() => {
        if (!active) return;
        setIsFavorited(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (id) {
      router.push(`/(tabs)/product/${id}` as any);
    }
  };

  const handleToggleFavorite = async () => {
    const user = getCurrentUser();
    const listingId = typeof id === "string" ? id : "";
    if (!listingId) return;
    if (!user) {
      Alert.alert("Login required", "Please log in to add favorites.");
      return;
    }
    if (favoriteBusy) return;
    const next = !isFavorited;
    setIsFavorited(next);
    try {
      setFavoriteBusy(true);
      if (next) {
        await addToFavorites(user.uid, listingId);
      } else {
        await removeFromFavorites(user.uid, listingId);
      }
    } catch {
      setIsFavorited(!next);
      Alert.alert("Error", "Failed to update favorites");
    } finally {
      setFavoriteBusy(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={onLongPress}
    >
      <View style={styles.imageContainer}>
        <ImageWithLoader
          source={image}
          style={styles.image}
          resizeMode="cover"
          loaderSize="small"
          debugLabel={`Listing Card: ${title}`}
        />
        <View
          style={[
            styles.badge,
            { backgroundColor: condition === "New" ? "#DBEAFE" : "#FEF3C7" },
          ]}
        >
          <ThemedText
            style={[
              styles.badgeText,
              { color: condition === "New" ? "#1E40AF" : "#92400E" },
            ]}
          >
            {condition}
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e: any) => {
            e?.stopPropagation?.();
            handleToggleFavorite();
          }}
          disabled={favoriteBusy}
        >
          {favoriteBusy ? (
            <ActivityIndicator size="small" color="#16A34A" />
          ) : (
            <Image
              source={
                isFavorited
                  ? require("../../assets/images/icons/favorite-indigo.png")
                  : require("../../assets/images/icons/heart.png")
              }
              style={
                isFavorited ? styles.favoriteIconSelected : styles.favoriteIcon
              }
            />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        {isNewListing && (
          <View style={styles.categoryBadge}>
            <ThemedText style={styles.categoryText}>New Listing</ThemedText>
          </View>
        )}
        <ThemedText style={styles.title} numberOfLines={2}>
          {title}
        </ThemedText>

        <View style={styles.pricingContainer}>
          <View>
            <ThemedText style={styles.priceLabel}>Current Bid</ThemedText>
            <ThemedText style={styles.currentBid}>
              Rs {currentBid.toLocaleString()}
            </ThemedText>
          </View>
          <View>
            <ThemedText style={styles.priceLabel}>Buy Now</ThemedText>
            <ThemedText style={styles.buyNowPrice}>
              Rs {buyNowPrice.toLocaleString()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Image
              source={require('../../assets/images/icons/clock.png')}
              style={styles.statIcon}
            />
            <ThemedText style={styles.statText}>{timeLeft}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <Image
              source={require('../../assets/images/icons/tag.png')}
              style={styles.statIcon}
            />
            <ThemedText style={styles.statText}>{bidsCount} bids</ThemedText>
          </View>
        </View>

        {showMarkSoldButton && (
          <TouchableOpacity
            style={[
              styles.markSoldButton,
              markSoldLoading && styles.markSoldButtonDisabled,
            ]}
            onPress={(e: any) => {
              e?.stopPropagation?.();
              onMarkSoldPress?.();
            }}
            disabled={!!markSoldLoading}
          >
            <View style={styles.markSoldButtonRow}>
              <Image
                source={require("../../assets/images/icons/check.png")}
                style={styles.markSoldIcon}
              />
              <ThemedText style={styles.markSoldButtonText}>
                {markSoldLoading ? "Updating…" : "Mark as Sold"}
              </ThemedText>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8FAFC',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    left: 12,
    top: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    width: 16,
    height: 16,
    tintColor: '#6B7280',
  },
  favoriteIconSelected: {
    width: 16,
    height: 16,
  },
  infoContainer: {
    padding: 16,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F3FCF7',
    borderRadius: 9999,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#16A34A',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020817',
    marginBottom: 4,
  },
  pricingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  currentBid: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
  buyNowPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#020817',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  statText: {
    fontSize: 14,
    color: '#64748B',
  },
  markSoldButton: {
    marginTop: 12,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
  },
  markSoldButtonDisabled: {
    opacity: 0.7,
  },
  markSoldButtonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  markSoldIcon: {
    width: 16,
    height: 16,
    tintColor: "#FFFFFF",
  },
  markSoldButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
