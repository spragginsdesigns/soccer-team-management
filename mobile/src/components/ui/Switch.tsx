import React from 'react';
import {
  Switch as RNSwitch,
  StyleSheet,
  View,
  Text,
  ViewStyle,
  SwitchProps as RNSwitchProps,
} from 'react-native';
import { colors, spacing, fontSize } from '@/constants/theme';

interface SwitchProps extends Omit<RNSwitchProps, 'value' | 'onValueChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  containerStyle?: ViewStyle;
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  containerStyle,
  disabled,
  ...props
}: SwitchProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {(label || description) && (
        <View style={styles.labelContainer}>
          {label && (
            <Text style={[styles.label, disabled && styles.disabled]}>
              {label}
            </Text>
          )}
          {description && (
            <Text style={[styles.description, disabled && styles.disabled]}>
              {description}
            </Text>
          )}
        </View>
      )}
      <RNSwitch
        value={checked}
        onValueChange={onCheckedChange}
        disabled={disabled}
        trackColor={{
          false: colors.muted.DEFAULT,
          true: colors.primary.DEFAULT,
        }}
        thumbColor={colors.foreground}
        ios_backgroundColor={colors.muted.DEFAULT}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  labelContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.foreground,
  },
  description: {
    fontSize: fontSize.xs,
    color: colors.muted.foreground,
  },
  disabled: {
    opacity: 0.5,
  },
});
