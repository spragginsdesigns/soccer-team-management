import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { colors, borderRadius, fontSize } from '@/constants/theme';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: fontSize.xs,
  md: fontSize.sm,
  lg: fontSize.base,
  xl: fontSize.xl,
};

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  style,
}: AvatarProps) {
  const dimension = sizeMap[size];
  const textSize = fontSizeMap[size];

  const getInitials = (text?: string) => {
    if (!text) return '?';
    const words = text.split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return text.slice(0, 2).toUpperCase();
  };

  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.image, containerStyle as ImageStyle]}
        accessibilityLabel={alt}
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle, style]}>
      <Text style={[styles.fallbackText, { fontSize: textSize }]}>
        {getInitials(fallback || alt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.muted.DEFAULT,
  },
  fallback: {
    backgroundColor: colors.muted.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.muted.foreground,
    fontWeight: '600',
  },
});
