import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary.DEFAULT, text: colors.white },
  secondary: { bg: colors.slate[600], text: colors.white },
  gradient: { bg: colors.primary.DEFAULT, text: colors.white },
  glass: { bg: 'rgba(255,255,255,0.1)', text: colors.white, border: 'rgba(255,255,255,0.2)' },
  outline: { bg: 'transparent', text: colors.slate[200], border: colors.slate[600] },
  ghost: { bg: 'transparent', text: colors.slate[300] },
  danger: { bg: colors.danger, text: colors.white },
};

const sizeStyles: Record<ButtonSize, { h: number; px: number; fontSize: number }> = {
  sm: { h: 36, px: 16, fontSize: 13 },
  md: { h: 40, px: 24, fontSize: 14 },
  lg: { h: 44, px: 32, fontSize: 15 },
  xl: { h: 48, px: 40, fontSize: 16 },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  onPress,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const containerStyle: ViewStyle = {
    backgroundColor: v.bg,
    height: s.h,
    paddingHorizontal: s.px,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: disabled || loading ? 0.5 : 1,
    ...(v.border ? { borderWidth: 1, borderColor: v.border } : {}),
    ...(fullWidth ? { width: '100%' as unknown as number } : {}),
  };

  const textStyle: TextStyle = {
    color: v.text,
    fontSize: s.fontSize,
    fontFamily: 'DMSans_500Medium',
  };

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 150 });
      }}
      style={[containerStyle, animatedStyle, style]}
    >
      {loading ? (
        <>
          <ActivityIndicator size="small" color={v.text} />
          <Text style={textStyle}>Loading...</Text>
        </>
      ) : (
        <>
          {icon && <View>{icon}</View>}
          <Text style={textStyle} numberOfLines={1}>
            {children}
          </Text>
        </>
      )}
    </AnimatedPressable>
  );
}
