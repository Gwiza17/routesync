import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator, Linking,
} from 'react-native';
import { io } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, typography } from '../../theme';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

const fmt = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function ChatScreen({ route, navigation }) {
  const { booking, otherName, myRole } = route.params;
  const { user } = useAuth();

  const [messages, setMessages]   = useState([]);
  const [text, setText]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [calling, setCalling]     = useState(false);
  const socketRef                 = useRef(null);
  const listRef                   = useRef(null);

  // ── Connect Socket.io + load history ─────────────────────────────────────
  useEffect(() => {
    // Load history
    api.get(`/chat/${booking.id}`)
      .then(r => setMessages(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Socket connection
    socketRef.current = io(API_URL, { transports: ['websocket'] });
    socketRef.current.emit('join:booking', { bookingId: booking.id });

    socketRef.current.on('chat:message', (msg) => {
      setMessages(prev => {
        // Avoid duplicates (our own optimistic messages)
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      listRef.current?.scrollToEnd({ animated: true });
    });

    return () => socketRef.current?.disconnect();
  }, [booking.id]);

  // ── Send message ──────────────────────────────────────────────────────────
  const send = useCallback(() => {
    const content = text.trim();
    if (!content) return;
    setText('');

    socketRef.current?.emit('chat:send', {
      bookingId:  booking.id,
      senderId:   user.id,
      senderRole: myRole,
      senderName: user.name,
      content,
    });
  }, [text, booking.id, user, myRole]);

  // ── Masked call ───────────────────────────────────────────────────────────
  const initiateCall = async () => {
    setCalling(true);
    try {
      const { data } = await api.post(`/chat/${booking.id}/call`);
      Alert.alert(
        'Masked Call Ready',
        `${data.message}\n\nYour real number will NOT be shared.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: `Call ${data.proxyNumber}`, onPress: () => Linking.openURL(`tel:${data.proxyNumber}`) },
        ],
      );
    } catch (err) {
      if (err.response?.status === 501) {
        Alert.alert(
          'Calling Not Yet Active',
          'Masked calling keeps both phone numbers private. It requires Twilio to be configured on the server.\n\nChat is available now while calling is being set up.',
        );
      } else {
        Alert.alert('Error', err.response?.data?.message || 'Could not initiate call');
      }
    } finally {
      setCalling(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
          <Text style={styles.headerSub}>{myRole === 'passenger' ? 'Your Driver' : 'Passenger'}</Text>
        </View>
        <TouchableOpacity onPress={initiateCall} style={styles.callBtn} disabled={calling}>
          {calling
            ? <ActivityIndicator size="small" color={colors.white} />
            : <Ionicons name="call" size={20} color={colors.white} />
          }
        </TouchableOpacity>
      </View>

      {/* Message list */}
      {loading
        ? <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
        : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={styles.list}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTxt}>No messages yet</Text>
                <Text style={styles.emptySub}>Send a message to start the conversation</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const isMine = item.senderId === user.id || item.senderRole === myRole;
              const prevItem = messages[index - 1];
              const showTime = !prevItem ||
                new Date(item.createdAt) - new Date(prevItem.createdAt) > 5 * 60 * 1000;

              return (
                <View>
                  {showTime && (
                    <Text style={styles.timestamp}>{fmt(item.createdAt)}</Text>
                  )}
                  <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
                    {!isMine && (
                      <View style={styles.avatar}>
                        <Ionicons name="person" size={14} color={colors.primary} />
                      </View>
                    )}
                    <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      <Text style={[styles.bubbleTxt, isMine && styles.bubbleTxtMine]}>
                        {item.content}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )
      }

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message…"
          placeholderTextColor={colors.muted}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={send}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!text.trim()}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, marginRight: spacing.sm },
  headerCenter: { flex: 1 },
  headerName: { ...typography.h3 },
  headerSub: { ...typography.caption, color: colors.muted, marginTop: 1 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { padding: spacing.md, paddingBottom: spacing.lg, flexGrow: 1 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: spacing.sm },
  emptyTxt: { ...typography.h3, color: colors.muted },
  emptySub: { ...typography.body, textAlign: 'center', color: colors.muted },

  timestamp: { textAlign: 'center', ...typography.caption, color: colors.muted, marginVertical: spacing.sm },

  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  bubbleRowMine: { flexDirection: 'row-reverse' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleTheirs: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    marginLeft: spacing.xs,
  },
  bubbleTxt: { fontSize: 15, color: colors.dark, lineHeight: 20 },
  bubbleTxtMine: { color: colors.white },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.dark,
    backgroundColor: colors.surface,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },
});
