import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { useAuthActions } from '@convex-dev/auth/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Card, CardContent, Avatar, Badge, Separator } from '@/components/ui';
import type { ProfileStackScreenProps } from '@/navigation/types';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

export function ProfileScreen() {
  const navigation = useNavigation<ProfileStackScreenProps<'Profile'>['navigation']>();
  const { signOut } = useAuthActions();

  const user = useQuery(api.users.getCurrentUser);
  const userProfile = useQuery(api.userProfiles.get);
  const teams = useQuery(api.teams.getAll);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => signOut(),
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: 'log-out-outline',
      label: 'Sign Out',
      onPress: handleSignOut,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Avatar
            fallback={user?.name ?? undefined}
            size="xl"
          />
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {userProfile?.role && (
            <Badge
              variant={userProfile.role === 'coach' ? 'default' : 'secondary'}
              style={styles.roleBadge}
            >
              {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
            </Badge>
          )}
        </View>

        {/* Stats */}
        <Card style={styles.statsCard}>
          <CardContent style={styles.statsContent}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{teams?.length || 0}</Text>
              <Text style={styles.statLabel}>Teams</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {userProfile?.role || '-'}
              </Text>
              <Text style={styles.statLabel}>Role</Text>
            </View>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          <CardContent style={styles.menuContent}>
            {menuItems.map((item, index) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={22}
                    color={item.destructive ? colors.destructive.DEFAULT : colors.foreground}
                  />
                  <Text style={[
                    styles.menuLabel,
                    item.destructive && styles.menuLabelDestructive,
                  ]}>
                    {item.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.muted.foreground}
                  />
                </TouchableOpacity>
                {index < menuItems.length - 1 && <Separator style={styles.menuSeparator} />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>FormUp</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  header: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  userName: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    marginTop: spacing.md,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginTop: spacing.xs,
  },
  roleBadge: {
    marginTop: spacing.md,
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  menuCard: {
    marginBottom: spacing.lg,
  },
  menuContent: {
    padding: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  menuLabel: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  menuLabelDestructive: {
    color: colors.destructive.DEFAULT,
  },
  menuSeparator: {
    marginVertical: 0,
    marginHorizontal: spacing.lg,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  appName: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.muted.foreground,
  },
  appVersion: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginTop: spacing.xs,
  },
});
