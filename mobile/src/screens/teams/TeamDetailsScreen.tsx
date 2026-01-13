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
  Separator,
} from '@/components/ui';
import type { TeamsStackScreenProps } from '@/navigation/types';

export function TeamDetailsScreen() {
  const route = useRoute<TeamsStackScreenProps<'TeamDetails'>['route']>();
  const navigation = useNavigation<TeamsStackScreenProps<'TeamDetails'>['navigation']>();
  const { teamId } = route.params;

  const team = useQuery(api.teams.getById, { teamId: teamId as Id<'teams'> });
  const players = useQuery(api.players.getByTeam, { teamId: teamId as Id<'teams'> });
  const userProfile = useQuery(api.userProfiles.get);

  React.useEffect(() => {
    if (team) {
      navigation.setOptions({ title: team.name });
    }
  }, [team, navigation]);

  if (team === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  if (team === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Team not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Team Header */}
      <View style={styles.header}>
        <View style={styles.teamIcon}>
          <Ionicons
            name="football"
            size={48}
            color={colors.primary.DEFAULT}
          />
        </View>
        <Text style={styles.teamName}>{team.name}</Text>
        {team.memberRole && (
          <Badge variant="secondary">
            {team.memberRole === 'owner' ? 'Owner' : team.memberRole === 'coach' ? 'Coach' : 'Member'}
          </Badge>
        )}
      </View>

      {/* Team Info */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Players</Text>
            <Text style={styles.infoValue}>{players?.length || 0}</Text>
          </View>
          {userProfile?.role === 'coach' && team.inviteCode && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Invite Code</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{team.inviteCode}</Text>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Players List */}
      <Card style={styles.card}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <CardTitle>Players ({players?.length || 0})</CardTitle>
          </View>
        </CardHeader>
        <CardContent>
          {players === undefined ? (
            <LoadingSpinner size="small" />
          ) : players.length === 0 ? (
            <Text style={styles.emptyText}>No players yet</Text>
          ) : (
            <View style={styles.playersList}>
              {players.map((player, index) => (
                <React.Fragment key={player._id}>
                  <TouchableOpacity
                    style={styles.playerItem}
                    onPress={() => navigation.getParent()?.navigate('HomeTab', {
                      screen: 'PlayerDetails',
                      params: { playerId: player._id },
                    })}
                  >
                    <Avatar fallback={player.name} size="md" />
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <Text style={styles.playerMeta}>
                        #{player.jerseyNumber || '-'} • {player.position || 'No position'}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.muted.foreground}
                    />
                  </TouchableOpacity>
                  {index < players.length - 1 && <Separator />}
                </React.Fragment>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Settings Button (Coach only) */}
      {userProfile?.role === 'coach' && (
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('TeamSettings', { teamId })}
        >
          <Ionicons name="settings-outline" size={20} color={colors.foreground} />
          <Text style={styles.settingsText}>Team Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.muted.foreground} />
        </TouchableOpacity>
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
  teamIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  card: {
    marginBottom: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSize.base,
    color: colors.muted.foreground,
  },
  infoValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  codeContainer: {
    backgroundColor: colors.muted.DEFAULT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  codeText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: colors.primary.DEFAULT,
    fontFamily: 'monospace',
  },
  playersList: {},
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  playerMeta: {
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
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.card.DEFAULT,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
});
