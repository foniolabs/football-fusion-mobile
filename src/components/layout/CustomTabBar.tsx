import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Trophy, Users, ChartLineUp, User } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_ITEMS = [
  { name: 'index', label: 'Home', icon: House },
  { name: 'tournaments', label: 'Tournaments', icon: Trophy },
  { name: 'team', label: 'Team', icon: Users, isCenter: true },
  { name: 'leaderboard', label: 'Leaderboard', icon: ChartLineUp },
  { name: 'profile', label: 'Profile', icon: User },
];

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      {/* Gradient top border */}
      <LinearGradient
        colors={['transparent', `${colors.primary.DEFAULT}80`, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />

      {/* Background */}
      <View style={styles.background} />

      {/* Tab items */}
      <View style={styles.tabRow}>
        {TAB_ITEMS.map((item, index) => {
          const isActive = state.index === index;
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Pressable
                key={item.name}
                onPress={() => navigation.navigate(item.name)}
                style={styles.centerTabWrapper}
              >
                <View
                  style={[
                    styles.centerTab,
                    {
                      backgroundColor: colors.primary.DEFAULT,
                      shadowColor: colors.primary.DEFAULT,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 8,
                    },
                  ]}
                >
                  <Icon size={28} weight="bold" color={colors.white} />
                </View>
                <Text style={[styles.label, { color: colors.slate[400] }]}>{item.label}</Text>
              </Pressable>
            );
          }

          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={styles.tab}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  size={22}
                  weight={isActive ? 'fill' : 'regular'}
                  color={isActive ? colors.primary.DEFAULT : colors.slate[500]}
                />
                {isActive && <View style={styles.activeDot} />}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isActive ? colors.primary.DEFAULT : colors.slate[500] },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  topBorder: {
    height: 1,
    width: '100%',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,6,23,0.92)',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary.DEFAULT,
  },
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  centerTab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    marginTop: 2,
  },
});
