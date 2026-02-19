import React from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Clipboard, RefreshControl, Linking } from 'react-native';
import {
  Wallet, ArrowUp, ArrowDown, CurrencyDollar, Trophy, ChartLineUp,
  Copy, SignOut, Lightning, ArrowSquareOut, Bank, CreditCard,
} from 'phosphor-react-native';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { fetchUserStats } from '@/lib/api/users';
import { colors } from '@/theme/colors';
import { useToast } from '@/contexts/ToastContext';
import { useTransak } from '@/components/TransakWebView';

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletScreen() {
  const { user } = useAuth();
  const wallet = useSolanaWallet();
  const { showToast } = useToast();
  const { openTransak } = useTransak();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => fetchUserStats(user!.id),
    enabled: !!user?.id,
  });

  const handleCopyAddress = () => {
    if (wallet.address) {
      Clipboard.setString(wallet.address);
      showToast({ type: 'success', title: 'Copied', message: 'Wallet address copied to clipboard' });
    }
  };

  const handleViewOnExplorer = () => {
    if (wallet.address) {
      Linking.openURL(`https://explorer.solana.com/address/${wallet.address}?cluster=devnet`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.slate[900] }}>
      <Header title="Wallet" showBack />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={wallet.balanceLoading}
            onRefresh={wallet.refreshBalance}
            tintColor={colors.primary.DEFAULT}
            colors={[colors.primary.DEFAULT]}
          />
        }
      >
        {/* Wallet Connection Card */}
        {!wallet.connected ? (
          <Card variant="bordered" style={{ padding: 24, alignItems: 'center' }}>
            <View style={{
              width: 64, height: 64, borderRadius: 20,
              backgroundColor: 'rgba(37,150,190,0.15)', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Wallet size={32} color={colors.primary.DEFAULT} />
            </View>
            <Text style={{ fontSize: 18, fontFamily: 'Teko_700Bold', color: colors.white, marginBottom: 4 }}>
              Connect Your Wallet
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: colors.slate[400], textAlign: 'center', marginBottom: 20, paddingHorizontal: 16 }}>
              Connect a Solana wallet like Phantom or Solflare to manage your funds and join tournaments
            </Text>
            <Pressable
              onPress={wallet.connect}
              disabled={wallet.connecting}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: colors.primary.DEFAULT, paddingHorizontal: 32, paddingVertical: 14,
                borderRadius: 14, opacity: wallet.connecting ? 0.6 : 1,
              }}
            >
              {wallet.connecting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Lightning size={18} weight="bold" color={colors.white} />
              )}
              <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
              </Text>
            </Pressable>
          </Card>
        ) : (
          <>
            {/* Connected Wallet Info */}
            <Card variant="bordered" style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Lightning size={20} weight="fill" color={colors.success} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Connected</Text>
                    <Pressable onPress={handleCopyAddress} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: colors.white }}>
                        {shortenAddress(wallet.address!)}
                      </Text>
                      <Copy size={12} color={colors.slate[400]} />
                    </Pressable>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={handleViewOnExplorer}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: 'rgba(37,150,190,0.1)', borderWidth: 1, borderColor: 'rgba(37,150,190,0.2)',
                    }}
                  >
                    <ArrowSquareOut size={16} color={colors.primary.DEFAULT} />
                  </Pressable>
                  <Pressable
                    onPress={wallet.disconnect}
                    style={{
                      paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
                      backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
                    }}
                  >
                    <SignOut size={16} color="#EF4444" />
                  </Pressable>
                </View>
              </View>

              {/* USDC Balance */}
              <View style={{
                padding: 16, borderRadius: 14,
                backgroundColor: colors.slate[800], alignItems: 'center',
              }}>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500], marginBottom: 4 }}>
                  USDC Balance
                </Text>
                {wallet.balanceLoading ? (
                  <ActivityIndicator size="small" color={colors.primary.DEFAULT} />
                ) : (
                  <Text style={{ fontSize: 32, fontFamily: 'Teko_700Bold', color: colors.white }}>
                    {wallet.usdcBalance !== null ? wallet.usdcBalance.toFixed(2) : '0.00'} USDC
                  </Text>
                )}
                {/* SOL for gas fees */}
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[600], marginTop: 4 }}>
                  Gas: {wallet.solBalance !== null ? wallet.solBalance.toFixed(4) : '0'} SOL
                </Text>
              </View>
            </Card>

            {/* On-Ramp / Off-Ramp Actions */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => wallet.address && openTransak({ walletAddress: wallet.address, mode: 'BUY' })}
                style={{
                  flex: 1, padding: 16, alignItems: 'center', borderRadius: 16,
                  backgroundColor: 'rgba(16,185,129,0.08)',
                  borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
                }}
              >
                <View style={{
                  width: 48, height: 48, borderRadius: 16,
                  backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <CreditCard size={24} weight="duotone" color={colors.success} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.success, marginBottom: 2 }}>
                  Buy USDC
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500], textAlign: 'center' }}>
                  Card or bank transfer
                </Text>
              </Pressable>
              <Pressable
                onPress={() => wallet.address && openTransak({ walletAddress: wallet.address, mode: 'SELL' })}
                style={{
                  flex: 1, padding: 16, alignItems: 'center', borderRadius: 16,
                  backgroundColor: 'rgba(37,150,190,0.08)',
                  borderWidth: 1, borderColor: 'rgba(37,150,190,0.2)',
                }}
              >
                <View style={{
                  width: 48, height: 48, borderRadius: 16,
                  backgroundColor: 'rgba(37,150,190,0.15)', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Bank size={24} weight="duotone" color={colors.primary.DEFAULT} />
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.primary.DEFAULT, marginBottom: 2 }}>
                  Withdraw
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500], textAlign: 'center' }}>
                  To bank account
                </Text>
              </Pressable>
            </View>

            {/* Send / Receive secondary actions */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Card style={{ flex: 1, padding: 14, alignItems: 'center' }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: 'rgba(37,150,190,0.15)', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 6,
                }}>
                  <ArrowUp size={20} color={colors.primary.DEFAULT} />
                </View>
                <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.slate[400] }}>Send</Text>
              </Card>
              <Card style={{ flex: 1, padding: 14, alignItems: 'center' }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 6,
                }}>
                  <ArrowDown size={20} color={colors.success} />
                </View>
                <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.slate[400] }}>Receive</Text>
              </Card>
            </View>
          </>
        )}

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Card style={{ flex: 1, padding: 16, alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: 'rgba(37,150,190,0.15)', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <ChartLineUp size={22} color={colors.primary.DEFAULT} />
            </View>
            <Text style={{ fontSize: 20, fontFamily: 'Teko_700Bold', color: colors.white }}>
              {isLoading ? '...' : stats?.totalPoints ?? 0}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>Total Points</Text>
          </Card>
          <Card style={{ flex: 1, padding: 16, alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: 'rgba(16,185,129,0.15)', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Trophy size={22} color={colors.success} />
            </View>
            <Text style={{ fontSize: 20, fontFamily: 'Teko_700Bold', color: colors.white }}>
              {isLoading ? '...' : stats?.tournamentsEntered ?? 0}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>Tournaments</Text>
          </Card>
          <Card style={{ flex: 1, padding: 16, alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 14,
              backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center',
              marginBottom: 8,
            }}>
              <Trophy size={22} weight="fill" color={colors.warning} />
            </View>
            <Text style={{ fontSize: 20, fontFamily: 'Teko_700Bold', color: colors.white }}>
              {isLoading ? '...' : stats?.tournamentsWon ?? 0}
            </Text>
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>Wins</Text>
          </Card>
        </View>

        {/* Transaction History */}
        <View>
          <Text style={{ fontSize: 18, fontFamily: 'Teko_600SemiBold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Transaction History
          </Text>
          <Card style={{ padding: 32, alignItems: 'center' }}>
            <Wallet size={40} color={colors.slate[600]} />
            <Text style={{ fontSize: 14, fontFamily: 'DMSans_500Medium', color: colors.slate[400], marginTop: 12, textAlign: 'center' }}>
              No transactions yet
            </Text>
            <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[500], marginTop: 4, textAlign: 'center' }}>
              Your tournament entries and winnings will appear here
            </Text>
          </Card>
        </View>
      </ScrollView>


    </View>
  );
}
