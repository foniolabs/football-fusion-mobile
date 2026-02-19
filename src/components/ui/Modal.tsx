import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  type ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X } from 'phosphor-react-native';
import { colors } from '@/theme/colors';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Modal({ visible, onClose, title, children, style }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Pressable
          onPress={onClose}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: 20,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              {
                backgroundColor: colors.slate[800],
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.slate[700],
                width: '100%',
                maxWidth: 400,
                maxHeight: '80%',
                overflow: 'hidden',
              },
              style,
            ]}
          >
            {/* Header */}
            {title && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.slate[700],
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontFamily: 'DMSans_700Bold',
                    color: colors.white,
                  }}
                >
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  hitSlop={8}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: colors.slate[700],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={18} color={colors.slate[400]} />
                </Pressable>
              </View>
            )}

            {/* Content */}
            <View style={{ padding: 16 }}>{children}</View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
