import React from 'react';
import { View, Text, Pressable, ScrollView, type ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  style?: ViewStyle;
}

export function Tabs({ tabs, activeTab, onTabChange, style }: TabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingHorizontal: 4, paddingVertical: 4 }}
      style={[{ flexGrow: 0 }, style]}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 8,
              backgroundColor: isActive ? colors.primary.DEFAULT : colors.slate[800],
              borderWidth: isActive ? 0 : 1,
              borderColor: colors.slate[700],
            }}
          >
            {tab.icon}
            <Text
              style={{
                fontSize: 13,
                fontFamily: isActive ? 'DMSans_700Bold' : 'DMSans_500Medium',
                color: isActive ? colors.white : colors.slate[400],
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
