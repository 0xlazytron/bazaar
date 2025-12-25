import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCurrentUser, getUserProfile, setUserPresence, subscribeUserProfile, UserProfile } from '../../lib/auth';
import { Conversation, deleteConversation, markConversationAsRead, subscribeUserConversations } from '../../lib/firestore';

type MessagesScreenProps = Record<string, never>;

type MessageItem = {
  id: string;
  name: string;
  message: string;
  time: string;
  unreadCount?: number;
  avatar: any; // Image source
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  if (diffMs < oneDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffMs < 2 * oneDay) return 'Yesterday';
  const days = Math.floor(diffMs / oneDay);
  if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return 'Last week';
};

const MessagesScreen: React.FC<MessagesScreenProps> = () => {
  const router = useRouter();
  const currentUser = useMemo(() => getCurrentUser(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile | null>>({});
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    setUserPresence(currentUser.uid, true);
    const convUnsub = subscribeUserConversations(currentUser.uid, (convs) => {
      setConversations(convs);
      convs.forEach(async (c) => {
        const peerId = c.participants.find((p) => p !== currentUser.uid) || '';
        if (!peerId) return;
        const profile = await getUserProfile(peerId);
        setProfiles((prev) => ({ ...prev, [peerId]: profile }));
        subscribeUserProfile(peerId, (p) => {
          setOnlineStatus((prev) => ({ ...prev, [peerId]: !!p?.online }));
          setProfiles((prev) => ({ ...prev, [peerId]: p }));
        });
      });
    });
    return () => {
      convUnsub();
      setUserPresence(currentUser.uid, false);
    };
  }, [currentUser]);

  const renderMessageItem = ({ item }: { item: MessageItem }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={async () => {
        const uid = currentUser?.uid || '';
        if (uid) {
          const conversationId = [uid, item.id].sort().join('_');
          await markConversationAsRead(conversationId, uid);
        }
        router.push(`/(tabs)/message/${item.id}?name=${encodeURIComponent(item.name)}`);
      }}
      onLongPress={() => setOpenMenuId(item.id)}
    >
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.messageTime}>{item.time}</Text>
            <TouchableOpacity
              style={styles.optionsButton}
              onPress={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
            >
              <Feather name="more-vertical" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.messagePreview}>
          <Text style={styles.messageText} numberOfLines={1}>
            {item.message}
          </Text>
          {item.unreadCount ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, onlineStatus[item.id] ? styles.statusDotOnline : styles.statusDotOffline]} />
          <Text style={[styles.statusText, onlineStatus[item.id] ? styles.statusOnline : styles.statusOffline]}>
            {onlineStatus[item.id] ? 'Online' : 'Offline'}
          </Text>
        </View>
        {openMenuId === item.id && (
          <View style={styles.optionsMenu}>
            {deletingId === item.id ? (
              <View style={styles.menuSpinner}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.optionsMenuText}>Deleting…</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={async () => {
                  const uid = currentUser?.uid || '';
                  if (!uid) return;
                  setDeletingId(item.id);
                  // Optimistic remove from local list so UI updates instantly
                  setConversations((prev) => prev.filter((c) => {
                    const hasUid = c.participants.includes(uid);
                    const hasPeer = c.participants.includes(item.id);
                    return !(hasUid && hasPeer);
                  }));
                  try {
                    await deleteConversation(uid, item.id);
                  } finally {
                    setDeletingId(null);
                    setOpenMenuId(null);
                  }
                }}
              >
                <Text style={styles.optionsMenuText}>Delete Conversation</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const handleRefresh = () => {
    if (!currentUser) return;
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Feather name="filter" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={conversations.map((c) => {
          const peerId = c.participants.find((p) => p !== currentUser?.uid) || '';
          const profile = peerId ? profiles[peerId] : null;
          const time = c.lastMessageTime ? new Date(c.lastMessageTime) : new Date();
          const unread = c.unreadCount?.[currentUser?.uid || ''] || 0;
          return {
            id: peerId,
            name: profile?.displayName || 'User',
            message: c.lastMessage || '',
            time: formatRelativeTime(time),
            unreadCount: unread,
            avatar: profile?.photoURL ? { uri: profile.photoURL } : require('../../assets/images/avatar.png'),
          } as MessageItem;
        })}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesListContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingBottom: 16,
  },
  messageItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  messageTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  optionsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#16A34A',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotOnline: { backgroundColor: '#16A34A' },
  statusDotOffline: { backgroundColor: '#9CA3AF' },
  statusText: { fontSize: 12 },
  statusOnline: { color: '#16A34A' },
  statusOffline: { color: '#9CA3AF' },
  optionsMenu: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  optionsMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionsMenuText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  menuSpinner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

export default MessagesScreen;
