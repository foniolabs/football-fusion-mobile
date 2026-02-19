import React, { useState } from 'react';
import { View, Text, TextInput, type TextInputProps, type ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  icon,
  rightElement,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[{ width: '100%' }, containerStyle]}>
      {label && (
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'DMSans_600SemiBold',
            color: colors.slate[300],
            marginBottom: 8,
          }}
        >
          {label}
        </Text>
      )}

      <View style={{ position: 'relative' }}>
        {icon && (
          <View
            style={{
              position: 'absolute',
              left: 12,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
              zIndex: 1,
            }}
          >
            {icon}
          </View>
        )}

        <TextInput
          placeholderTextColor={colors.slate[500]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            {
              width: '100%',
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: 'rgba(24,24,27,0.5)',
              borderWidth: 1,
              borderColor: error
                ? colors.danger
                : isFocused
                ? colors.primary.DEFAULT
                : colors.slate[700],
              borderRadius: 12,
              color: colors.white,
              fontSize: 15,
              fontFamily: 'DMSans_400Regular',
            },
            icon ? { paddingLeft: 40 } : {},
            rightElement ? { paddingRight: 48 } : {},
            style,
          ]}
          {...props}
        />

        {rightElement && (
          <View
            style={{
              position: 'absolute',
              right: 12,
              top: 0,
              bottom: 0,
              justifyContent: 'center',
            }}
          >
            {rightElement}
          </View>
        )}
      </View>

      {error && (
        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: '#F87171',
            fontFamily: 'DMSans_400Regular',
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
