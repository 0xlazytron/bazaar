import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { notifyProductWithImage, sendPushToToken } from './notifications';

export interface Product {
  id?: string;
  category: string;
  createdAt: Date;
  sellerId: string;
  data?: string;
  deliveryCost?: number;
  deliveryOption?: string;
  itemCondition?: string;
  likes?: number;
  paymentOption?: string;
  pickupLocation?: string;
  price: string | number;
  pricingType?: string;
  status: string;
  views?: number;
  // Legacy fields for compatibility with existing components
  title?: string;
  description?: string;
  condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images?: string[];
  productImage?: string;
  sellerName?: string;
  location?: string;
  isAuction?: boolean;
  auctionEndTime?: Date;
  currentBid?: number;
  bidCount?: number;
  updatedAt?: Date;
}

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  productId?: string;
  content: string;
  type: 'text' | 'image' | 'offer' | 'audio' | 'video' | 'system';
  isRead: boolean;
  conversationId?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'audio' | 'video';
  createdAt: Date;
}

export interface Conversation {
  id?: string;
  participants: string[];
  productId?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: { [userId: string]: number };
}

export interface Bid {
  id?: string;
  productId: string;
  bidderId: string;
  bidderName?: string;
  bidderAvatar?: string;
  amount: number;
  createdAt: Date;
  isHighest?: boolean;
}

export interface Order {
  id?: string;
  orderNumber?: string;
  productId: string;
  buyerId: string;
  buyerName?: string;
  buyerEmail?: string;
  sellerId: string;
  sellerName?: string;
  productTitle: string;
  productImage?: string;
  itemPrice: number;
  deliveryCost: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'juice' | 'other';
  deliveryMethod: 'pickup' | 'delivery';
  deliveryAddress?: string;
  pickupLocation?: string;
  productTax?: number;
  taxPaid?: boolean;
  taxProof?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

export type ReviewSentiment = 'positive' | 'neutral' | 'negative';

export interface Review {
  id?: string;
  orderId: string;
  productId: string;
  buyerId: string;
  buyerName?: string;
  buyerAvatar?: string;
  sellerId: string;
  sentiment: ReviewSentiment;
  comment: string;
  createdAt: Date;
}

export type NotificationKind = 'auction_outbid' | 'auction_won' | 'auction_bid' | 'order_placed' | 'order_seller' | 'tax';

export interface AppNotification {
  id?: string;
  userId: string;
  type: NotificationKind;
  title: string;
  message: string;
  productId?: string;
  orderId?: string;
  productTitle?: string;
  productImage?: string;
  amount?: number;
  isRead: boolean;
  isImportant?: boolean;
  createdAt: Date;
}

export interface Category {
  id?: string;
  name: string;
  icon?: string; // emoji or image URL
  bgColor?: string;
  listingsCount?: number;
  subcategories?: string[];
  order?: number;
  parentId?: string;
  isActive?: boolean;
}

// Products
export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'listings'), {
      ...productData,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
};

export const getProduct = async (productId: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, 'listings', productId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Debug function to check all products in database
export const getAllProductsDebug = async (): Promise<void> => {
  try {
    console.log('🔍 DEBUG: Fetching ALL products from database...');
    const q = query(collection(db, 'listings'));
    const querySnapshot = await getDocs(q);
    console.log('📦 DEBUG: Total products in database:', querySnapshot.size);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 DEBUG: Product in DB:', {
        id: doc.id,
        title: data.title,
        sellerId: data.sellerId,
        status: data.status,
        createdAt: data.createdAt?.toDate()
      });
    });
  } catch (error) {
    console.error('❌ DEBUG: Error fetching all products:', error);
  }
};

export const getProducts = async (filters?: {
  category?: string;
  status?: string;
  sellerId?: string;
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
}) => {
  try {
    let q = query(collection(db, 'listings'));

    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters?.sellerId) {
      q = query(q, where('sellerId', '==', filters.sellerId));
    }

    // Temporarily removed orderBy to avoid composite index requirement
    // q = query(q, orderBy('createdAt', 'desc'));

    if (filters?.limitCount) {
      q = query(q, limit(filters.limitCount));
    }

    if (filters?.lastDoc) {
      q = query(q, startAfter(filters.lastDoc));
    }

    const querySnapshot = await getDocs(q);

    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const productData = { id: doc.id, ...doc.data() } as Product;
      products.push(productData);
    });

    // Sort by createdAt in descending order (newest first) in JavaScript
    products.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() :
        (a.createdAt as any)?.toDate ? (a.createdAt as any).toDate().getTime() :
          new Date(a.createdAt).getTime();
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() :
        (b.createdAt as any)?.toDate ? (b.createdAt as any).toDate().getTime() :
          new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return {
      products,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    let q = query(collection(db, 'categories'));
    // Try to order by 'order' if present; ignore errors if field missing
    try { q = query(q, orderBy('order', 'asc')); } catch { }
    const qs = await getDocs(q);
    const cats: Category[] = [];
    qs.forEach((d) => cats.push({ id: d.id, ...(d.data() as any) } as Category));
    return cats;
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
};

export const subscribeCategories = (onUpdate: (categories: Category[]) => void) => {
  const q = query(collection(db, 'categories'));
  return onSnapshot(q, (snap) => {
    const cats: Category[] = [];
    snap.forEach((d) => cats.push({ id: d.id, ...(d.data() as any) } as Category));
    cats.sort((a, b) => (a.order || 0) - (b.order || 0));
    onUpdate(cats);
  });
};

export const getMainCategories = async (): Promise<Category[]> => {
  const all = await getCategories();
  return all.filter((c) => !c.parentId);
};

export const subscribeMainCategories = (onUpdate: (categories: Category[]) => void) => {
  return subscribeCategories((cats) => onUpdate(cats.filter((c) => !c.parentId)));
};

export interface CategoryWithSubs extends Category {
  subItems: Category[];
}

export const getCategoriesWithSubs = async (): Promise<CategoryWithSubs[]> => {
  const all = await getCategories();
  const mains = all.filter((c) => !c.parentId);
  return mains.map((m) => ({ ...m, subItems: all.filter((s) => s.parentId === m.id) }));
};

export const subscribeCategoriesWithSubs = (onUpdate: (categories: CategoryWithSubs[]) => void) => {
  return subscribeCategories((all) => {
    const mains = all.filter((c) => !c.parentId);
    const result = mains.map((m) => ({ ...m, subItems: all.filter((s) => s.parentId === m.id) }));
    onUpdate(result);
  });
};

export const getListingsCountForCategory = async (categoryName: string): Promise<number> => {
  try {
    const q = query(collection(db, 'listings'), where('category', '==', categoryName));
    const qs = await getDocs(q);
    return qs.size;
  } catch (error) {
    console.error('Error counting listings for category:', error);
    return 0;
  }
};

export const updateProduct = async (productId: string, updates: Partial<Product>) => {
  try {
    const docRef = doc(db, 'listings', productId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string) => {
  try {
    const docRef = doc(db, 'listings', productId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Messages
export const sendMessage = async (messageData: Omit<Message, 'id' | 'createdAt'>) => {
  try {
    const participants = [messageData.senderId, messageData.receiverId].sort();
    const conversationId = participants.join('_');
    const now = new Date();
    const basePayload: any = {
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      content: messageData.content,
      type: messageData.type,
      isRead: messageData.isRead ?? false,
      conversationId,
      createdAt: now,
    };
    if (messageData.productId) basePayload.productId = messageData.productId;
    if ((messageData as any).attachmentUrl) basePayload.attachmentUrl = (messageData as any).attachmentUrl;
    if ((messageData as any).attachmentType) basePayload.attachmentType = (messageData as any).attachmentType;
    const docRef = await addDoc(collection(db, 'messages'), basePayload);

    // Update or create conversation
    await updateConversation(messageData.senderId, messageData.receiverId, messageData.content, messageData.productId);
    try {
      const receiverSnap = await getDoc(doc(db, 'users', messageData.receiverId));
      const senderSnap = await getDoc(doc(db, 'users', messageData.senderId));
      const token = (receiverSnap.data() as any)?.expoPushToken;
      const senderName = (senderSnap.data() as any)?.displayName || 'New message';
      const senderAvatar = (senderSnap.data() as any)?.photoURL || undefined;
      if (token) {
        const body = messageData.type === 'image' ? 'Sent an image' : (messageData.content || 'New message');
        await sendPushToToken(token, senderName, body, { conversationId, imageUrl: senderAvatar });
      }
    } catch { }

    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = async (conversationId: string, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const messages: Message[] = [];

    querySnapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });

    return messages.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
};

export const subscribeMessages = (
  conversationId: string,
  onMessages: (messages: Message[]) => void,
  limitCount = 100
) => {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((docSnap) => {
      messages.push({ id: docSnap.id, ...docSnap.data() } as Message);
    });
    onMessages(messages);
  });
};

export const setTyping = async (conversationId: string, userId: string, typing: boolean) => {
  try {
    const typingRef = doc(db, 'conversations', conversationId, 'typing', userId);
    await setDoc(typingRef, { typing, updatedAt: new Date() }, { merge: true });
  } catch (error) {
    console.error('Error setting typing state:', error);
  }
};

export const subscribeTyping = (
  conversationId: string,
  onTyping: (states: { [userId: string]: boolean }) => void
) => {
  return onSnapshot(collection(db, 'conversations', conversationId, 'typing'), (snapshot) => {
    const state: { [userId: string]: boolean } = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as any;
      state[docSnap.id] = !!data.typing;
    });
    onTyping(state);
  });
};

export interface CallSession {
  id?: string;
  callerId: string;
  calleeId: string;
  productId?: string;
  type: 'voice' | 'video';
  status: 'initiated' | 'ringing' | 'connected' | 'ended' | 'missed';
  offerSDP?: string;
  answerSDP?: string;
  createdAt: Date;
  endedAt?: Date;
}

export const createCall = async (call: Omit<CallSession, 'id' | 'createdAt'>): Promise<string> => {
  const now = new Date();
  const ref = await addDoc(collection(db, 'calls'), { ...call, createdAt: now });
  return ref.id;
};

export const updateCall = async (callId: string, updates: Partial<CallSession>) => {
  await updateDoc(doc(db, 'calls', callId), { ...updates, updatedAt: new Date() });
};

export const subscribeCall = (callId: string, onUpdate: (call: CallSession | null) => void) => {
  return onSnapshot(doc(db, 'calls', callId), (snap) => {
    if (!snap.exists()) return onUpdate(null);
    onUpdate({ id: snap.id, ...snap.data() } as CallSession);
  });
};

export const subscribeIncomingCalls = (
  userId: string,
  onIncoming: (call: CallSession) => void
) => {
  const q = query(collection(db, 'calls'), where('calleeId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const data = { id: change.doc.id, ...change.doc.data() } as CallSession;
      if ((change.type === 'added' || change.type === 'modified') && data.status === 'initiated') {
        onIncoming(data);
      }
    });
  });
};

export const addIceCandidate = async (callId: string, userId: string, candidate: any) => {
  try {
    await addDoc(collection(db, 'calls', callId, 'candidates', userId), {
      candidate,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error adding ICE candidate:', error);
  }
};

export const subscribeIceCandidates = (
  callId: string,
  userId: string,
  onCandidate: (candidate: any) => void
) => {
  const q = collection(db, 'calls', callId, 'candidates', userId);
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const data = change.doc.data() as any;
        onCandidate(data.candidate);
      }
    });
  });
};

export const markMessageAsRead = async (messageId: string) => {
  try {
    const docRef = doc(db, 'messages', messageId);
    await updateDoc(docRef, { isRead: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId: string, userId: string) => {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      const data = snap.data() as any;
      const unread = data.unreadCount || {};
      if ((unread[userId] || 0) > 0) {
        unread[userId] = 0;
        await updateDoc(convRef, { unreadCount: unread, lastMessageTime: new Date() });
      }
    }

    // Mark receiver messages as read
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('receiverId', '==', userId)
    );
    const qs = await getDocs(q);
    const updates: Promise<any>[] = [];
    qs.forEach((docSnap) => {
      const m = docSnap.data() as any;
      if (!m.isRead) updates.push(updateDoc(docSnap.ref, { isRead: true }));
    });
    if (updates.length) await Promise.all(updates);
  } catch (error) {
    console.error('Error marking conversation as read:', error);
  }
};

export const subscribeUnreadTotal = (
  userId: string,
  onTotal: (total: number) => void
) => {
  const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
  return onSnapshot(q, (snapshot) => {
    let total = 0;
    snapshot.forEach((d) => {
      const data = d.data() as any;
      const unread = data.unreadCount || {};
      total += unread[userId] || 0;
    });
    onTotal(total);
  });
};

// Conversations
const updateConversation = async (senderId: string, receiverId: string, lastMessage: string, productId?: string) => {
  try {
    const participants = [senderId, receiverId].sort();
    const conversationId = participants.join('_');

    const conversationRef = doc(db, 'conversations', conversationId);
    const conversationSnap = await getDoc(conversationRef);

    const now = new Date();

    if (conversationSnap.exists()) {
      const data = conversationSnap.data();
      const unreadCount = data.unreadCount || {};
      unreadCount[receiverId] = (unreadCount[receiverId] || 0) + 1;

      await updateDoc(conversationRef, {
        lastMessage,
        lastMessageTime: now,
        unreadCount,
      });
    } else {
      await setDoc(conversationRef, {
        participants,
        productId,
        lastMessage,
        lastMessageTime: now,
        unreadCount: { [receiverId]: 1 },
      });
    }
  } catch (error) {
    console.error('Error updating conversation:', error);
    throw error;
  }
};

export const getUserConversations = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId)
    );

    const querySnapshot = await getDocs(q);
    const conversations: Conversation[] = [];

    querySnapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() } as Conversation);
    });

    // Sort by lastMessageTime in memory instead of using orderBy in the query
    conversations.sort((a, b) => {
      const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return bTime - aTime;
    });

    return conversations;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
};

export const subscribeUserConversations = (
  userId: string,
  onUpdate: (conversations: Conversation[]) => void
) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = [];
    snapshot.forEach((docSnap) => {
      conversations.push({ id: docSnap.id, ...docSnap.data() } as Conversation);
    });
    conversations.sort((a, b) => {
      const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return bTime - aTime;
    });
    onUpdate(conversations);
  });
};

export const deleteConversation = async (userId: string, peerId: string): Promise<void> => {
  try {
    const participants = [userId, peerId].sort();
    const conversationId = participants.join('_');

    const messagesQ = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId)
    );
    const messagesSnap = await getDocs(messagesQ);
    for (const docSnap of messagesSnap.docs) {
      await deleteDoc(doc(db, 'messages', docSnap.id));
    }

    const typingSnap = await getDocs(collection(db, 'conversations', conversationId, 'typing'));
    for (const docSnap of typingSnap.docs) {
      await deleteDoc(doc(db, 'conversations', conversationId, 'typing', docSnap.id));
    }

    await deleteDoc(doc(db, 'conversations', conversationId));
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
};

// Featured Auctions filtering functions
export const getFeaturedProducts = async (limitCount: number = 10): Promise<Product[]> => {
  try {
    // Featured products logic: products with high views, likes, or marked as featured
    let q = query(
      collection(db, 'listings'),
      where('status', '==', 'active')
    );

    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const productData = { id: doc.id, ...doc.data() } as Product;
      products.push(productData);
    });

    // Sort by a combination of views and likes (featured logic)
    products.sort((a, b) => {
      const aScore = (a.views || 0) + (a.likes || 0) * 2; // Likes weighted more
      const bScore = (b.views || 0) + (b.likes || 0) * 2;
      return bScore - aScore;
    });

    return products.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting featured products:', error);
    throw error;
  }
};

export const getEndingSoonProducts = async (limitCount: number = 10): Promise<Product[]> => {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    let q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      where('isAuction', '==', true)
    );

    if (limitCount) {
      q = query(q, limit(limitCount * 2)); // Get more to filter properly
    }

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const productData = { id: doc.id, ...doc.data() } as Product;

      // Check if auction end time is within next 24 hours
      if (productData.auctionEndTime) {
        const endTime = productData.auctionEndTime instanceof Date
          ? productData.auctionEndTime
          : (productData.auctionEndTime as any).toDate();

        if (endTime > now && endTime <= next24Hours) {
          products.push(productData);
        }
      }
    });

    // Sort by auction end time (soonest first)
    products.sort((a, b) => {
      const aTime = a.auctionEndTime instanceof Date
        ? a.auctionEndTime.getTime()
        : (a.auctionEndTime as any).toDate().getTime();
      const bTime = b.auctionEndTime instanceof Date
        ? b.auctionEndTime.getTime()
        : (b.auctionEndTime as any).toDate().getTime();
      return aTime - bTime;
    });

    return products.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting ending soon products:', error);
    throw error;
  }
};

export const delistExpiredAuctions = async (): Promise<number> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, 'listings'),
      where('status', '==', 'active'),
      where('isAuction', '==', true)
    );
    const querySnapshot = await getDocs(q);
    let count = 0;
    const updates: Promise<any>[] = [];
    querySnapshot.forEach((docSnap) => {
      const productData = { id: docSnap.id, ...docSnap.data() } as Product;
      if (!productData.auctionEndTime) return;
      const endTime = productData.auctionEndTime instanceof Date
        ? productData.auctionEndTime
        : (productData.auctionEndTime as any).toDate
          ? (productData.auctionEndTime as any).toDate()
          : new Date(productData.auctionEndTime);
      if (now.getTime() >= endTime.getTime()) {
        updates.push(updateProduct(docSnap.id, { status: 'inactive' }));
        count++;
      }
    });
    await Promise.all(updates);
    return count;
  } catch (error) {
    console.error('Error auto-delisting auctions:', error);
    return 0;
  }
};

export const getNewlyListedProducts = async (limitCount: number = 10): Promise<Product[]> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let q = query(
      collection(db, 'listings'),
      where('status', '==', 'active')
    );

    if (limitCount) {
      q = query(q, limit(limitCount * 2)); // Get more to filter properly
    }

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const productData = { id: doc.id, ...doc.data() } as Product;

      // Check if created within last 7 days
      if (!productData.createdAt) return;

      const createdAt = productData.createdAt instanceof Date
        ? productData.createdAt
        : (productData.createdAt as any).toDate();

      if (createdAt >= sevenDaysAgo) {
        products.push(productData);
      }
    });

    // Sort by creation date (newest first)
    products.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const aTime = a.createdAt instanceof Date
        ? a.createdAt.getTime()
        : (a.createdAt as any).toDate().getTime();
      const bTime = b.createdAt instanceof Date
        ? b.createdAt.getTime()
        : (b.createdAt as any).toDate().getTime();
      return bTime - aTime;
    });

    return products.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting newly listed products:', error);
    throw error;
  }
};

export const getPopularProducts = async (limitCount: number = 10): Promise<Product[]> => {
  try {
    let q = query(
      collection(db, 'listings'),
      where('status', '==', 'active')
    );

    if (limitCount) {
      q = query(q, limit(limitCount * 2)); // Get more to sort properly
    }

    const querySnapshot = await getDocs(q);
    const products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const productData = { id: doc.id, ...doc.data() } as Product;
      products.push(productData);
    });

    // Sort by likes (most liked first)
    products.sort((a, b) => {
      const aLikes = a.likes || 0;
      const bLikes = b.likes || 0;
      return bLikes - aLikes;
    });

    return products.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting popular products:', error);
    throw error;
  }
};

// Favorites functionality
export interface UserFavorite {
  id?: string;
  userId: string;
  productId: string;
  createdAt: Date;
}

export const addToFavorites = async (userId: string, productId: string): Promise<void> => {
  try {
    // Check if already in favorites
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      await addDoc(collection(db, 'favorites'), {
        userId,
        productId,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (userId: string, productId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (docSnapshot) => {
      await deleteDoc(doc(db, 'favorites', docSnapshot.id));
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

export const getUserFavorites = async (userId: string): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const favorites: { productId: string; createdAt: Date }[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserFavorite;
      favorites.push({
        productId: data.productId,
        createdAt: data.createdAt
      });
    });

    // Sort by createdAt in memory instead of using orderBy in the query
    favorites.sort((a, b) => {
      try {
        const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
        const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
        return bTime - aTime;
      } catch (error) {
        console.warn('Error sorting favorites by createdAt:', error);
        return 0;
      }
    });

    return favorites.map(fav => fav.productId);
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
};

export const isProductFavorited = async (userId: string, productId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('productId', '==', productId)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if product is favorited:', error);
    return false;
  }
};

// Bid Functions
export const placeBid = async (bidData: Omit<Bid, 'id' | 'createdAt' | 'isHighest'>) => {
  try {
    const now = new Date();

    // First, get the current product to validate the bid
    const product = await getProduct(bidData.productId);
    if (!product) {
      throw new Error('Product not found');
    }
    if (product.status !== 'active') {
      throw new Error('auction ended or item not available');
    }
    if (product.auctionEndTime) {
      const end = product.auctionEndTime instanceof Date ? product.auctionEndTime : new Date(product.auctionEndTime);
      if (now.getTime() >= end.getTime()) {
        await updateProduct(bidData.productId, { status: 'inactive' });
        throw new Error('auction ended');
      }
    }

    const currentBid = Number(product.currentBid || product.price || 0);
    const newBidAmount = Number(bidData.amount);

    // Validate bid amount
    if (newBidAmount <= currentBid) {
      throw new Error(`Bid must be higher than current bid of Rs ${currentBid}`);
    }

    const previousBidsQuery = query(
      collection(db, 'bids'),
      where('productId', '==', bidData.productId),
      where('isHighest', '==', true)
    );

    const previousBidsSnapshot = await getDocs(previousBidsQuery);
    const previousHighestBids: Bid[] = [];
    previousBidsSnapshot.forEach((docSnap) => {
      previousHighestBids.push({ id: docSnap.id, ...(docSnap.data() as any) } as Bid);
    });
    const updatePromises = previousBidsSnapshot.docs.map((docSnap) =>
      updateDoc(docSnap.ref, { isHighest: false })
    );

    const notificationPromises: Promise<any>[] = [];
    previousHighestBids.forEach((prevBid) => {
      if (prevBid.bidderId === bidData.bidderId) return;
      notificationPromises.push((async () => {
        const notification: Omit<AppNotification, 'id'> = {
          userId: prevBid.bidderId,
          type: 'auction_outbid',
          title: "You've been outbid",
          message: `Someone placed a higher bid on ${product.title || 'your watched item'}.`,
          productId: bidData.productId,
          productTitle: product.title,
          productImage: product.images && product.images.length ? product.images[0] : undefined,
          amount: newBidAmount,
          isRead: false,
          isImportant: false,
          createdAt: now,
        };
        const notifRef = await addDoc(collection(db, 'notifications'), notification as any);
        try {
          const receiverSnap = await getDoc(doc(db, 'users', prevBid.bidderId));
          const token = (receiverSnap.data() as any)?.expoPushToken as string | undefined;
          const imageUrl = notification.productImage as string | undefined;
          const data: any = {
            type: notification.type,
            productId: notification.productId,
            notificationId: notifRef.id,
            imageUrl,
          };
          if (token) {
            await sendPushToToken(token, notification.title, notification.message, data);
          } else {
            await notifyProductWithImage(notification.title, notification.message, imageUrl);
          }
        } catch { }
      })());
    });

    if (product.sellerId && product.sellerId !== bidData.bidderId) {
      notificationPromises.push((async () => {
        const sellerNotification: Omit<AppNotification, 'id'> = {
          userId: product.sellerId,
          type: 'auction_bid',
          title: 'New bid on your listing',
          message: `Someone placed a bid of Rs ${newBidAmount} on ${product.title || 'your listing'}.`,
          productId: bidData.productId,
          productTitle: product.title,
          productImage: product.images && product.images.length ? product.images[0] : undefined,
          amount: newBidAmount,
          isRead: false,
          isImportant: false,
          createdAt: now,
        };
        const notifRef = await addDoc(collection(db, 'notifications'), sellerNotification as any);
        try {
          const receiverSnap = await getDoc(doc(db, 'users', product.sellerId));
          const token = (receiverSnap.data() as any)?.expoPushToken as string | undefined;
          const imageUrl = sellerNotification.productImage as string | undefined;
          const data: any = {
            type: sellerNotification.type,
            productId: sellerNotification.productId,
            notificationId: notifRef.id,
            imageUrl,
          };
          if (token) {
            await sendPushToToken(
              token,
              sellerNotification.title,
              sellerNotification.message,
              data
            );
          } else {
            await notifyProductWithImage(
              sellerNotification.title,
              sellerNotification.message,
              imageUrl
            );
          }
        } catch { }
      })());
    }

    await Promise.all([...updatePromises, ...notificationPromises]);

    // Create the new bid
    const bidRef = await addDoc(collection(db, 'bids'), {
      ...bidData,
      amount: newBidAmount,
      createdAt: now,
      isHighest: true,
    });

    // Update the product with new current bid and bid count
    const bidCountQuery = query(
      collection(db, 'bids'),
      where('productId', '==', bidData.productId)
    );
    const bidCountSnapshot = await getDocs(bidCountQuery);
    const totalBids = bidCountSnapshot.size;

    await updateProduct(bidData.productId, {
      currentBid: newBidAmount,
      bidCount: totalBids,
    });

    return bidRef.id;
  } catch (error) {
    console.error('Error placing bid:', error);
    throw error;
  }
};

export const getBidHistory = async (productId: string): Promise<Bid[]> => {
  try {
    const q = query(
      collection(db, 'bids'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bids: Bid[] = [];

    querySnapshot.forEach((doc) => {
      const bidData = { id: doc.id, ...doc.data() } as Bid;
      bids.push(bidData);
    });

    // Sort by amount descending first, then by createdAt descending
    // This ensures the highest bid appears first
    bids.sort((a, b) => {
      // First sort by amount (highest first)
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }
      // If amounts are equal, sort by createdAt (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return bids;
  } catch (error) {
    console.error('Error getting bid history:', error);
    throw error;
  }
};

export const getUserBids = async (userId: string): Promise<Bid[]> => {
  try {
    const q = query(
      collection(db, 'bids'),
      where('bidderId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bids: Bid[] = [];

    querySnapshot.forEach((doc) => {
      const bidData = { id: doc.id, ...doc.data() } as Bid;
      bids.push(bidData);
    });

    return bids;
  } catch (error) {
    console.error('Error getting user bids:', error);
    throw error;
  }
};

// Helper function to format time ago
const formatTimeAgo = (timestamp: any) => {
  const now = new Date();
  const bidTime = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - bidTime.getTime()) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

// Enhanced function to get user bids with product details and ranking
export interface BidWithDetails extends Bid {
  productTitle: string;
  productImage: string | null;
  ranking: number;
  totalBids: number;
  timeAgo: string;
  isHighestBid: boolean;
}

// Test function to count all bids in database
export const countAllBids = async (): Promise<number> => {
  try {
    console.log('🔍 Counting all bids in database...');
    const q = query(collection(db, 'bids'));
    const querySnapshot = await getDocs(q);
    console.log('🔍 Total bids in database:', querySnapshot.size);

    // Log some sample bids
    querySnapshot.docs.slice(0, 3).forEach((doc, index) => {
      const bidData = { id: doc.id, ...doc.data() };
      console.log(`🔍 Sample bid ${index + 1}:`, bidData);
    });

    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error counting bids:', error);
    return 0;
  }
};

// Test function to count all products in database
export const countAllProducts = async (): Promise<number> => {
  try {
    console.log('🔍 Counting all products in database...');
    const q = query(collection(db, 'listings'));
    const querySnapshot = await getDocs(q);
    console.log('🔍 Total products in database:', querySnapshot.size);

    // Log some sample products
    querySnapshot.docs.slice(0, 3).forEach((doc, index) => {
      const data = doc.data();
      const productInfo = {
        id: doc.id,
        title: data.title,
        currentBid: data.currentBid,
        bidCount: data.bidCount
      };
      console.log(`🔍 Sample product ${index + 1}:`, productInfo);
    });

    return querySnapshot.size;
  } catch (error) {
    console.error('❌ Error counting products:', error);
    return 0;
  }
};

// Check if specific product exists
export const checkProductExists = async (productId: string) => {
  try {
    const productRef = doc(db, 'listings', productId);
    const productSnap = await getDoc(productRef);
    console.log(`🔍 Product ${productId} exists:`, productSnap.exists());

    if (productSnap.exists()) {
      console.log(`🔍 Product data:`, productSnap.data());
    }

    return productSnap.exists();
  } catch (error) {
    console.error(`🔍 Error checking product existence:`, error);
    return false;
  }
};

// Test function to fetch specific product directly
export const testFetchProduct = async (productId: string) => {
  try {
    console.log(`🧪 Testing direct fetch for product: ${productId}`);
    console.log(`🧪 Database app:`, db.app.name);

    const productRef = doc(db, 'listings', productId);
    console.log(`🧪 Product reference:`, productRef);
    console.log(`🧪 Product reference path:`, productRef.path);

    const productDoc = await getDoc(productRef);
    console.log(`🧪 Product document exists:`, productDoc.exists());

    if (productDoc.exists()) {
      const data = productDoc.data();
      console.log(`🧪 Product data:`, data);
      return data;
    } else {
      console.log(`🧪 Product ${productId} not found in database`);
      return null;
    }
  } catch (error) {
    console.error(`🧪 Error testing product fetch:`, error);
    return null;
  }
};

export const getUserBidsWithDetails = async (userId: string): Promise<BidWithDetails[]> => {
  try {
    console.log('🔍 getUserBidsWithDetails called for userId:', userId);
    console.log('🔍 userId type:', typeof userId);
    console.log('🔍 userId length:', userId?.length);
    console.log('🔍 userId is empty?', !userId || userId.trim() === '');

    if (!userId || userId.trim() === '') {
      console.error('❌ getUserBidsWithDetails: userId is empty or null');
      return [];
    }

    const q = query(
      collection(db, 'bids'),
      where('bidderId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    console.log('🔍 About to execute query...');
    const querySnapshot = await getDocs(q);
    console.log('🔍 Query snapshot size:', querySnapshot.size);
    console.log('🔍 Query snapshot empty?', querySnapshot.empty);
    const bidsWithDetails: BidWithDetails[] = [];

    // Group bids by product to calculate rankings
    const bidsByProduct: { [productId: string]: Bid[] } = {};
    const allBids: Bid[] = [];

    querySnapshot.forEach((doc) => {
      const bidData = { id: doc.id, ...doc.data() } as Bid;
      console.log('🔍 Processing bid:', bidData);
      allBids.push(bidData);

      if (!bidsByProduct[bidData.productId]) {
        bidsByProduct[bidData.productId] = [];
      }
      bidsByProduct[bidData.productId].push(bidData);
    });

    console.log('🔍 Total bids found:', allBids.length);

    // For each user bid, get product details and calculate ranking
    for (const userBid of allBids) {
      try {
        // Get product details
        console.log(`🔍 Attempting to fetch product: ${userBid.productId}`);
        const productRef = doc(db, 'listings', userBid.productId);
        console.log(`🔍 Product reference created:`, productRef);

        const productDoc = await getDoc(productRef);
        console.log(`🔍 Product document fetched. Exists: ${productDoc.exists()}`);

        let productData: Product;

        if (!productDoc.exists()) {
          console.error(`❌ Product ${userBid.productId} not found in Firestore`);
          console.log(`🔍 Product reference path: ${productRef.path}`);
          console.log(`🔍 Database instance:`, db);
          // Create placeholder product data for missing products
          productData = {
            id: userBid.productId,
            category: 'unknown',
            createdAt: new Date(),
            sellerId: 'unknown',
            price: userBid.amount,
            status: 'inactive',
            title: `Product Not Found (${userBid.productId})`,
            description: 'This product is no longer available',
            condition: 'poor',
            images: [],
            sellerName: 'Unknown Seller',
            location: 'Unknown',
            isAuction: false,
            views: 0,
            updatedAt: new Date()
          } as Product;
        } else {
          productData = productDoc.data() as Product;
        }

        // Get all bids for this product to calculate ranking
        const productBidsQuery = query(
          collection(db, 'bids'),
          where('productId', '==', userBid.productId),
          orderBy('amount', 'desc')
        );

        const productBidsSnapshot = await getDocs(productBidsQuery);
        const productBids: Bid[] = [];

        productBidsSnapshot.forEach((doc) => {
          productBids.push({ id: doc.id, ...doc.data() } as Bid);
        });

        // Calculate ranking (1-based index)
        const ranking = productBids.findIndex(bid => bid.id === userBid.id) + 1;

        const bidWithDetails: BidWithDetails = {
          ...userBid,
          productTitle: productData.title || 'Unknown Product',
          productImage: productData.images && productData.images.length > 0 ? productData.images[0] : null,
          ranking: ranking,
          totalBids: productBids.length,
          timeAgo: formatTimeAgo(userBid.createdAt),
          isHighestBid: ranking === 1
        };

        bidsWithDetails.push(bidWithDetails);
      } catch (error) {
        console.error(`Error processing bid ${userBid.id}:`, error);
      }
    }

    console.log('🔍 Final bidsWithDetails array length:', bidsWithDetails.length);
    console.log('🔍 Final bidsWithDetails:', bidsWithDetails);
    return bidsWithDetails;
  } catch (error) {
    console.error('❌ Error getting user bids with details:', error);
    console.error('❌ Error details:', error);
    throw error;
  }
};

export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>) => {
  try {
    const now = new Date();
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: now,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
};

export const getSellerReviews = async (sellerId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('sellerId', '==', sellerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const items: Review[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) } as Review);
    });
    return items;
  } catch (error) {
    console.error('Error getting seller reviews:', error);
    throw error;
  }
};

export const getReviewForOrder = async (orderId: string): Promise<Review | null> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('orderId', '==', orderId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...(docSnap.data() as any) } as Review;
  } catch (error) {
    console.error('Error getting review for order:', error);
    throw error;
  }
};

// Order Functions
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = new Date();

    // Validate required fields
    if (!orderData.productId || !orderData.buyerId || !orderData.sellerId) {
      throw new Error('Missing required order fields');
    }

    const orderNumber = `ORD-${now.getTime().toString(36).toUpperCase()}`;

    const orderRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    });

    await updateProduct(orderData.productId, {
      status: 'pending_delivery',
      updatedAt: now,
    });

    const notificationBuyer: Omit<AppNotification, 'id'> = {
      userId: orderData.buyerId,
      type: 'order_placed',
      title: 'Order placed',
      message: `You have placed an order for ${orderData.productTitle}`,
      productId: orderData.productId,
      orderId: orderRef.id,
      productTitle: orderData.productTitle,
      productImage: orderData.productImage,
      amount: orderData.totalAmount,
      isRead: false,
      isImportant: false,
      createdAt: now,
    };

    const notificationSeller: Omit<AppNotification, 'id'> = {
      userId: orderData.sellerId,
      type: 'order_seller',
      title: 'Your product was purchased',
      message: `Someone purchased ${orderData.productTitle}.`,
      productId: orderData.productId,
      orderId: orderRef.id,
      productTitle: orderData.productTitle,
      productImage: orderData.productImage,
      amount: orderData.totalAmount,
      isRead: false,
      isImportant: false,
      createdAt: now,
    };

    const buyerNotificationPromise = (async () => {
      const notifRef = await addDoc(collection(db, 'notifications'), notificationBuyer as any);
      try {
        const buyerSnap = await getDoc(doc(db, 'users', orderData.buyerId));
        const token = (buyerSnap.data() as any)?.expoPushToken as string | undefined;
        if (token) {
          await sendPushToToken(
            token,
            notificationBuyer.title,
            notificationBuyer.message,
            {
              type: notificationBuyer.type,
              productId: notificationBuyer.productId,
              orderId: notificationBuyer.orderId,
              notificationId: notifRef.id,
              imageUrl: notificationBuyer.productImage,
            }
          );
        } else {
          const imageUrl = notificationBuyer.productImage as string | undefined;
          await notifyProductWithImage(
            notificationBuyer.title,
            notificationBuyer.message,
            imageUrl
          );
        }
      } catch { }
    })();

    const sellerNotificationPromise = (async () => {
      const notifRef = await addDoc(collection(db, 'notifications'), notificationSeller as any);
      try {
        const sellerSnap = await getDoc(doc(db, 'users', orderData.sellerId));
        const token = (sellerSnap.data() as any)?.expoPushToken as string | undefined;
        if (token) {
          await sendPushToToken(
            token,
            notificationSeller.title,
            notificationSeller.message,
            {
              type: notificationSeller.type,
              productId: notificationSeller.productId,
              orderId: notificationSeller.orderId,
              notificationId: notifRef.id,
              imageUrl: notificationSeller.productImage,
            }
          );
        } else {
          const imageUrl = notificationSeller.productImage as string | undefined;
          await notifyProductWithImage(
            notificationSeller.title,
            notificationSeller.message,
            imageUrl
          );
        }
      } catch { }
    })();

    await Promise.all([buyerNotificationPromise, sellerNotificationPromise]);

    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));

    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() } as Order;
    }

    return null;
  } catch (error) {
    console.error('Error getting order:', error);
    throw error;
  }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>) => {
  try {
    const now = new Date();
    await updateDoc(doc(db, 'orders', orderId), {
      ...updates,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

export const getUserOrders = async (userId: string, type: 'buyer' | 'seller' = 'buyer'): Promise<Order[]> => {
  try {
    const field = type === 'buyer' ? 'buyerId' : 'sellerId';
    const q = query(
      collection(db, 'orders'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];

    querySnapshot.forEach((doc) => {
      const orderData = { id: doc.id, ...doc.data() } as Order;
      orders.push(orderData);
    });

    return orders;
  } catch (error) {
    console.error('Error getting user orders:', error);
    throw error;
  }
};

export const getProductOrders = async (productId: string): Promise<Order[]> => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];

    querySnapshot.forEach((doc) => {
      const orderData = { id: doc.id, ...doc.data() } as Order;
      orders.push(orderData);
    });

    return orders;
  } catch (error) {
    console.error('Error getting product orders:', error);
    throw error;
  }
};

export const subscribeUserNotifications = (
  userId: string,
  onUpdate: (notifications: AppNotification[]) => void
) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const items: AppNotification[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...(docSnap.data() as any) } as AppNotification);
    });
    items.sort((a, b) => {
      const aValue: any = a.createdAt;
      const bValue: any = b.createdAt;
      const aDate = aValue?.toDate ? aValue.toDate() : new Date(aValue);
      const bDate = bValue?.toDate ? bValue.toDate() : new Date(bValue);
      return bDate.getTime() - aDate.getTime();
    });
    onUpdate(items);
  });
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { isRead: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    const updates: Promise<void>[] = [];
    snapshot.forEach((docSnap) => {
      updates.push(updateDoc(docSnap.ref, { isRead: true }) as Promise<void>);
    });
    if (updates.length) {
      await Promise.all(updates);
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

export const getNotification = async (notificationId: string): Promise<AppNotification | null> => {
  try {
    const snap = await getDoc(doc(db, 'notifications', notificationId));
    if (!snap.exists()) {
      return null;
    }
    return { id: snap.id, ...(snap.data() as any) } as AppNotification;
  } catch (error) {
    console.error('Error getting notification:', error);
    throw error;
  }
};

export const getHighestBid = async (productId: string): Promise<Bid | null> => {
  try {
    const q = query(
      collection(db, 'bids'),
      where('productId', '==', productId),
      where('isHighest', '==', true),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Bid;
  } catch (error) {
    console.error('Error getting highest bid:', error);
    throw error;
  }
};

// Test function to create sample data for testing
export const createSampleData = async (userId: string) => {
  try {
    console.log('🧪 Creating sample data for testing...');

    // Create a sample product
    const productData = {
      title: 'Test iPhone 14',
      description: 'Sample iPhone for testing bid functionality',
      price: 999,
      category: 'Electronics',
      condition: 'new' as const,
      images: ['https://firebasestorage.googleapis.com/v0/b/bazaar-b558d.firebasestorage.app/o/listings%2F1759197624647?alt=media&token=01be4cb4-625d-46b4-b262-4f4d56bb24a1'],
      location: 'Test City, TC',
      userId: userId,
      sellerId: userId, // Required field
      status: 'active', // Required field
      isActive: true,
      isSold: false,
      views: 0,
      favorites: 0
    };

    const productId = await createProduct(productData);
    console.log('✅ Sample product created:', productId);

    // Create a sample bid on the product
    const bidData = {
      productId: productId,
      bidderId: userId,
      bidderName: 'Test User',
      bidderAvatar: '',
      amount: 850
    };

    await placeBid(bidData);
    console.log('✅ Sample bid placed on product:', productId);

    return { productId, bidAmount: bidData.amount };
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
    throw error;
  }
};
