import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Button, Input, TextArea, Card, CardHeader, CardTitle, CardContent, LoadingSpinner } from '@/components/ui';
import type { ScheduleStackScreenProps } from '@/navigation/types';

type EventType = 'practice' | 'game' | 'meeting' | 'other';

const eventTypes: { value: EventType; label: string }[] = [
  { value: 'practice', label: 'Practice' },
  { value: 'game', label: 'Game' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' },
];

export function EditEventScreen() {
  const route = useRoute<ScheduleStackScreenProps<'EditEvent'>['route']>();
  const navigation = useNavigation<ScheduleStackScreenProps<'EditEvent'>['navigation']>();
  const { eventId } = route.params;

  const teams = useQuery(api.teams.getAll);
  const firstTeamId = teams?.[0]?._id;
  const events = useQuery(
    api.scheduleEvents.getByTeam,
    firstTeamId ? { teamId: firstTeamId } : 'skip'
  );
  const event = events?.find(e => e._id === eventId);
  const updateEvent = useMutation(api.scheduleEvents.update);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('practice');
  const [location, setLocation] = useState('');
  const [notes, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when event loads
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setType(event.type as EventType);
      setLocation(event.location || '');
      setDescription(event.notes || '');

      const startDate = new Date(event.startTime);
      setDate(startDate.toISOString().split('T')[0]);
      setTime(startDate.toTimeString().slice(0, 5));
    }
  }, [event]);

  const handleUpdate = async () => {
    if (!title.trim()) {
      setError('Please enter an event title');
      return;
    }

    if (!date || !time) {
      setError('Please enter date and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const startTime = new Date(`${date}T${time}`).getTime();

      await updateEvent({
        eventId: eventId as Id<'scheduleEvents'>,
        title: title.trim(),
        type,
        startTime,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  if (event === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <CardHeader>
          <CardTitle>Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input
            label="Event Title"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Weekly Practice"
            containerStyle={styles.inputContainer}
          />

          <Text style={styles.label}>Event Type</Text>
          <View style={styles.typeSelector}>
            {eventTypes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeOption,
                  type === item.value && styles.typeOptionSelected,
                ]}
                onPress={() => setType(item.value)}
              >
                <Text style={[
                  styles.typeOptionText,
                  type === item.value && styles.typeOptionTextSelected,
                ]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Time"
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM (24-hour)"
            containerStyle={styles.inputContainer}
          />

          <Input
            label="Location (Optional)"
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Main Soccer Field"
            containerStyle={styles.inputContainer}
          />

          <TextArea
            label="Description (Optional)"
            value={notes}
            onChangeText={setDescription}
            placeholder="Add any additional details..."
            rows={3}
            containerStyle={styles.inputContainer}
          />

          <Button
            onPress={handleUpdate}
            loading={loading}
            style={styles.button}
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>
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
    paddingBottom: spacing['3xl'],
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: colors.destructive.DEFAULT,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeOption: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.muted.DEFAULT,
  },
  typeOptionSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
  },
  typeOptionText: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
  },
  typeOptionTextSelected: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeight.medium,
  },
  button: {
    marginTop: spacing.md,
  },
});
