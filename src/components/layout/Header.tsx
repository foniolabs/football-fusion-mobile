import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Wallet, Lightning } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { colors } from '@/theme/colors';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
  hideSignIn?: boolean;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function Header({ title, showBack = false, rightElement, style, hideSignIn = false }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const wallet = useSolanaWallet();

  const walletButton = !hideSignIn ? (
    wallet.connected && wallet.address ? (
      <Pressable
        onPress={() => router.push('/(tabs)/profile/wallet')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: 'rgba(16,185,129,0.15)',
          borderWidth: 1,
          borderColor: 'rgba(16,185,129,0.3)',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
        }}
      >
        <Lightning size={12} weight="fill" color={colors.success} />
        <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.success }}>
          {shortenAddress(wallet.address)}
        </Text>
      </Pressable>
    ) : (
      <Pressable
        onPress={wallet.connect}
        disabled={wallet.connecting}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: colors.primary.DEFAULT,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 8,
          opacity: wallet.connecting ? 0.7 : 1,
        }}
      >
        {wallet.connecting ? (
          <ActivityIndicator size={12} color={colors.white} />
        ) : (
          <Wallet size={14} weight="fill" color={colors.white} />
        )}
        <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.white }}>
          {wallet.connecting ? 'Connecting...' : 'Sign In'}
        </Text>
      </Pressable>
    )
  ) : null;

  return (
    <View
      style={[
        {
          paddingTop: insets.top + 4,
          paddingBottom: 10,
          paddingHorizontal: 16,
          backgroundColor: colors.slate[900],
          borderBottomWidth: 1,
          borderBottomColor: colors.slate[800],
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        style,
      ]}
    >
      {showBack && (
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.slate[800],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color={colors.slate[300]} />
        </Pressable>
      )}

      {/* Logo + Title */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 8 }}>
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}
          resizeMode="contain"
        />
        <Text
          style={{
            fontSize: 16,
            fontFamily: 'DMSans_700Bold',
            color: colors.white,
            flexShrink: 1,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>

      {rightElement || walletButton}
    </View>
  );
}
