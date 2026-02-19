import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Image, ImageBackground, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trophy, Users, Calendar, CurrencyDollar, Medal, ArrowLeft, Lightning, Wallet, ArrowSquareOut } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTournament, useTournamentParticipants, useJoinTournament } from '@/hooks/useTournaments';
import { useAuth } from '@/hooks/useAuth';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useFootballFusion } from '@/hooks/useFootballFusion';
import { useTeamStore } from '@/stores/teamStore';
import { getLeagueById } from '@/lib/constants/leagues';
import { colors } from '@/theme/colors';
import { useToast } from '@/contexts/ToastContext';
import { formatUsd } from '@/lib/utils/helpers';
import { format } from 'date-fns';

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const wallet = useSolanaWallet();
  const { joinTournament: joinOnChain } = useFootballFusion();
  const { data: tournament, isLoading } = useTournament(id!);
  const { data: participants } = useTournamentParticipants(id!);
  const joinMutation = useJoinTournament();
  const teamStore = useTeamStore();
  const [joining, setJoining] = useState(false);
  const { showToast } = useToast();

  const alreadyJoined = participants?.some((p: any) => p.user_id === user?.id);

  const handleJoin = async () => {
    if (!wallet.connected || !user) {
      Alert.alert('Wallet Required', 'Please connect your wallet to join tournaments.', [
        { text: 'Cancel' },
        { text: 'Connect Wallet', onPress: () => wallet.connect() },
      ]);
      return;
    }
    if (!teamStore.teamId) {
      Alert.alert('Team Required', 'Please create a team before joining a tournament.', [
        { text: 'Cancel' },
        { text: 'Build Team', onPress: () => router.push('/(tabs)/team/builder') },
      ]);
      return;
    }

    const entryFee = tournament?.entry_fee ?? 0;

    // Check USDC balance
    if (wallet.usdcBalance !== null && wallet.usdcBalance < entryFee) {
      showToast({
        type: 'error',
        title: 'Insufficient USDC',
        message: `You need ${entryFee.toFixed(2)} USDC. Balance: ${wallet.usdcBalance.toFixed(2)} USDC.`,
      });
      return;
    }

    setJoining(true);
    try {
      // Use the on-chain numeric ID if the tournament was created on-chain
      const onChainId = (tournament as any)?.on_chain_id;
      let txSignature: string | null = null;

      if (onChainId && wallet.connected) {
        // Get player IDs from team store
        const allPlayers = [
          teamStore.goalkeeper,
          ...(teamStore.defenders || []),
          ...(teamStore.midfielders || []),
          ...(teamStore.forwards || []),
          ...(teamStore.bench || []),
        ].filter(Boolean);
        const playerIds = allPlayers.map(p => parseInt(p!.id, 10)).filter(n => !isNaN(n));

        txSignature = await joinOnChain({
          tournamentId: onChainId,
          teamName: teamStore.teamName || 'My Team',
          playerIds: playerIds.length === 15 ? playerIds : Array(15).fill(0).map((_, i) => playerIds[i] ?? 0),
        });
      }

      // Record in Supabase
      await joinMutation.mutateAsync({
        tournamentId: id!,
        userId: user.id,
        teamId: teamStore.teamId,
      });

      showToast({
        type: 'success',
        title: 'Joined!',
        message: txSignature
          ? `Tournament joined! TX: ${txSignature.slice(0, 8)}...${txSignature.slice(-8)}`
          : 'Successfully joined the tournament!',
      });
    } catch (err: any) {
      const msg = err?.message || 'Failed to join tournament.';
      if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied')) {
        showToast({ type: 'warning', title: 'Cancelled', message: 'Transaction was cancelled.' });
      } else {
        showToast({ type: 'error', title: 'Error', message: msg });
      }
    } finally {
      setJoining(false);
    }
  };

  const insets = useSafeAreaInsets();

  if (isLoading || !tournament) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.slate[900], alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  const league = getLeagueById(tournament.league_id);
  const progress = tournament.max_participants > 0 ? tournament.current_participants / tournament.max_participants : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.slate[900] }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 220 }}>
        {/* Hero Banner */}
        <ImageBackground
          source={{ uri: league?.banner }}
          style={{ height: 220 }}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.3)', 'rgba(15,23,42,0.95)']}
            style={{ flex: 1, paddingTop: insets.top }}
          >
            {/* Floating header row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 }}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={8}
                style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={18} color={colors.white} />
              </Pressable>
              {wallet.connected && wallet.address ? (
                <Pressable
                  onPress={() => router.push('/(tabs)/profile/wallet')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }}
                >
                  <Lightning size={12} weight="fill" color={colors.success} />
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.success }}>
                    {wallet.address.slice(0, 4)}...{wallet.address.slice(-4)}
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={wallet.connect}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary.DEFAULT, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 }}
                >
                  <Wallet size={14} weight="fill" color={colors.white} />
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.white }}>Sign In</Text>
                </Pressable>
              )}
            </View>

            {/* League logo + title on the banner */}
            <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {league?.logo && (
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={{ uri: league.logo }} style={{ width: 26, height: 26 }} resizeMode="contain" />
                  </View>
                )}
                <Badge variant={tournament.status === 'live' ? 'live' : tournament.status === 'upcoming' ? 'success' : 'default'} pulse={tournament.status === 'live'}>
                  {tournament.status.toUpperCase()}
                </Badge>
              </View>
              <Text style={{ fontSize: 22, fontFamily: 'Teko_700Bold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={2}>
                {tournament.name}
              </Text>
              <Text style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {league?.name}
              </Text>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* Tournament Info */}
        <View style={{ padding: 16 }}>

          {tournament.description && (
            <Text style={{ fontSize: 14, fontFamily: 'DMSans_400Regular', color: colors.slate[300], marginBottom: 16 }}>
              {tournament.description}
            </Text>
          )}

          {/* Stats Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              { label: 'Entry Fee', value: formatUsd(tournament.entry_fee), icon: <CurrencyDollar size={18} color={colors.primary.DEFAULT} /> },
              { label: 'Prize Pool', value: formatUsd(tournament.prize_pool), icon: <Medal size={18} color={colors.success} />, valueColor: colors.success },
              { label: 'Players', value: `${tournament.current_participants}/${tournament.max_participants}`, icon: <Users size={18} color={colors.accent.DEFAULT} /> },
              { label: 'Gameweeks', value: `GW${tournament.gameweek_start}-${tournament.gameweek_end}`, icon: <Calendar size={18} color={colors.warning} /> },
            ].map((stat, i) => (
              <Card key={i} style={{ flex: 1, minWidth: '45%', padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {stat.icon}
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>{stat.label}</Text>
                </View>
                <Text style={{ fontSize: 18, fontFamily: 'DMSans_700Bold', color: stat.valueColor ?? colors.white }}>{stat.value}</Text>
              </Card>
            ))}
          </View>

          {/* Progress */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>Capacity</Text>
              <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.white }}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.slate[700], borderRadius: 3 }}>
              <View style={{ height: 6, backgroundColor: league?.color ?? colors.primary.DEFAULT, borderRadius: 3, width: `${Math.min(progress * 100, 100)}%` }} />
            </View>
          </View>

          {/* Dates */}
          <Card style={{ marginTop: 16, padding: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Start Date</Text>
                <Text style={{ fontSize: 14, fontFamily: 'DMSans_500Medium', color: colors.white }}>
                  {format(new Date(tournament.start_date), 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>End Date</Text>
                <Text style={{ fontSize: 14, fontFamily: 'DMSans_500Medium', color: colors.white }}>
                  {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                </Text>
              </View>
            </View>
          </Card>

          {/* View on Blockchain link */}
          {tournament.contract_address && (
            <Pressable
              onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${tournament.contract_address}?cluster=devnet`)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                marginTop: 16, paddingVertical: 12, paddingHorizontal: 16,
                borderRadius: 12, borderWidth: 1, borderColor: 'rgba(37,150,190,0.3)',
                backgroundColor: 'rgba(37,150,190,0.08)',
              }}
            >
              <ArrowSquareOut size={16} color={colors.primary.DEFAULT} />
              <Text style={{ fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: colors.primary.DEFAULT }}>
                View on Solana Explorer
              </Text>
            </Pressable>
          )}
        </View>

        {/* Participants */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 20, fontFamily: 'Teko_600SemiBold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Participants
          </Text>
          {participants && participants.length > 0 ? (
            <View style={{ gap: 8 }}>
              {participants.map((p: any, i: number) => (
                <Card key={p.id} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 8,
                    backgroundColor: i < 3 ? colors.primary.DEFAULT : colors.slate[700],
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                      {i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'DMSans_500Medium', color: colors.white }}>
                      {p.profiles?.username ?? 'Unknown'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.primary.DEFAULT }}>
                    {p.total_points} pts
                  </Text>
                </Card>
              ))}
            </View>
          ) : (
            <Text style={{ fontSize: 14, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>
              No participants yet
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Join Button — positioned above the tab bar (64px + safe area) */}
      {tournament.status === 'upcoming' && !alreadyJoined && (
        <View style={{
          position: 'absolute', bottom: 72 + (insets.bottom || 8), left: 0, right: 0,
          padding: 16, paddingBottom: 12, backgroundColor: colors.slate[900],
          borderTopWidth: 1, borderTopColor: colors.slate[800],
        }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleJoin}
            disabled={joining || joinMutation.isPending}
          >
            {joining ? 'Processing On-Chain...' : joinMutation.isPending ? 'Saving...' : `Join Tournament - ${tournament.entry_fee.toFixed(2)} USDC`}
          </Button>
          {wallet.connected && wallet.usdcBalance !== null && (
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500], textAlign: 'center', marginTop: 6 }}>
              Balance: {wallet.usdcBalance.toFixed(2)} USDC
            </Text>
          )}
        </View>
      )}
      {alreadyJoined && (
        <View style={{
          position: 'absolute', bottom: 72 + (insets.bottom || 8), left: 0, right: 0,
          padding: 16, paddingBottom: 12, backgroundColor: colors.slate[900],
          borderTopWidth: 1, borderTopColor: colors.slate[800],
        }}>
          <Button variant="secondary" size="lg" fullWidth disabled>
            Already Joined
          </Button>
        </View>
      )}
    </View>
  );
}
