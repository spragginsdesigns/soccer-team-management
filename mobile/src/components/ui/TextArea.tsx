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

interface TextAreaProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rows?: number;
}

export const TextArea = forwardRef<TextInput, TextAreaProps>(
  ({ label, error, containerStyle, style, rows = 4, ...props }, ref) => {
    const minHeight = rows * 24;

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          multiline
          textAlignVertical="top"
          style={[
            styles.input,
            { minHeight },
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

TextArea.displayName = 'TextArea';

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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
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
