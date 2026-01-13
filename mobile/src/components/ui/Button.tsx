import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'default',
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const buttonStyles: ViewStyle[] = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    (disabled || loading) && styles.disabled,
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const textStyles: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.foreground : colors.primary.foreground}
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },

  // Variants
  variant_default: {
    backgroundColor: colors.primary.DEFAULT,
  },
  variant_destructive: {
    backgroundColor: colors.destructive.DEFAULT,
  },
  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  variant_secondary: {
    backgroundColor: colors.secondary.DEFAULT,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_link: {
    backgroundColor: 'transparent',
  },

  // Sizes
  size_default: {
    height: 44,
    paddingHorizontal: spacing.lg,
  },
  size_sm: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  size_lg: {
    height: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  size_icon: {
    height: 44,
    width: 44,
    padding: 0,
  },

  // Text styles
  text: {
    fontWeight: '500',
    textAlign: 'center',
  },
  text_default: {
    color: colors.primary.foreground,
    fontSize: fontSize.sm,
  },
  text_destructive: {
    color: colors.destructive.foreground,
    fontSize: fontSize.sm,
  },
  text_outline: {
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  text_secondary: {
    color: colors.secondary.foreground,
    fontSize: fontSize.sm,
  },
  text_ghost: {
    color: colors.foreground,
    fontSize: fontSize.sm,
  },
  text_link: {
    color: colors.primary.DEFAULT,
    fontSize: fontSize.sm,
  },
  text_sm: {
    fontSize: fontSize.xs,
  },
  text_lg: {
    fontSize: fontSize.base,
  },
  text_icon: {
    fontSize: fontSize.base,
  },

  disabled: {
    opacity: 0.5,
  },
});
