import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: colors.slate[700],
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.slate[800],
          borderRadius: 12,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.slate[700],
        },
        style,
      ]}
    >
      <Skeleton height={16} width="60%" />
      <Skeleton height={12} width="40%" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Skeleton height={32} width={80} borderRadius={8} />
        <Skeleton height={32} width={80} borderRadius={8} />
      </View>
    </View>
  );
}
