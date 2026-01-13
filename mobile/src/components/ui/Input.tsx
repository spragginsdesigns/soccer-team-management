import React, { forwardRef } from 'react';
import {
  TextInput,
  StyleSheet,
  TextInputProps,
  View,
  Text,
  ViewStyle,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, containerStyle, style, ...props }, ref) => {
    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          style={[
            styles.input,
            error && styles.inputError,
            style,
          ]}
          placeholderTextColor={colors.muted.foreground}
          {...props}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.foreground,
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: borderRadius.md,
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  inputError: {
    borderColor: colors.destructive.DEFAULT,
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.destructive.DEFAULT,
  },
});
