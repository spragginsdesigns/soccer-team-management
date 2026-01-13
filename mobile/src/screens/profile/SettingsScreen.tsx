import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { Card, CardHeader, CardTitle, CardContent, Separator, Switch } from '@/components/ui';

export function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Notifications */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Switch
            checked={notifications}
            onCheckedChange={setNotifications}
            label="Push Notifications"
            description="Receive notifications about team updates"
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent style={styles.aboutContent}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://formup.app/privacy')}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={18} color={colors.muted.foreground} />
          </TouchableOpacity>

          <Separator style={styles.separator} />

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://formup.app/terms')}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
            <Ionicons name="open-outline" size={18} color={colors.muted.foreground} />
          </TouchableOpacity>

          <Separator style={styles.separator} />

          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Version</Text>
            <Text style={styles.versionValue}>1.0.0</Text>
          </View>
        </CardContent>
      </Card>

      {/* Support */}
      <Card style={styles.card}>
        <CardHeader>
          <CardTitle>Support</CardTitle>
        </CardHeader>
        <CardContent style={styles.aboutContent}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleOpenLink('mailto:support@formup.app')}
          >
            <Ionicons name="mail-outline" size={20} color={colors.foreground} />
            <Text style={styles.linkText}>Contact Support</Text>
            <Ionicons name="open-outline" size={18} color={colors.muted.foreground} />
          </TouchableOpacity>

          <Separator style={styles.separator} />

          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => handleOpenLink('https://formup.app/help')}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.foreground} />
            <Text style={styles.linkText}>Help Center</Text>
            <Ionicons name="open-outline" size={18} color={colors.muted.foreground} />
          </TouchableOpacity>
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
  aboutContent: {
    padding: 0,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  linkText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  separator: {
    marginVertical: 0,
    marginHorizontal: spacing.lg,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  versionLabel: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  versionValue: {
    fontSize: fontSize.base,
    color: colors.muted.foreground,
  },
});
