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
import type { TeamsStackScreenProps } from '@/navigation/types';

export function TeamsListScreen() {
  const navigation = useNavigation<TeamsStackScreenProps<'TeamsList'>['navigation']>();
  const [refreshing, setRefreshing] = React.useState(false);

  const teams = useQuery(api.teams.getAll);
  const userProfile = useQuery(api.userProfiles.get);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (teams === undefined) {
    return <LoadingSpinner fullScreen />;
  }

  const renderTeam = ({ item: team }: { item: (typeof teams)[0] }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('TeamDetails', { teamId: team._id })}
      activeOpacity={0.7}
    >
      <Card style={styles.teamCard}>
        <CardContent style={styles.teamCardContent}>
          <View style={styles.teamIcon}>
            <Ionicons
              name="football-outline"
              size={32}
              color={colors.primary.DEFAULT}
            />
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamMeta}>
              {team.memberRole === 'owner' ? 'Owner' : team.memberRole === 'coach' ? 'Coach' : 'Member'}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={colors.muted.foreground}
          />
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={() => navigation.navigate('JoinTeam')}
          style={styles.actionButton}
        >
          Join Team
        </Button>
        {userProfile?.role === 'coach' && (
          <Button
            onPress={() => navigation.navigate('CreateTeam')}
            style={styles.actionButton}
          >
            Create Team
          </Button>
        )}
      </View>

      {teams.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="No Teams Yet"
          description="Join an existing team with an invite code or create your own team"
          style={styles.emptyState}
        />
      ) : (
        <FlatList
          data={teams}
          renderItem={renderTeam}
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButton: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  teamCard: {
    marginBottom: 0,
  },
  teamCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  teamIcon: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  teamMeta: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    flex: 1,
  },
});
