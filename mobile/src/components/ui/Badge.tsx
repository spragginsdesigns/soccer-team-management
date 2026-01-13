import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Badge({
  children,
  variant = 'default',
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[`variant_${variant}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs - 1,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },

  // Variants
  variant_default: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: 'transparent',
  },
  variant_secondary: {
    backgroundColor: colors.secondary.DEFAULT,
    borderColor: 'transparent',
  },
  variant_destructive: {
    backgroundColor: colors.destructive.DEFAULT,
    borderColor: 'transparent',
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  variant_success: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  variant_warning: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },

  // Text
  text: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  text_default: {
    color: colors.primary.foreground,
  },
  text_secondary: {
    color: colors.secondary.foreground,
  },
  text_destructive: {
    color: colors.destructive.foreground,
  },
  text_outline: {
    color: colors.foreground,
  },
  text_success: {
    color: colors.success,
  },
  text_warning: {
    color: colors.warning,
  },
});
