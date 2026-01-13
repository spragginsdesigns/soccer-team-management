import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Card, CardHeader, CardTitle, CardContent, Badge, LoadingSpinner, Button } from '@/components/ui';
import type { ScheduleStackScreenProps } from '@/navigation/types';

type EventType = 'practice' | 'game' | 'meeting' | 'other';

export function EventDetailsScreen() {
  const route = useRoute<ScheduleStackScreenProps<'EventDetails'>['route']>();
  const navigation = useNavigation<ScheduleStackScreenProps<'EventDetails'>['navigation']>();
  const { eventId } = route.params;

  const teams = useQuery(api.teams.getAll);
  const firstTeamId = teams?.[0]?._id;
  const events = useQuery(
    api.scheduleEvents.getByTeam,
    firstTeamId ? { teamId: firstTeamId } : 'skip'
  );
  const event = events?.find(e => e._id === eventId) ?? null;
  const userProfile = useQuery(api.userProfiles.get);
  const deleteEvent = useMutation(api.scheduleEvents.remove);

  if (events === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  if (event === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  const getEventTypeColor = (type: EventType) => {
    return colors.eventTypes[type] || colors.eventTypes.other;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent({ eventId: eventId as Id<'scheduleEvents'> });
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete event');
            }
          },
        },
      ]
    );
  };

  const typeColors = getEventTypeColor(event.type as EventType);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.eventIcon, { backgroundColor: typeColors.bg }]}>
          <Ionicons
            name={event.type === 'practice' ? 'fitness-outline' : event.type === 'game' ? 'football-outline' : 'calendar-outline'}
            size={32}
            color={typeColors.text}
          />
        </View>
        <Text style={styles.eventTitle}>{event.title}</Text>
        <Badge
          variant="outline"
          style={{ borderColor: typeColors.border }}
          textStyle={{ color: typeColors.text }}
        >
          {event.type}
        </Badge>
      </View>

      {/* Details */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.muted.foreground} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(event.startTime)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color={colors.muted.foreground} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>
                {formatTime(event.startTime)}
                {event.endTime && ` - ${formatTime(event.endTime)}`}
              </Text>
            </View>
          </View>

          {event.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={colors.muted.foreground} />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{event.location}</Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {event.notes && (
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.notes}>{event.notes}</Text>
          </CardContent>
        </Card>
      )}

      {/* Coach Actions */}
      {userProfile?.role === 'coach' && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={() => navigation.navigate('EditEvent', { eventId })}
            style={styles.actionButton}
          >
            Edit Event
          </Button>
          <Button
            variant="destructive"
            onPress={handleDelete}
            style={styles.actionButton}
          >
            Delete Event
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  eventIcon: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: 'center',
  },
  card: {
    marginBottom: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginBottom: spacing.xs,
  },
  detailValue: {
    fontSize: fontSize.base,
    color: colors.foreground,
    fontWeight: fontWeight.medium,
  },
  notes: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: 24,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionButton: {
    width: '100%',
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.destructive.DEFAULT,
    textAlign: 'center',
    padding: spacing.lg,
  },
});
