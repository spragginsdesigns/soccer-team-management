import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useQuery } from 'convex/react';
import { useRoute } from '@react-navigation/native';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { ASSESSMENT_CATEGORIES, getLegacyRatingKey } from '@lib/assessmentSchema';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  LoadingSpinner,
} from '@/components/ui';
import type { HomeStackScreenProps } from '@/navigation/types';

export function AssessmentDetailsScreen() {
  const route = useRoute<HomeStackScreenProps<'AssessmentDetails'>['route']>();
  const { assessmentId } = route.params;

  const assessment = useQuery(api.assessments.getById, {
    id: assessmentId as Id<'assessments'>,
  });

  if (assessment === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  if (assessment === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Assessment not found</Text>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRatingColor = (rating: number) => {
    return colors.ratings[rating as keyof typeof colors.ratings] || colors.muted.DEFAULT;
  };

  const ratingLabels: Record<number, string> = {
    1: 'Needs Dev',
    2: 'Developing',
    3: 'Competent',
    4: 'Advanced',
    5: 'Elite',
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(assessment._creationTime)}</Text>
        <Badge variant="secondary">
          {Object.keys(assessment.ratings || {}).length} skills rated
        </Badge>
      </View>

      {/* Categories with Ratings */}
      {ASSESSMENT_CATEGORIES.map((category) => {
        const categoryRatings = category.skills
          .map((skill) => {
            const key = getLegacyRatingKey(category.name, skill.name);
            return {
              skill,
              rating: assessment.ratings?.[key] || 0,
            };
          })
          .filter((item) => item.rating > 0);

        if (categoryRatings.length === 0) return null;

        return (
          <Card key={category.id} style={styles.card}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryRatings.map(({ skill, rating }) => (
                <View key={skill.id} style={styles.skillRow}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  <View style={styles.ratingDisplay}>
                    <View
                      style={[
                        styles.ratingBadge,
                        { backgroundColor: getRatingColor(rating) },
                      ]}
                    >
                      <Text style={styles.ratingNumber}>{rating}</Text>
                    </View>
                    <Text style={styles.ratingLabel}>{ratingLabels[rating]}</Text>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Notes */}
      {assessment.notes && Object.keys(assessment.notes).length > 0 && (
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.notes}>
              {typeof assessment.notes === 'object'
                ? Object.values(assessment.notes).join('\n')
                : String(assessment.notes)}
            </Text>
          </CardContent>
        </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  card: {
    marginBottom: 0,
  },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skillName: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    flex: 1,
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ratingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNumber: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  ratingLabel: {
    fontSize: fontSize.xs,
    color: colors.muted.foreground,
    minWidth: 70,
  },
  notes: {
    fontSize: fontSize.base,
    color: colors.foreground,
    lineHeight: 24,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.destructive.DEFAULT,
    textAlign: 'center',
    padding: spacing.lg,
  },
});
