import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@convex/_generated/api';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Button } from '@/components/ui';

type Role = 'coach' | 'player' | 'parent';

interface RoleOption {
  role: Role;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const roles: RoleOption[] = [
  {
    role: 'coach',
    title: 'Coach',
    description: 'Manage teams, players, and assessments',
    icon: 'clipboard-outline',
  },
  {
    role: 'player',
    title: 'Player',
    description: 'View your assessments and track progress',
    icon: 'football-outline',
  },
  {
    role: 'parent',
    title: 'Parent',
    description: "Monitor your child's development",
    icon: 'people-outline',
  },
];

export function OnboardingScreen() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const createProfile = useMutation(api.userProfiles.create);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      await createProfile({ role: selectedRole });
    } catch (error) {
      console.error('Failed to create profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to FormUp</Text>
          <Text style={styles.subtitle}>
            Select your role to get started
          </Text>
        </View>

        <View style={styles.roleList}>
          {roles.map((option) => (
            <TouchableOpacity
              key={option.role}
              style={[
                styles.roleCard,
                selectedRole === option.role && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole(option.role)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconContainer,
                selectedRole === option.role && styles.iconContainerSelected,
              ]}>
                <Ionicons
                  name={option.icon}
                  size={28}
                  color={selectedRole === option.role ? colors.primary.foreground : colors.primary.DEFAULT}
                />
              </View>
              <View style={styles.roleInfo}>
                <Text style={styles.roleTitle}>{option.title}</Text>
                <Text style={styles.roleDescription}>{option.description}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedRole === option.role && styles.radioOuterSelected,
              ]}>
                {selectedRole === option.role && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          onPress={handleContinue}
          loading={loading}
          disabled={!selectedRole}
          style={styles.button}
        >
          Continue
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing['3xl'],
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.muted.foreground,
    textAlign: 'center',
  },
  roleList: {
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card.DEFAULT,
    gap: spacing.md,
  },
  roleCardSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: 'rgba(132, 204, 22, 0.05)',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(132, 204, 22, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSelected: {
    backgroundColor: colors.primary.DEFAULT,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.xs,
  },
  roleDescription: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary.DEFAULT,
  },
  button: {
    marginTop: spacing.lg,
  },
});
