import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Card, CardHeader, CardTitle, CardContent, LoadingSpinner, Button } from '@/components/ui';
import type { TeamsStackScreenProps } from '@/navigation/types';

export function TeamSettingsScreen() {
  const route = useRoute<TeamsStackScreenProps<'TeamSettings'>['route']>();
  const navigation = useNavigation<TeamsStackScreenProps<'TeamSettings'>['navigation']>();
  const { teamId } = route.params;

  const team = useQuery(api.teams.getById, { teamId: teamId as Id<'teams'> });
  const deleteTeam = useMutation(api.teams.remove);

  const handleDeleteTeam = () => {
    Alert.alert(
      'Delete Team',
      'Are you sure you want to delete this team? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTeam({ id: teamId as Id<'teams'> });
              navigation.popToTop();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete team');
            }
          },
        },
      ]
    );
  };

  if (team === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Invite Code</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.description}>
            Share this code with players or parents to let them join your team.
          </Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{team?.inviteCode}</Text>
          </View>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.card, styles.dangerCard]}>
        <CardHeader>
          <CardTitle style={styles.dangerTitle}>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Text style={styles.dangerDescription}>
            Once you delete a team, there is no going back. All players, assessments, and data will be permanently deleted.
          </Text>
          <Button
            variant="destructive"
            onPress={handleDeleteTeam}
          >
            Delete Team
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
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginBottom: 0,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  codeContainer: {
    backgroundColor: colors.muted.DEFAULT,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  codeText: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.primary.DEFAULT,
    fontFamily: 'monospace',
    letterSpacing: 4,
  },
  dangerCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerTitle: {
    color: colors.destructive.DEFAULT,
  },
  dangerDescription: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
});
