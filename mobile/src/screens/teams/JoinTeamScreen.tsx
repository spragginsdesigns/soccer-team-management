import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useMutation } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { api } from '@convex/_generated/api';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { TeamsStackScreenProps } from '@/navigation/types';

export function JoinTeamScreen() {
  const navigation = useNavigation<TeamsStackScreenProps<'JoinTeam'>['navigation']>();
  const joinTeam = useMutation(api.teamMembers.joinTeam);

  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await joinTeam({ inviteCode: inviteCode.trim().toUpperCase() });
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to join team. Please check the invite code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Card>
          <CardHeader>
            <CardTitle>Join a Team</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.description}>
              Enter the invite code provided by your team coach to join the team.
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Invite Code"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              placeholder="Enter 8-character code"
              autoCapitalize="characters"
              maxLength={8}
              containerStyle={styles.input}
            />

            <Button
              onPress={handleJoin}
              loading={loading}
              style={styles.button}
            >
              Join Team
            </Button>
          </CardContent>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.muted.foreground,
    marginBottom: spacing.lg,
    lineHeight: 20,
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
  input: {
    marginBottom: spacing.lg,
  },
  button: {
    marginTop: spacing.sm,
  },
});
