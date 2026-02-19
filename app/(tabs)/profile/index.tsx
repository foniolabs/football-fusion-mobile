import React from 'react';
import { View, Text, ScrollView, Pressable, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User, Trophy, ChartLineUp, Wallet, Gear, SignOut,
  Medal, Users, Star, SquaresFour, Flag, Calendar,
  Binoculars, Copy, CurrencyDollar, Lightning,
} from 'phosphor-react-native';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useProfile, useUserStats } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/Skeleton';
import { colors } from '@/theme/colors';
import { useToast } from '@/contexts/ToastContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const wallet = useSolanaWallet();
  const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
  const { data: stats, isLoading: statsLoading } = useUserStats(user?.id);
  const { showToast } = useToast();

  const handleDisconnect = () => {
    Alert.alert('Disconnect Wallet', 'Are you sure you want to disconnect your wallet?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleCopyAddress = () => {
    if (wallet.address) {
      Clipboard.setString(wallet.address);
      showToast({ type: 'success', title: 'Copied', message: 'Wallet address copied to clipboard' });
    }
  };

  const statItems = [
    { label: 'Total Points', value: stats?.totalPoints ?? 0, icon: <Star size={20} color={colors.primary.DEFAULT} />, color: 'rgba(37,150,190,0.15)' },
    { label: 'Rank', value: stats?.overallRank ? `#${stats.overallRank}` : '--', icon: <ChartLineUp size={20} color={colors.success} />, color: 'rgba(16,185,129,0.15)' },
    { label: 'Tournaments', value: stats?.tournamentsEntered ?? 0, icon: <Trophy size={20} color={colors.warning} />, color: 'rgba(245,158,11,0.15)' },
    { label: 'Wins', value: stats?.tournamentsWon ?? 0, icon: <Medal size={20} color={colors.secondary.DEFAULT} />, color: 'rgba(168,85,247,0.15)' },
  ];

  // Menu items matching web sidebar: Overview, My Team, Points, Transfers, League, Fixtures, The Scout, Wallet
  const menuItems = [
    { label: 'Overview', icon: <SquaresFour size={20} color={colors.primary.DEFAULT} />, onPress: () => router.push('/(tabs)/') },
    { label: 'My Team', icon: <Users size={20} color={colors.primary.DEFAULT} />, onPress: () => router.push('/(tabs)/team') },
    { label: 'Points', icon: <Star size={20} color={colors.success} />, onPress: () => router.push('/(tabs)/leaderboard') },
    { label: 'Transfers', icon: <Flag size={20} color={colors.warning} />, onPress: () => router.push('/(tabs)/team/builder') },
    { label: 'League', icon: <Trophy size={20} color={colors.accent.DEFAULT} />, onPress: () => router.push('/(tabs)/leaderboard') },
    { label: 'Fixtures', icon: <Calendar size={20} color='#38BDF8' />, onPress: () => router.push('/(tabs)/tournaments') },
    { label: 'The Scout', icon: <Binoculars size={20} color='#A855F7' />, onPress: () => router.push('/(tabs)/team/builder') },
    { label: 'Wallet', icon: <Wallet size={20} color={wallet.connected ? colors.success : colors.slate[400]} />, onPress: () => router.push('/(tabs)/profile/wallet') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[900] }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}>
          <Text style={{ fontSize: 26, fontFamily: 'Teko_700Bold', color: colors.white, textTransform: 'uppercase', letterSpacing: 1 }}>
            Profile
          </Text>
        </View>

        {/* Profile Card with Wallet Info */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Card style={{ padding: 20, alignItems: 'center' }}>
            {/* Avatar */}
            <View style={{
              width: 72, height: 72, borderRadius: 24,
              backgroundColor: wallet.connected ? 'rgba(37,150,190,0.2)' : colors.primary.DEFAULT,
              borderWidth: wallet.connected ? 2 : 0,
              borderColor: 'rgba(37,150,190,0.3)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              {wallet.connected ? (
                <Wallet size={36} weight="fill" color={colors.primary.DEFAULT} />
              ) : (
                <User size={36} weight="fill" color={colors.white} />
              )}
            </View>

            {profileLoading ? (
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Skeleton height={20} width={120} />
                <Skeleton height={14} width={180} />
              </View>
            ) : (
              <>
                <Text style={{ fontSize: 20, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                  {profile?.username ?? 'Anonymous'}
                </Text>
                {wallet.connected && wallet.address ? (
                  <Pressable onPress={handleCopyAddress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'DMSans_500Medium', color: colors.slate[400] }}>
                      {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                    </Text>
                    <Copy size={12} color={colors.slate[500]} />
                  </Pressable>
                ) : (
                  <Text style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: colors.slate[400], marginTop: 2 }}>
                    Not connected
                  </Text>
                )}
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[600], marginTop: 4 }}>
                  Solana Testnet
                </Text>
              </>
            )}

            {/* USDC Balance Summary */}
            {wallet.connected && (
              <View style={{
                marginTop: 16, width: '100%', padding: 14, borderRadius: 14,
                backgroundColor: colors.slate[800], flexDirection: 'row',
                alignItems: 'center', justifyContent: 'space-between',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: 'rgba(37,150,190,0.15)', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CurrencyDollar size={18} color={colors.primary.DEFAULT} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>USDC Balance</Text>
                    <Text style={{ fontSize: 18, fontFamily: 'Teko_700Bold', color: colors.white }}>
                      {wallet.usdcBalance !== null ? wallet.usdcBalance.toFixed(2) : '0.00'} USDC
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[600] }}>
                  {wallet.solBalance !== null ? wallet.solBalance.toFixed(4) : '0'} SOL
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* Stats Grid */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Teko_600SemiBold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Stats
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {statItems.map((item, i) => (
              <Card key={i} style={{ flex: 1, minWidth: '45%', padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: item.color, alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.icon}
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>{item.label}</Text>
                </View>
                {statsLoading ? (
                  <Skeleton height={24} width={60} />
                ) : (
                  <Text style={{ fontSize: 22, fontFamily: 'Teko_700Bold', color: colors.white }}>{item.value}</Text>
                )}
              </Card>
            ))}
          </View>
        </View>

        {/* Earnings */}
        {wallet.connected && (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Card style={{ padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lightning size={20} weight="fill" color={colors.success} />
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Total Earnings</Text>
                  <Text style={{ fontSize: 20, fontFamily: 'Teko_700Bold', color: colors.success }}>
                    ${statsLoading ? '...' : ((stats?.totalEarnings ?? 0) / 1e6).toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Trophy size={14} color={colors.warning} weight="fill" />
                <Text style={{ fontSize: 13, fontFamily: 'DMSans_500Medium', color: colors.slate[400] }}>
                  {statsLoading ? '...' : stats?.tournamentsWon ?? 0} wins
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* Navigation Menu (matches web sidebar) */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontFamily: 'Teko_600SemiBold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Quick Access
          </Text>
          <View style={{ gap: 6 }}>
            {menuItems.map((item, i) => (
              <Pressable
                key={i}
                onPress={item.onPress}
                style={({ pressed }) => ({
                  padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
                  borderRadius: 14, backgroundColor: pressed ? colors.slate[700] : colors.slate[800],
                  borderWidth: 1, borderColor: colors.slate[700],
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </View>
                <Text style={{ flex: 1, fontSize: 15, fontFamily: 'DMSans_500Medium', color: colors.white }}>{item.label}</Text>
                <Text style={{ fontSize: 18, color: colors.slate[600] }}>›</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Settings & Disconnect */}
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Pressable
            style={({ pressed }) => ({
              padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
              borderRadius: 14, backgroundColor: pressed ? colors.slate[700] : colors.slate[800],
              borderWidth: 1, borderColor: colors.slate[700],
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
              <Gear size={20} color={colors.slate[400]} />
            </View>
            <Text style={{ flex: 1, fontSize: 15, fontFamily: 'DMSans_500Medium', color: colors.slate[400] }}>Settings</Text>
            <Text style={{ fontSize: 18, color: colors.slate[600] }}>›</Text>
          </Pressable>

          <Button
            variant="danger"
            size="lg"
            fullWidth
            icon={<SignOut size={18} color={colors.white} />}
            onPress={handleDisconnect}
          >
            Disconnect Wallet
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
