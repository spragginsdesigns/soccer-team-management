import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { ASSESSMENT_CATEGORIES, getLegacyRatingKey } from '@lib/assessmentSchema';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  TextArea,
  LoadingSpinner,
} from '@/components/ui';
import type { HomeStackScreenProps } from '@/navigation/types';

export function AssessmentScreen() {
  const route = useRoute<HomeStackScreenProps<'Assessment'>['route']>();
  const navigation = useNavigation<HomeStackScreenProps<'Assessment'>['navigation']>();
  const { playerId } = route.params;

  const players = useQuery(api.players.getByTeam, { teamId: '' as Id<'teams'> });
  // Find player from the list - for now we'll skip the query if no teams
  const player = players?.find(p => p._id === playerId) ?? null;

  const createAssessment = useMutation(api.assessments.create);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [generalNotes, setGeneralNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleRatingChange = (categoryName: string, skillName: string, rating: number) => {
    const key = getLegacyRatingKey(categoryName, skillName);
    setRatings((prev) => ({ ...prev, [key]: rating }));
  };

  const handleSave = async () => {
    if (!player) return;

    setSaving(true);
    try {
      // Calculate overall rating as average
      const ratingValues = Object.values(ratings);
      const overallRating = ratingValues.length > 0
        ? Math.round(ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length)
        : 0;

      await createAssessment({
        playerId: playerId as Id<'players'>,
        teamId: player.teamId,
        evaluator: 'Coach',
        date: new Date().toISOString().split('T')[0],
        ratings,
        notes: { general: generalNotes },
        overallRating,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save assessment:', error);
    } finally {
      setSaving(false);
    }
  };

  if (player === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  const ratingLabels = ['Needs Dev', 'Developing', 'Competent', 'Advanced', 'Elite'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Assessing: <Text style={styles.playerName}>{player?.name}</Text>
      </Text>

      {ASSESSMENT_CATEGORIES.map((category) => (
        <Card key={category.id} style={styles.card}>
          <CardHeader>
            <CardTitle>{category.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {category.skills.map((skill) => {
              const key = getLegacyRatingKey(category.name, skill.name);
              const currentRating = ratings[key] || 0;

              return (
                <View key={skill.id} style={styles.skillRow}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={styles.ratingButtons}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={[
                          styles.ratingButton,
                          currentRating === rating && styles.ratingButtonActive,
                          { backgroundColor: currentRating === rating ? colors.ratings[rating as keyof typeof colors.ratings] : colors.muted.DEFAULT },
                        ]}
                        onPress={() => handleRatingChange(category.name, skill.name, rating)}
                      >
                        <Text
                          style={[
                            styles.ratingText,
                            currentRating === rating && styles.ratingTextActive,
                          ]}
                        >
                          {rating}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* General Notes */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>General Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <TextArea
            value={generalNotes}
            onChangeText={setGeneralNotes}
            placeholder="Add any additional notes about this assessment..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Rating Legend */}
      <View style={styles.legend}>
        {ratingLabels.map((label, index) => (
          <View key={label} style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.ratings[(index + 1) as keyof typeof colors.ratings] },
              ]}
            />
            <Text style={styles.legendText}>{index + 1} = {label}</Text>
          </View>
        ))}
      </View>

      {/* Save Button */}
      <Button
        onPress={handleSave}
        loading={saving}
        style={styles.saveButton}
      >
        Save Assessment
      </Button>
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
    paddingBottom: spacing['4xl'],
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.muted.foreground,
  },
  playerName: {
    color: colors.foreground,
    fontWeight: fontWeight.semibold,
  },
  card: {
    marginBottom: 0,
  },
  skillRow: {
    marginBottom: spacing.lg,
  },
  skillName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  ratingButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    borderWidth: 2,
    borderColor: colors.foreground,
  },
  ratingText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.muted.foreground,
  },
  ratingTextActive: {
    color: colors.foreground,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.muted.DEFAULT,
    borderRadius: borderRadius.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: fontSize.xs,
    color: colors.muted.foreground,
  },
  saveButton: {
    marginTop: spacing.md,
  },
});
