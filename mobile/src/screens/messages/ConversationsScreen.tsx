import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Avatar, Badge, LoadingSpinner, EmptyState } from '@/components/ui';
import type { MessagesStackScreenProps } from '@/navigation/types';

export function ConversationsScreen() {
  const navigation = useNavigation<MessagesStackScreenProps<'Conversations'>['navigation']>();
  const [refreshing, setRefreshing] = React.useState(false);

  // Get first team to load conversations
  const teams = useQuery(api.teams.getAll);
  const firstTeamId = teams?.[0]?._id;

  const conversations = useQuery(
    api.messages.getTeamConversations,
    firstTeamId ? { teamId: firstTeamId as Id<'teams'> } : 'skip'
  );
  const unreadCount = useQuery(api.messages.getUnreadCount) ?? 0;

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (teams === undefined || (firstTeamId && conversations === undefined)) {
    return <LoadingSpinner fullScreen />;
  }

  if (!firstTeamId || !teams.length) {
    return (
      <EmptyState
        icon="people-outline"
        title="No Team Yet"
        description="Join a team to start messaging"
        style={{ flex: 1 }}
      />
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderConversation = ({ item }: { item: NonNullable<typeof conversations>[0] }) => {
    const participantNames = item.participants
      .filter(p => p !== null)
      .map(p => p?.name || 'Unknown')
      .join(', ');

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', {
          recipientId: item._id,
          conversationType: 'team',
        })}
        activeOpacity={0.7}
      >
        <Avatar
          fallback={participantNames}
          size="lg"
        />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {participantNames || 'Team Chat'}
            </Text>
            {item.lastMessage && (
              <Text style={styles.conversationTime}>
                {formatTime(item.lastMessage.createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.conversationPreview}>
            <Text style={styles.previewText} numberOfLines={1}>
              {item.lastMessage?.content || 'No messages yet'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with unread count */}
      <View style={styles.header}>
        {unreadCount > 0 && (
          <Badge variant="default">
            {unreadCount} unread
          </Badge>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={() => navigation.navigate('Chat', { conversationType: 'team' })}
        >
          <Ionicons name="create-outline" size={24} color={colors.primary.DEFAULT} />
        </TouchableOpacity>
      </View>

      {!conversations || conversations.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No Messages Yet"
          description="Start a conversation with your team"
          actionLabel="New Message"
          onAction={() => navigation.navigate('Chat', { conversationType: 'team' })}
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  newMessageButton: {
    padding: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  conversationItem: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    flex: 1,
    marginRight: spacing.sm,
  },
  conversationTime: {
    fontSize: fontSize.xs,
    color: colors.muted.foreground,
  },
  conversationPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  previewText: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    flex: 1,
  },
  emptyState: {
    flex: 1,
  },
});
