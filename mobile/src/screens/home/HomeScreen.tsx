import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '@convex/_generated/api';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Avatar,
  LoadingSpinner,
  EmptyState,
} from '@/components/ui';
import type { HomeStackScreenProps } from '@/navigation/types';

export function HomeScreen() {
  const navigation = useNavigation<HomeStackScreenProps<'Home'>['navigation']>();
  const [refreshing, setRefreshing] = React.useState(false);

  // Fetch data
  const userProfile = useQuery(api.userProfiles.get);
  const teams = useQuery(api.teams.getAll);
  const user = useQuery(api.users.getCurrentUser);

  // Get first team's players (for coach view)
  const firstTeamId = teams?.[0]?._id;
  const players = useQuery(
    api.players.getByTeam,
    firstTeamId ? { teamId: firstTeamId } : 'skip'
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Data will auto-refresh via Convex subscriptions
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (userProfile === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Badge variant={userProfile?.role === 'coach' ? 'default' : 'secondary'}>
            {userProfile?.role || 'User'}
          </Badge>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {/* Teams Overview */}
        <Card style={styles.card}>
          <CardHeader>
            <View style={styles.cardHeaderRow}>
              <CardTitle>My Teams</CardTitle>
              <TouchableOpacity
                onPress={() => navigation.getParent()?.navigate('TeamsTab')}
              >
                <Text style={styles.linkText}>View All</Text>
              </TouchableOpacity>
            </View>
          </CardHeader>
          <CardContent>
            {teams === undefined ? (
              <LoadingSpinner size="small" />
            ) : teams.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="No Teams Yet"
                description="Join or create a team to get started"
                actionLabel="Join Team"
                onAction={() => navigation.getParent()?.navigate('TeamsTab', {
                  screen: 'JoinTeam',
                })}
              />
            ) : (
              <View style={styles.teamsList}>
                {teams.slice(0, 3).map((team: typeof teams[0]) => (
                  <TouchableOpacity
                    key={team._id}
                    style={styles.teamItem}
                    onPress={() => navigation.getParent()?.navigate('TeamsTab', {
                      screen: 'TeamDetails',
                      params: { teamId: team._id },
                    })}
                  >
                    <View style={styles.teamIcon}>
                      <Ionicons
                        name="football-outline"
                        size={24}
                        color={colors.primary.DEFAULT}
                      />
                    </View>
                    <View style={styles.teamInfo}>
                      <Text style={styles.teamName}>{team.name}</Text>
                      <Text style={styles.teamMeta}>
                        {team.memberRole || 'Team Member'}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.muted.foreground}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </CardContent>
        </Card>

        {/* Players (Coach View) */}
        {userProfile?.role === 'coach' && players && players.length > 0 && (
          <Card style={styles.card}>
            <CardHeader>
              <View style={styles.cardHeaderRow}>
                <CardTitle>Recent Players</CardTitle>
                <TouchableOpacity>
                  <Text style={styles.linkText}>View All</Text>
                </TouchableOpacity>
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.playersList}>
                {players.slice(0, 5).map((player: typeof players[0]) => (
                  <TouchableOpacity
                    key={player._id}
                    style={styles.playerItem}
                    onPress={() => navigation.navigate('PlayerDetails', {
                      playerId: player._id,
                    })}
                  >
                    <Avatar
                      fallback={player.name}
                      size="md"
                    />
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
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={styles.card}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <View style={styles.quickActions}>
              {userProfile?.role === 'coach' && (
                <>
                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => navigation.getParent()?.navigate('ScheduleTab', {
                      screen: 'CreateEvent',
                    })}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="add-circle-outline" size={24} color={colors.primary.DEFAULT} />
                    </View>
                    <Text style={styles.quickActionText}>Add Event</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.quickAction}
                    onPress={() => navigation.getParent()?.navigate('MessagesTab')}
                  >
                    <View style={styles.quickActionIcon}>
                      <Ionicons name="chatbubble-outline" size={24} color={colors.primary.DEFAULT} />
                    </View>
                    <Text style={styles.quickActionText}>Send Message</Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => navigation.getParent()?.navigate('ScheduleTab')}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="calendar-outline" size={24} color={colors.primary.DEFAULT} />
                </View>
                <Text style={styles.quickActionText}>View Schedule</Text>
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  card: {
    marginBottom: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary.DEFAULT,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  teamsList: {
    gap: spacing.sm,
  },
  teamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.muted.DEFAULT,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  teamIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
  },
  teamMeta: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
  },
  playersList: {
    gap: spacing.sm,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    alignItems: 'center',
    padding: spacing.md,
    minWidth: 100,
    gap: spacing.sm,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    textAlign: 'center',
  },
});
