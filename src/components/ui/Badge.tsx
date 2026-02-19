import React, { useEffect } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

type BadgeVariant = 'default' | 'live' | 'success' | 'warning' | 'danger';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: { bg: 'rgba(39,39,42,0.8)', text: colors.slate[200], border: colors.slate[700] },
  live: { bg: 'rgba(239,68,68,0.9)', text: colors.white, border: '#F87171' },
  success: { bg: 'rgba(16,185,129,0.9)', text: colors.white, border: '#34D399' },
  warning: { bg: 'rgba(245,158,11,0.9)', text: colors.white, border: '#FBBF24' },
  danger: { bg: 'rgba(239,68,68,0.9)', text: colors.white, border: '#F87171' },
};

function PulseDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.3, { duration: 1000 }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 8, height: 8, position: 'relative' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.white,
          },
          animatedStyle,
        ]}
      />
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.white,
        }}
      />
    </View>
  );
}

export function Badge({ children, variant = 'default', pulse = false, style }: BadgeProps) {
  const v = variantStyles[variant];

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: v.bg,
    borderWidth: 1,
    borderColor: v.border,
  };

  return (
    <View style={[containerStyle, style]}>
      {(pulse || variant === 'live') && <PulseDot />}
      {typeof children === 'string' ? (
        <Text style={{ color: v.text, fontSize: 12, fontFamily: 'DMSans_700Bold' }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}
