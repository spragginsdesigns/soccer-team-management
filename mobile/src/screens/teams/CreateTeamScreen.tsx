import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useMutation } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { api } from '@convex/_generated/api';

import { colors, spacing, fontSize, borderRadius } from '@/constants/theme';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import type { TeamsStackScreenProps } from '@/navigation/types';

export function CreateTeamScreen() {
  const navigation = useNavigation<TeamsStackScreenProps<'CreateTeam'>['navigation']>();
  const createTeam = useMutation(api.teams.create);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Please enter a team name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createTeam({
        name: name.trim(),
      });
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Card>
          <CardHeader>
            <CardTitle>Create a New Team</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.description}>
              Create a new team to start managing players and assessments.
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Input
              label="Team Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter team name"
              containerStyle={styles.input}
            />

            <Button
              onPress={handleCreate}
              loading={loading}
              style={styles.button}
            >
              Create Team
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
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
