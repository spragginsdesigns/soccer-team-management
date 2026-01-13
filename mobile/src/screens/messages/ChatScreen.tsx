import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Avatar, LoadingSpinner, EmptyState } from '@/components/ui';
import type { MessagesStackScreenProps } from '@/navigation/types';

export function ChatScreen() {
  const route = useRoute<MessagesStackScreenProps<'Chat'>['route']>();
  const navigation = useNavigation<MessagesStackScreenProps<'Chat'>['navigation']>();
  const { recipientId, conversationType } = route.params;

  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Get conversation messages
  const messages = useQuery(
    api.messages.getConversationMessages,
    recipientId ? { conversationId: recipientId as Id<'conversations'> } : 'skip'
  );
  const user = useQuery(api.users.getCurrentUser);
  const sendMessage = useMutation(api.messages.sendMessage);

  // Update navigation title
  useEffect(() => {
    navigation.setOptions({ title: 'Team Chat' });
  }, [navigation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!message.trim() || !recipientId) return;

    setSending(true);
    try {
      await sendMessage({
        conversationId: recipientId as Id<'conversations'>,
        content: message.trim(),
      });
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!recipientId) {
    return (
      <EmptyState
        icon="chatbubble-outline"
        title="Select a Conversation"
        description="Choose a conversation to start chatting"
        style={{ flex: 1 }}
      />
    );
  }

  if (messages === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  const renderMessage = ({ item, index }: { item: typeof messages[0]; index: number }) => {
    const isOwnMessage = item.senderId === user?._id;
    const showAvatar = !isOwnMessage && (
      index === 0 || messages[index - 1]?.senderId !== item.senderId
    );

    return (
      <View style={[
        styles.messageRow,
        isOwnMessage && styles.messageRowOwn,
      ]}>
        {!isOwnMessage && (
          <View style={styles.avatarContainer}>
            {showAvatar ? (
              <Avatar fallback={item.senderName || 'User'} size="sm" />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
        ]}>
          {!isOwnMessage && showAvatar && (
            <Text style={styles.senderName}>{item.senderName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isOwnMessage && styles.messageTextOwn,
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isOwnMessage && styles.messageTimeOwn,
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={90}
      >
        {messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-outline"
            title="No Messages"
            description="Start the conversation by sending a message"
            style={{ flex: 1 }}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messagesList}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={colors.muted.foreground}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            <Ionicons
              name="send"
              size={20}
              color={message.trim() && !sending ? colors.primary.foreground : colors.muted.foreground}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary.DEFAULT,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: colors.muted.DEFAULT,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary.DEFAULT,
    marginBottom: spacing.xs,
  },
  messageText: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: colors.primary.foreground,
  },
  messageTime: {
    fontSize: fontSize.xs,
    color: colors.muted.foreground,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.muted.DEFAULT,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.muted.DEFAULT,
  },
});
