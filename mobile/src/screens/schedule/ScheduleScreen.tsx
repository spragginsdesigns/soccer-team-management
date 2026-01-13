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

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Card, CardContent, Badge, LoadingSpinner, EmptyState, Button } from '@/components/ui';
import type { ScheduleStackScreenProps } from '@/navigation/types';

type EventType = 'practice' | 'game' | 'meeting' | 'other';

export function ScheduleScreen() {
  const navigation = useNavigation<ScheduleStackScreenProps<'Schedule'>['navigation']>();
  const [refreshing, setRefreshing] = React.useState(false);

  const teams = useQuery(api.teams.getAll);
  const firstTeamId = teams?.[0]?._id;
  const events = useQuery(
    api.scheduleEvents.getUpcoming,
    firstTeamId ? { teamId: firstTeamId } : 'skip'
  );
  const userProfile = useQuery(api.userProfiles.get);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (events === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  const getEventTypeColor = (type: EventType) => {
    return colors.eventTypes[type] || colors.eventTypes.other;
  };

  const getEventIcon = (type: EventType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'practice': return 'fitness-outline';
      case 'game': return 'football-outline';
      case 'meeting': return 'people-outline';
      default: return 'calendar-outline';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderEvent = ({ item }: { item: (typeof events)[0] }) => {
    const typeColors = getEventTypeColor(item.type as EventType);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('EventDetails', { eventId: item._id })}
        activeOpacity={0.7}
      >
        <Card style={styles.eventCard}>
          <CardContent style={styles.eventCardContent}>
            <View style={[styles.eventIcon, { backgroundColor: typeColors.bg }]}>
              <Ionicons
                name={getEventIcon(item.type as EventType)}
                size={24}
                color={typeColors.text}
              />
            </View>
            <View style={styles.eventInfo}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <View style={styles.eventMeta}>
                <Ionicons name="time-outline" size={14} color={colors.muted.foreground} />
                <Text style={styles.eventMetaText}>
                  {formatDate(item.startTime)} at {formatTime(item.startTime)}
                </Text>
              </View>
              {item.location && (
                <View style={styles.eventMeta}>
                  <Ionicons name="location-outline" size={14} color={colors.muted.foreground} />
                  <Text style={styles.eventMetaText} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              )}
            </View>
            <Badge
              variant="outline"
              style={[styles.typeBadge, { borderColor: typeColors.border }]}
              textStyle={{ color: typeColors.text }}
            >
              {item.type}
            </Badge>
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Add Event Button (Coach only) */}
      {userProfile?.role === 'coach' && (
        <View style={styles.header}>
          <Button
            onPress={() => navigation.navigate('CreateEvent')}
            style={styles.addButton}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary.foreground} />
            <Text style={styles.addButtonText}>Add Event</Text>
          </Button>
        </View>
      )}

      {events.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title="No Upcoming Events"
          description="No events scheduled yet"
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary.DEFAULT}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addButton: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addButtonText: {
    color: colors.primary.foreground,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  eventCard: {
    marginBottom: 0,
  },
  eventCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.lg,
    gap: spacing.md,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  eventMetaText: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    flex: 1,
  },
});
