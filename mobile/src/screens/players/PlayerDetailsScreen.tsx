import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from 'convex/react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Avatar,
  LoadingSpinner,
  Button,
  Separator,
} from '@/components/ui';
import type { HomeStackScreenProps } from '@/navigation/types';

export function PlayerDetailsScreen() {
  const route = useRoute<HomeStackScreenProps<'PlayerDetails'>['route']>();
  const navigation = useNavigation<HomeStackScreenProps<'PlayerDetails'>['navigation']>();
  const { playerId } = route.params;

  // Get teams to find player
  const teams = useQuery(api.teams.getAll);
  const firstTeamId = teams?.[0]?._id;
  const players = useQuery(
    api.players.getByTeam,
    firstTeamId ? { teamId: firstTeamId } : 'skip'
  );
  const player = players?.find(p => p._id === playerId) ?? null;

  const assessments = useQuery(api.assessments.getByPlayer, {
    playerId: playerId as Id<'players'>,
  });

  if (players === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  if (!player) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Player not found</Text>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Player Header */}
      <View style={styles.header}>
        <Avatar
          fallback={player.name}
          size="xl"
        />
        <Text style={styles.playerName}>{player.name}</Text>
        <View style={styles.badges}>
          {player.jerseyNumber && (
            <Badge variant="secondary">#{player.jerseyNumber}</Badge>
          )}
          {player.position && (
            <Badge variant="outline">{player.position}</Badge>
          )}
        </View>
      </View>

      {/* Player Info */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Player Information</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Jersey</Text>
              <Text style={styles.infoValue}>#{player.jerseyNumber || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Position</Text>
              <Text style={styles.infoValue}>{player.position || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Assessments</Text>
              <Text style={styles.infoValue}>{player.assessments?.length || 0}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Team</Text>
              <Text style={styles.infoValue}>{teams?.[0]?.name || '-'}</Text>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* New Assessment Button */}
      <Button
        onPress={() => navigation.navigate('Assessment', { playerId })}
        style={styles.assessButton}
      >
        <Ionicons name="add-circle-outline" size={20} color={colors.primary.foreground} />
        <Text style={styles.assessButtonText}>New Assessment</Text>
      </Button>

      {/* Assessments */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          {assessments === undefined ? (
            <LoadingSpinner size="small" />
          ) : assessments.length === 0 ? (
            <Text style={styles.emptyText}>No assessments yet</Text>
          ) : (
            <View style={styles.assessmentsList}>
              {assessments.map((assessment: typeof assessments[0], index: number) => (
                <React.Fragment key={assessment._id}>
                  <TouchableOpacity
                    style={styles.assessmentItem}
                    onPress={() => navigation.navigate('AssessmentDetails', {
                      assessmentId: assessment._id,
                    })}
                  >
                    <View style={styles.assessmentInfo}>
                      <Text style={styles.assessmentDate}>
                        {formatDate(assessment._creationTime)}
                      </Text>
                      <Text style={styles.assessmentMeta}>
                        {Object.keys(assessment.ratings || {}).length} skills rated
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.muted.foreground}
                    />
                  </TouchableOpacity>
                  {index < assessments.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </View>
          )}
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
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  playerName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: spacing.md,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    marginBottom: 0,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '50%',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  assessButton: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  assessButtonText: {
    color: colors.primary.foreground,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  assessmentsList: {
    gap: 0,
  },
  assessmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  assessmentInfo: {
    flex: 1,
  },
  assessmentDate: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  assessmentMeta: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    textAlign: 'center',
    padding: spacing.lg,
  },
  errorText: {
    fontSize: fontSize.base,
    color: colors.destructive.DEFAULT,
    textAlign: 'center',
    padding: spacing.lg,
  },
});
