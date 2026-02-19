import React from 'react';
import { View, Pressable, type ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

type CardVariant = 'default' | 'glass' | 'gradient' | 'bordered';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  className?: string;
}

const variantStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.slate[800],
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  glass: {
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  gradient: {
    backgroundColor: colors.slate[800],
    borderWidth: 1,
    borderColor: colors.slate[700],
  },
  bordered: {
    backgroundColor: colors.slate[800],
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
};

export function Card({ children, variant = 'default', onPress, style }: CardProps) {
  const baseStyle: ViewStyle = {
    borderRadius: 12,
    overflow: 'hidden',
    ...variantStyles[variant],
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed && { opacity: 0.95 }, style]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{children}</View>;
}

export function CardHeader({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[{ padding: 16 }, style]}>{children}</View>;
}

export function CardContent({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[{ paddingHorizontal: 16, paddingBottom: 16 }, style]}>{children}</View>;
}

export function CardFooter({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[{ paddingHorizontal: 16, paddingBottom: 16 }, style]}>{children}</View>;
}
