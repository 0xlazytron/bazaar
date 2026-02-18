import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getCurrentUser,
  subscribeUserProfile,
  UserProfile,
} from "../../lib/auth";
import { db } from "../../lib/firebase";
import {
  createCall,
  getProduct,
  markConversationAsRead,
  Message,
  sendMessage,
  setTyping,
  subscribeMessages,
  subscribeTyping,
} from "../../lib/firestore";
import { registerNotificationsAsync } from "../../lib/notifications";
import { uploadMessageImage } from "../../lib/storage";
import { ImageWithLoader } from "../components/ImageWithLoader";
import { useToast } from "../components/ToastContext";

type MessageDetailScreenProps = Record<string, never>;

type MessageBubbleProps = {
  text: string;
  time: string;
  isUser?: boolean;
  imageUrl?: string;
  onImagePress?: (url: string) => void;
  onImageLongPress?: (url: string) => void;
};

type ProductCardProps = {
  name: string;
  price: string;
  image: any;
  onView?: () => void;
};

// No longer need RootStackParamList with expo-router

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  time,
  isUser = false,
  imageUrl,
  onImagePress,
  onImageLongPress,
}) => {
  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isUser ? styles.userMessageContainer : styles.otherMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessage : styles.otherMessage,
        ]}
      >
        {imageUrl ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onImagePress?.(imageUrl)}
            onLongPress={() => onImageLongPress?.(imageUrl)}
            delayLongPress={250}
          >
            <ImageWithLoader
              source={{ uri: imageUrl }}
              fallbackSource={require("../../assets/images/products/product-1.png")}
              style={styles.messageImage}
              loaderSize="medium"
              debugLabel="ChatMessageImage"
            />
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.otherMessageText,
            ]}
          >
            {text}
          </Text>
        )}
        <Text
          style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.otherMessageTime,
          ]}
        >
          {time}
        </Text>
      </View>
    </View>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  price,
  image,
  onView,
}) => {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <ImageWithLoader
          source={image}
          fallbackSource={require("../../assets/images/products/iphone.png")}
          style={styles.productImage}
          loaderSize="small"
          debugLabel="ChatProductImage"
        />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{name}</Text>
        <Text style={styles.productPrice}>{price}</Text>
      </View>
      <TouchableOpacity style={styles.viewButton} onPress={onView}>
        <Text style={styles.viewButtonText}>View</Text>
      </TouchableOpacity>
    </View>
  );
};

const MessageDetailScreen: React.FC<MessageDetailScreenProps> = () => {
  const [message, setMessage] = useState("");
  const [messagesState, setMessagesState] = useState<Message[]>([]);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [previewLayout, setPreviewLayout] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [typingState, setTypingState] = useState<{ [userId: string]: boolean }>(
    {},
  );
  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [refProductId, setRefProductId] = useState<string>("");
  const [refProductTitle, setRefProductTitle] = useState<string>("");
  const [refProductImage, setRefProductImage] = useState<string>("");
  const [refProductPrice, setRefProductPrice] = useState<string>("");
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const peerId = (params.id as string) || "";
  const name = (params.name as string) || "John Doe";
  const online = !!peerProfile?.online;
  const productId = (params.productId as string) || "";
  const productTitle = (params.productTitle as string) || "";
  const productImage = (params.productImage as string) || "";
  const productPrice = (params.productPrice as string) || "";
  const returnTo = (params.returnTo as string) || "";
  const returnOrderId = (params.returnOrderId as string) || "";
  const returnFrom = (params.returnFrom as string) || "";
  const returnActiveTab = (params.returnActiveTab as string) || "";
  const returnScrollTo = (params.returnScrollTo as string) || "";

  const currentUser = useMemo(() => getCurrentUser(), []);
  const conversationId = useMemo(() => {
    const uid = currentUser?.uid || "";
    return [uid, peerId].sort().join("_");
  }, [currentUser?.uid, peerId]);

  useEffect(() => {
    registerNotificationsAsync().catch(() => { });
    if (!conversationId) return;
    setConversationLoading(true);
    const unsub = subscribeMessages(conversationId, (msgs) => {
      setMessagesState(msgs);
      setConversationLoading(false);
    });
    const typingUnsub = subscribeTyping(conversationId, setTypingState);
    const convUnsub = onSnapshot(
      doc(db, "conversations", conversationId),
      async (snap) => {
        if (snap.exists()) {
          const data: any = snap.data();
          const pid = data.productId || "";
          setRefProductId(pid);
          if (pid) {
            const product = await getProduct(pid);
            if (product) {
              setRefProductTitle(product.title || "Product");
              setRefProductImage(product.images?.[0] || "");
              setRefProductPrice(product.price?.toString() || "0");
            }
          }
        }
      },
    );
    const profUnsub = subscribeUserProfile(peerId, (p) => setPeerProfile(p));
    return () => {
      unsub();
      typingUnsub();
      convUnsub();
      profUnsub();
    };
  }, [conversationId, peerId]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    markConversationAsRead(conversationId, currentUser.uid).catch(() => { });
  }, [conversationId, currentUser]);

  const handleSend = async () => {
    if (!message.trim() || !currentUser || !peerId) return;
    await sendMessage({
      senderId: currentUser.uid,
      receiverId: peerId,
      productId: (params.productId as string) || undefined,
      content: message.trim(),
      type: "text",
      isRead: false,
    });
    setMessage("");
    setTyping(conversationId, currentUser.uid, false).catch(() => { });
  };

  useEffect(() => {
    let typingTimer: any;
    if (currentUser && conversationId) {
      setTyping(
        conversationId,
        currentUser.uid,
        !!message && message.length > 0,
      ).catch(() => { });
      typingTimer = setTimeout(() => {
        setTyping(conversationId, currentUser.uid, false).catch(() => { });
      }, 3000);
    }
    return () => typingTimer && clearTimeout(typingTimer);
  }, [message, conversationId, currentUser]);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const resetZoom = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  const openImagePreview = (url: string) => {
    setPreviewImageUrl(url);
    setPreviewVisible(true);
    setDownloadProgress(null);
    resetZoom();
  };

  const closeImagePreview = () => {
    setPreviewVisible(false);
    setTimeout(() => setPreviewImageUrl(null), 150);
    setDownloadProgress(null);
    resetZoom();
  };

  const saveImageToDevice = async (url: string) => {
    if (savingImage) return;
    setSavingImage(true);
    setDownloadProgress(null);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (!perm.granted) {
        showToast("Photo permission is required to save images", "error");
        return;
      }

      const base = url.split("?")[0] || url;
      const extMatch = base.match(/\.(jpg|jpeg|png|webp|heic|gif)$/i);
      const ext = (extMatch?.[1] || "jpg").toLowerCase();
      const fileName = `bazaar-message-${Date.now()}.${ext}`;
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || "";
      const dest = `${baseDir}${fileName}`;

      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        dest,
        {},
        (progress) => {
          const total = progress.totalBytesExpectedToWrite;
          if (!total || total <= 0) return;
          setDownloadProgress(progress.totalBytesWritten / total);
        },
      );

      const result = await downloadResumable.downloadAsync();
      if (!result?.uri) throw new Error("Download failed");

      await MediaLibrary.saveToLibraryAsync(result.uri);
      setDownloadProgress(1);
      if (previewVisible) {
        closeImagePreview();
        setTimeout(() => showToast("Image saved to device", "success"), 250);
      } else {
        showToast("Image saved to device", "success");
      }
    } catch {
      showToast("Failed to save image", "error");
    } finally {
      setSavingImage(false);
      setTimeout(() => setDownloadProgress(null), 700);
    }
  };

  const showImageOptions = (url: string) => {
    const onPreview = () => openImagePreview(url);
    const onSave = () => saveImageToDevice(url);
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Preview", "Save to device", "Cancel"],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) onPreview();
          if (buttonIndex === 1) onSave();
        },
      );
      return;
    }
    Alert.alert("Image", undefined, [
      { text: "Preview", onPress: onPreview },
      { text: "Save to device", onPress: onSave },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const previewGesture = useMemo(() => {
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd(() => {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      });

    const pinch = Gesture.Pinch()
      .onUpdate((e) => {
        const next = savedScale.value * e.scale;
        scale.value = Math.max(1, Math.min(next, 4));
      })
      .onEnd(() => {
        savedScale.value = scale.value;
        if (scale.value <= 1) {
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
        }
      });

    const pan = Gesture.Pan()
      .onUpdate((e) => {
        if (scale.value <= 1) return;
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      })
      .onEnd(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    return Gesture.Exclusive(doubleTap, Gesture.Simultaneous(pinch, pan));
  }, [
    savedScale,
    savedTranslateX,
    savedTranslateY,
    scale,
    translateX,
    translateY,
  ]);

  const previewImageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const pickImageAndSend = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (result.canceled || !currentUser || !peerId) return;
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const url = await uploadMessageImage(
        blob,
        conversationId,
        currentUser.uid,
      );
      await sendMessage({
        senderId: currentUser.uid,
        receiverId: peerId,
        productId: (params.productId as string) || undefined,
        content: "",
        type: "image",
        isRead: false,
        attachmentUrl: url,
        attachmentType: "image",
      } as any);
    } catch (error) {
      console.error("Image send error:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (returnTo === "profile") {
              router.replace({
                pathname: "/(tabs)/profile",
                params: {
                  activeTab: returnActiveTab || "orders",
                  scrollTo: returnScrollTo || undefined,
                  highlightOrderId: returnOrderId || undefined,
                },
              } as any);
              return;
            }
            if (returnTo === "order" && returnOrderId) {
              router.replace({
                pathname: "/(tabs)/order/[id]",
                params: { id: returnOrderId, from: returnFrom || undefined },
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
            if (returnTo === "items-bought") {
              router.replace({
                pathname: "/(tabs)/items-bought",
                params: { from: returnFrom || undefined },
              } as any);
              return;
            }
            router.replace("/(tabs)/messages");
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#020817" />
        </TouchableOpacity>
        <ImageWithLoader
          source={
            peerProfile?.photoURL
              ? { uri: peerProfile.photoURL }
              : require("../../assets/images/avatar.png")
          }
          fallbackSource={require("../../assets/images/avatar.png")}
          style={styles.headerAvatar}
          loaderSize="small"
          debugLabel="ChatHeaderAvatar"
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerStatus}>
            {online ? "Online" : "Offline"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={async () => {
            if (!currentUser || !peerId) return;
            const callId = await createCall({
              callerId: currentUser.uid,
              calleeId: peerId,
              type: "voice",
              status: "initiated",
            });
            router.push({
              pathname: "/(tabs)/call/[id]",
              params: { id: callId },
            });
          }}
        >
          <Feather name="phone" size={16} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={async () => {
            if (!currentUser || !peerId) return;
            const callId = await createCall({
              callerId: currentUser.uid,
              calleeId: peerId,
              type: "video",
              status: "initiated",
            });
            router.push({
              pathname: "/(tabs)/call/[id]",
              params: { id: callId },
            });
          }}
        >
          <Feather name="video" size={16} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="more-vertical" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {conversationLoading ? (
        <View style={styles.conversationLoader}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      ) : (
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messagesState.map((msg, index) => (
            <MessageBubble
              key={msg.id || index}
              text={msg.type === "image" ? "" : msg.content}
              time={new Date(
                (msg.createdAt as any)?.seconds
                  ? (msg.createdAt as any).seconds * 1000
                  : msg.createdAt,
              ).toLocaleTimeString()}
              isUser={msg.senderId === currentUser?.uid}
              imageUrl={msg.attachmentUrl}
              onImagePress={openImagePreview}
              onImageLongPress={showImageOptions}
            />
          ))}
          {typingState &&
            Object.entries(typingState).some(
              ([uid, t]) => t && uid !== currentUser?.uid,
            ) && (
              <View style={{ paddingVertical: 8 }}>
                <Text style={{ color: "#6B7280" }}>Typing…</Text>
              </View>
            )}
        </ScrollView>
      )}

      <ProductCard
        name={productTitle || refProductTitle || "Product"}
        price={
          productPrice || refProductPrice
            ? `Rs ${productPrice || refProductPrice}`
            : "Rs 0"
        }
        image={
          productImage || refProductImage
            ? { uri: productImage || refProductImage }
            : require("../../assets/images/products/iphone.png")
        }
        onView={() => {
          const targetId = productId || refProductId;
          if (targetId) router.push(`/(tabs)/product/${targetId}`);
        }}
      />

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: 12 + Math.max(insets.bottom, 0) },
        ]}
      >
        <TouchableOpacity
          style={styles.attachButton}
          onPress={pickImageAndSend}
        >
          <Feather name="image" size={16} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={message}
            onChangeText={setMessage}
            multiline
          />
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            message.trim() ? styles.sendButtonActive : {},
          ]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <MaterialCommunityIcons name="send" size={16} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={closeImagePreview}
      >
        <GestureHandlerRootView style={styles.previewOverlay}>
          <View
            style={[
              styles.previewHeader,
              { paddingTop: Math.max(insets.top, 0) + 12 },
            ]}
          >
            <TouchableOpacity
              style={styles.previewHeaderButton}
              onPress={closeImagePreview}
              disabled={savingImage}
            >
              <Feather name="x" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.previewHeaderButton}
              onPress={() => (previewImageUrl ? saveImageToDevice(previewImageUrl) : undefined)}
              disabled={!previewImageUrl || savingImage}
            >
              {savingImage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Feather name="download" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          {savingImage ? (
            <View style={styles.previewProgressWrap}>
              <View style={styles.previewProgressTrack}>
                <View
                  style={[
                    styles.previewProgressFill,
                    {
                      width: `${Math.round(
                        ((downloadProgress ?? 0) * 100) as number,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.previewProgressText}>
                {downloadProgress === null
                  ? "Downloading…"
                  : `${Math.round(downloadProgress * 100)}%`}
              </Text>
            </View>
          ) : null}
          <View
            style={styles.previewBody}
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              if (!width || !height) return;
              setPreviewLayout({ width, height });
            }}
          >
            {previewImageUrl ? (
              Platform.OS === "ios" ? (
                (() => {
                  const w = previewLayout.width || viewportWidth;
                  const h = previewLayout.height || viewportHeight;
                  return (
                    <ScrollView
                      style={{ flex: 1 }}
                      contentContainerStyle={{
                        width: w,
                        height: h,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                      minimumZoomScale={1}
                      maximumZoomScale={4}
                      bouncesZoom
                      pinchGestureEnabled
                      centerContent
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                    >
                      <Image
                        source={{ uri: previewImageUrl }}
                        style={{
                          width: w,
                          height: h,
                        }}
                        resizeMode="contain"
                      />
                    </ScrollView>
                  );
                })()
              ) : (
                <GestureDetector gesture={previewGesture}>
                  <Animated.Image
                    source={{ uri: previewImageUrl }}
                    style={[styles.previewImage, previewImageAnimatedStyle]}
                    resizeMode="contain"
                  />
                </GestureDetector>
              )
            ) : null}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === "ios" ? 50 : 30, // Add extra padding for status bar
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  headerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginLeft: 8,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  headerStatus: {
    fontSize: 12,
    color: "#6B7280",
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  conversationLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
  },
  previewHeader: {
    width: "100%",
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewHeaderButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  previewBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewProgressWrap: {
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  previewProgressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 999,
    overflow: "hidden",
  },
  previewProgressFill: {
    height: 4,
    backgroundColor: "#22C55E",
  },
  previewProgressText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 8,
  },
  messageBubbleContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    minHeight: 40,
  },
  messageImage: {
    width: 220,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  userMessage: {
    backgroundColor: "#16A34A",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: "white",
  },
  otherMessageText: {
    color: "#1F2937",
  },
  messageTime: {
    fontSize: 12,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  userMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  otherMessageTime: {
    color: "#6B7280",
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  productImage: {
    width: 48,
    height: 48,
    resizeMode: "cover",
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
    marginTop: 4,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 0.8,
    borderTopColor: "#E5E7EB",
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  textInputContainer: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    color: "#1F2937",
    padding: 0,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#16A34A",
    opacity: 0.5,
  },
  sendButtonActive: {
    opacity: 1,
  },
});

export default MessageDetailScreen;
