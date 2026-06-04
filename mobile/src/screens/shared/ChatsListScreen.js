import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SectionList, TouchableOpacity,
  Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography } from '../../theme';

const ACTIVE_STATUSES   = new Set(['confirmed', 'in_progress']);
const INACTIVE_STATUSES = new Set(['completed', 'cancelled', 'pending']);

const fmtTime = (iso) => {
  if (!iso) return '';
  const d   = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

export default function ChatsListScreen({ navigation }) {
  const { user } = useAuth();
  const [chats, setChats]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const { data } = await api.get('/chat/my');
      setChats(data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload whenever screen comes into focus (e.g. after returning from a chat)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const confirmDelete = (bookingId) => {
    Alert.alert(
      'Delete Conversation',
      'This will permanently delete all messages in this chat. The booking itself is not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/chat/${bookingId}`);
              setChats(prev => prev.filter(c => c.bookingId !== bookingId));
            } catch {
              Alert.alert('Error', 'Could not delete conversation');
            }
          },
        },
      ],
    );
  };

  const openChat = (item) => {
    const myRole    = user.role;
    const otherName = item.otherName || (myRole === 'passenger' ? 'Driver' : 'Passenger');
    navigation.navigate('Chat', { booking: item.booking, otherName, myRole });
  };

  // Split into sections
  const active  = chats.filter(c => ACTIVE_STATUSES.has(c.status));
  const history = chats.filter(c => INACTIVE_STATUSES.has(c.status));

  const sections = [
    ...(active.length  ? [{ title: 'Active',  data: active  }] : []),
    ...(history.length ? [{ title: 'History', data: history }] : []),
  ];

  const renderItem = ({ item }) => {
    const isUnread   = item.unreadCount > 0;
    const isMine     = item.lastMessageRole === user.role;
    const preview    = item.lastMessage
      ? `${isMine ? 'You: ' : ''}${item.lastMessage}`
      : 'No messages yet';

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openChat(item)}
        onLongPress={() => confirmDelete(item.bookingId)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={[styles.avatar, isUnread && styles.avatarUnread]}>
          <Ionicons
            name={user.role === 'passenger' ? 'car' : 'person'}
            size={22}
            color={isUnread ? colors.white : colors.primary}
          />
        </View>

        {/* Body */}
        <View style={styles.body}>
          <View style={styles.topRow}>
            <Text style={[styles.name, isUnread && styles.nameUnread]} numberOfLines={1}>
              {item.otherName}
            </Text>
            <Text style={[styles.time, isUnread && styles.timeUnread]}>
              {fmtTime(item.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.bottomRow}>
            <Text style={[styles.preview, isUnread && styles.previewUnread]} numberOfLines={1}>
              {preview}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{item.unreadCount > 9 ? '9+' : item.unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.meta}>{item.date} · {item.startTime}</Text>
        </View>

        {/* Delete swipe hint */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => confirmDelete(item.bookingId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading
        ? <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
        : (
          <SectionList
            sections={sections}
            keyExtractor={item => item.bookingId}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
            )}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={56} color={colors.border} />
                <Text style={styles.emptyTxt}>No conversations yet</Text>
                <Text style={styles.emptySub}>
                  Chat becomes available once a booking is confirmed
                </Text>
              </View>
            }
            stickySectionHeadersEnabled={false}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  back:  { padding: 4 },
  title: { ...typography.h2 },

  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: colors.muted,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  separator: { height: 1, backgroundColor: colors.surface, marginLeft: 76 },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUnread: { backgroundColor: colors.primary },

  body:      { flex: 1 },
  topRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },

  name:        { ...typography.label, fontSize: 15, flex: 1 },
  nameUnread:  { color: colors.dark },
  time:        { ...typography.caption, color: colors.muted },
  timeUnread:  { color: colors.primary, fontWeight: '700' },

  preview:       { ...typography.body, fontSize: 13, color: colors.muted, flex: 1 },
  previewUnread: { color: colors.dark, fontWeight: '500' },

  meta: { ...typography.caption, color: colors.muted, marginTop: 2 },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeTxt: { color: colors.white, fontSize: 11, fontWeight: '800' },

  deleteBtn: { padding: spacing.xs },

  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 100,
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  emptyTxt: { ...typography.h3, color: colors.muted },
  emptySub: { ...typography.body, textAlign: 'center', color: colors.muted },
});
