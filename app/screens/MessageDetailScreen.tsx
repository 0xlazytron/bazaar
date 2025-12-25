import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCurrentUser, subscribeUserProfile, UserProfile } from '../../lib/auth';
import { sendMessage, subscribeMessages, Message, setTyping, subscribeTyping, createCall, getProduct, markConversationAsRead } from '../../lib/firestore';
import { registerNotificationsAsync } from '../../lib/notifications';
import { db } from '../../lib/firebase';
import { uploadMessageImage } from '../../lib/storage';

type MessageDetailScreenProps = Record<string, never>;

type MessageBubbleProps = {
  text: string;
  time: string;
  isUser?: boolean;
  imageUrl?: string;
};

type ProductCardProps = {
  name: string;
  price: string;
  image: any;
  onView?: () => void;
};

// No longer need RootStackParamList with expo-router

const MessageBubble: React.FC<MessageBubbleProps> = ({ text, time, isUser = false, imageUrl }) => {
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
          <Image source={{ uri: imageUrl }} style={{ width: 200, height: 200, borderRadius: 8 }} />
        ) : (
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.otherMessageText]}>
            {text}
          </Text>
        )}
        <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.otherMessageTime]}>
          {time}
        </Text>
      </View>
    </View>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({ name, price, image, onView }) => {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <Image source={image} style={styles.productImage} />
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
  const [message, setMessage] = useState('');
  const [messagesState, setMessagesState] = useState<Message[]>([]);
  const [typingState, setTypingState] = useState<{ [userId: string]: boolean }>({});
  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null);
  const [refProductId, setRefProductId] = useState<string>('');
  const [refProductTitle, setRefProductTitle] = useState<string>('');
  const [refProductImage, setRefProductImage] = useState<string>('');
  const [refProductPrice, setRefProductPrice] = useState<string>('');
  const router = useRouter();
  const params = useLocalSearchParams();
  const peerId = (params.id as string) || '';
  const name = (params.name as string) || 'John Doe';
  const online = !!peerProfile?.online;
  const productId = (params.productId as string) || '';
  const productTitle = (params.productTitle as string) || '';
  const productImage = (params.productImage as string) || '';
  const productPrice = (params.productPrice as string) || '';

  const currentUser = useMemo(() => getCurrentUser(), []);
  const conversationId = useMemo(() => {
    const uid = currentUser?.uid || '';
    return [uid, peerId].sort().join('_');
  }, [currentUser?.uid, peerId]);


  useEffect(() => {
    registerNotificationsAsync().catch(() => {});
    if (!conversationId) return;
    const unsub = subscribeMessages(conversationId, setMessagesState);
    const typingUnsub = subscribeTyping(conversationId, setTypingState);
    const convUnsub = onSnapshot(doc(db, 'conversations', conversationId), async (snap) => {
      if (snap.exists()) {
        const data: any = snap.data();
        const pid = data.productId || '';
        setRefProductId(pid);
        if (pid) {
          const product = await getProduct(pid);
          if (product) {
            setRefProductTitle(product.title || 'Product');
            setRefProductImage(product.images?.[0] || '');
            setRefProductPrice(product.price?.toString() || '0');
          }
        }
      }
    });
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
    markConversationAsRead(conversationId, currentUser.uid).catch(() => {});
  }, [conversationId, currentUser]);

  

  

  const handleSend = async () => {
    if (!message.trim() || !currentUser || !peerId) return;
    await sendMessage({
      senderId: currentUser.uid,
      receiverId: peerId,
      productId: (params.productId as string) || undefined,
      content: message.trim(),
      type: 'text',
      isRead: false,
    });
    setMessage('');
    setTyping(conversationId, currentUser.uid, false).catch(() => {});
  };

  useEffect(() => {
    let typingTimer: any;
    if (currentUser && conversationId) {
      setTyping(conversationId, currentUser.uid, !!message && message.length > 0).catch(() => {});
      typingTimer = setTimeout(() => {
        setTyping(conversationId, currentUser.uid, false).catch(() => {});
      }, 3000);
    }
    return () => typingTimer && clearTimeout(typingTimer);
  }, [message, conversationId, currentUser]);

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
      const url = await uploadMessageImage(blob, conversationId, currentUser.uid);
      await sendMessage({
        senderId: currentUser.uid,
        receiverId: peerId,
        productId: (params.productId as string) || undefined,
        content: '',
        type: 'image',
        isRead: false,
        attachmentUrl: url,
        attachmentType: 'image',
      } as any);
    } catch (error) {
      console.error('Image send error:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/messages')} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#020817" />
        </TouchableOpacity>
        {peerProfile?.photoURL ? (
          <Image source={{ uri: peerProfile.photoURL }} style={styles.headerAvatar} />
        ) : (
          <Image source={require('../../assets/images/avatar.png')} style={styles.headerAvatar} />
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{name}</Text>
          <Text style={styles.headerStatus}>{online ? 'Online' : 'Offline'}</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={async () => {
          if (!currentUser || !peerId) return;
          const callId = await createCall({ callerId: currentUser.uid, calleeId: peerId, type: 'voice', status: 'initiated' });
          router.push({ pathname: '/(tabs)/call/[id]', params: { id: callId } });
        }}>
          <Feather name="phone" size={16} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon} onPress={async () => {
          if (!currentUser || !peerId) return;
          const callId = await createCall({ callerId: currentUser.uid, calleeId: peerId, type: 'video', status: 'initiated' });
          router.push({ pathname: '/(tabs)/call/[id]', params: { id: callId } });
        }}>
          <Feather name="video" size={16} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerIcon}>
          <Feather name="more-vertical" size={16} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messagesState.map((msg, index) => (
          <MessageBubble
            key={msg.id || index}
            text={msg.type === 'image' ? '' : msg.content}
            time={new Date((msg.createdAt as any)?.seconds ? (msg.createdAt as any).seconds * 1000 : msg.createdAt).toLocaleTimeString()}
            isUser={msg.senderId === currentUser?.uid}
            imageUrl={msg.attachmentUrl}
          />
        ))}
        {typingState && Object.entries(typingState).some(([uid, t]) => t && uid !== currentUser?.uid) && (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#6B7280' }}>Typing…</Text>
          </View>
        )}
      </ScrollView>

      <ProductCard
        name={(productTitle || refProductTitle) || 'Product'}
        price={(productPrice || refProductPrice) ? `Rs ${(productPrice || refProductPrice)}` : 'Rs 0'}
        image={(productImage || refProductImage) ? { uri: (productImage || refProductImage) } : require('../../assets/images/products/iphone.png')}
        onView={() => {
          const targetId = productId || refProductId;
          if (targetId) router.push(`/(tabs)/product/${targetId}`);
        }}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={pickImageAndSend}>
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
          style={[styles.sendButton, message.trim() ? styles.sendButtonActive : {}]}
          onPress={handleSend}
          disabled={!message.trim()}
        >
          <MaterialCommunityIcons
            name="send"
            size={16}
            color="white"
          />
        </TouchableOpacity>
      </View>
      
    </KeyboardAvoidingView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 30, // Add extra padding for status bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
    color: '#111827',
  },
  headerStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  headerIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubbleContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    minHeight: 40,
  },
  userMessage: {
    backgroundColor: '#16A34A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
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
    color: 'white',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#6B7280',
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 48,
    height: 48,
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
    marginTop: 4,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 0.8,
    borderTopColor: '#E5E7EB',
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  textInputContainer: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
    maxHeight: 80,
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#16A34A',
    opacity: 0.5,
  },
  sendButtonActive: {
    opacity: 1,
  },
});

export default MessageDetailScreen;
