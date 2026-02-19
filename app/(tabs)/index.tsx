import React from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Image, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy, Lightning, ArrowRight, Plus, ChartLineUp, Fire, Users, TrendUp, Clock } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Header } from '@/components/layout/Header';
import { useTournaments } from '@/hooks/useTournaments';
import { useFPLData } from '@/hooks/useFPLData';
import { useAuth } from '@/hooks/useAuth';
import { getLeagueById } from '@/lib/constants/leagues';
import { colors } from '@/theme/colors';
import { formatUsd } from '@/lib/utils/helpers';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: tournaments, isLoading, refetch } = useTournaments({ limit: 4 });
  const { data: fplData, isLoading: fplLoading, refetch: refetchFpl } = useFPLData();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchFpl()]);
    setRefreshing(false);
  };

  const gameweek = fplData?.gameweek;
  const starPlayer = fplData?.starPlayer;
  const transfers = fplData?.mostTransferredIn ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.slate[900] }}>
      <Header title="Football Fusion" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
      >
        {/* Gameweek Header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 20, fontFamily: 'Teko_700Bold', color: colors.white, textTransform: 'uppercase', letterSpacing: 1 }}>
              {gameweek ? `Gameweek ${gameweek.gameweek}` : fplLoading ? 'Loading...' : 'Gameweek --'}
            </Text>
            {gameweek && (
              <Badge variant={gameweek.isFinished ? 'default' : 'live'} pulse={!gameweek.isFinished}>
                {gameweek.isFinished ? 'FINISHED' : 'LIVE'}
              </Badge>
            )}
          </View>
          <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400], marginTop: 2 }}>
            {gameweek?.dateRange ?? 'Loading schedule...'}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 8, marginBottom: 16 }}>
          {[
            { label: 'Your Points', value: '0', icon: <ChartLineUp size={14} color={colors.primary.DEFAULT} />, bg: 'rgba(37,150,190,0.12)' },
            { label: 'Avg. Points', value: gameweek ? gameweek.avgPoints.toString() : '--', icon: <Lightning size={14} color={colors.warning} />, bg: colors.slate[800] },
            { label: 'Highest', value: gameweek ? gameweek.highestPoints.toString() : '--', icon: <TrendUp size={14} color={colors.success} />, bg: colors.slate[800] },
          ].map((stat, i) => (
            <View
              key={i}
              style={{
                flex: 1, backgroundColor: stat.bg, borderRadius: 12,
                paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center',
              }}
            >
              {stat.icon}
              <Text style={{ fontSize: 20, fontFamily: 'Teko_700Bold', color: colors.white, marginTop: 2 }}>{stat.value}</Text>
              <Text style={{ fontSize: 9, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Trending Player Card */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Fire size={18} weight="fill" color="#F97316" />
              <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Top Player</Text>
            </View>
          </View>

          {fplLoading ? (
            <Card style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <Skeleton height={72} width={72} style={{ borderRadius: 12 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton height={16} width="60%" />
                  <Skeleton height={12} width="40%" />
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                    <Skeleton height={24} width={40} />
                    <Skeleton height={24} width={40} />
                    <Skeleton height={24} width={40} />
                  </View>
                </View>
              </View>
            </Card>
          ) : starPlayer ? (
            <Card style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{
                  width: 72, height: 72, borderRadius: 12,
                  backgroundColor: '#EF444430', overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Image
                    source={{ uri: starPlayer.photo }}
                    style={{ width: 72, height: 72 }}
                    resizeMode="cover"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white, marginBottom: 2 }}>{starPlayer.name}</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400], marginBottom: 8 }}>
                    {starPlayer.position} · {starPlayer.team}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Points</Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Teko_700Bold', color: colors.primary.DEFAULT }}>{starPlayer.points}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Position</Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Teko_700Bold', color: colors.white }}>{starPlayer.positionShort}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Team</Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Teko_700Bold', color: colors.white }}>{starPlayer.teamShort}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          ) : null}
        </View>

        {/* Top Transfers In */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <TrendUp size={16} weight="fill" color={colors.primary.DEFAULT} />
            <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Top Transfers In</Text>
          </View>

          {fplLoading ? (
            <Card style={{ padding: 12 }}>
              {[1, 2, 3].map(i => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                  <Skeleton height={32} width={32} style={{ borderRadius: 16 }} />
                  <Skeleton height={14} width="40%" />
                </View>
              ))}
            </Card>
          ) : transfers.length > 0 ? (
            <Card style={{ padding: 12 }}>
              {transfers.map((player, idx) => (
                <View key={player.id} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
                  borderBottomWidth: idx < transfers.length - 1 ? 1 : 0,
                  borderBottomColor: colors.slate[800],
                }}>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.slate[500], width: 18 }}>{idx + 1}.</Text>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: '#10B98130', overflow: 'hidden',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Image
                      source={{ uri: player.photo }}
                      style={{ width: 32, height: 32 }}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: colors.white }}>{player.name}</Text>
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>{player.team}</Text>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.primary.DEFAULT }}>
                    {player.transfers >= 1000 ? `${(player.transfers / 1000).toFixed(0)}k` : player.transfers}
                  </Text>
                </View>
              ))}
            </Card>
          ) : null}
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/(tabs)/tournaments/create')}
              style={{
                flex: 1, backgroundColor: colors.primary.DEFAULT, borderRadius: 12,
                paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Plus size={18} weight="bold" color={colors.white} />
              <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.white }}>Create</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/team/builder')}
              style={{
                flex: 1, backgroundColor: colors.slate[800], borderRadius: 12, borderWidth: 1,
                borderColor: colors.slate[700], paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Users size={18} weight="bold" color={colors.primary.DEFAULT} />
              <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.white }}>Build Team</Text>
            </Pressable>
          </View>
        </View>

        {/* Tournaments */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Trophy size={18} weight="duotone" color={colors.primary.DEFAULT} />
              <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Tournaments</Text>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/tournaments')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.primary.DEFAULT }}>View All</Text>
              <ArrowRight size={12} color={colors.primary.DEFAULT} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={{ gap: 12 }}>
              {[1, 2].map((i) => (
                <View key={i} style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: colors.slate[800] }}>
                  <Skeleton height={110} width="100%" />
                  <View style={{ padding: 14, gap: 10 }}>
                    <Skeleton height={14} width="50%" />
                    <Skeleton height={12} width="30%" />
                  </View>
                </View>
              ))}
            </View>
          ) : tournaments && tournaments.length > 0 ? (
            <View style={{ gap: 12 }}>
              {tournaments.map((t) => {
                const league = getLeagueById(t.league_id);
                const slotsLeft = t.max_participants - t.current_participants;
                return (
                  <Pressable key={t.id} onPress={() => router.push(`/(tabs)/tournaments/${t.id}`)} style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: colors.slate[800] }}>
                    <ImageBackground
                      source={{ uri: league?.banner }}
                      style={{ height: 110, justifyContent: 'flex-end' }}
                      resizeMode="cover"
                    >
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 }}
                      />
                      <View style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Badge variant={t.status === 'live' ? 'live' : t.status === 'upcoming' ? 'success' : 'default'} pulse={t.status === 'live'}>
                          {t.status.toUpperCase()}
                        </Badge>
                      </View>
                      {league?.logo && (
                        <View style={{ position: 'absolute', top: 8, left: 8, width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                          <Image source={{ uri: league.logo }} style={{ width: 22, height: 22 }} resizeMode="contain" />
                        </View>
                      )}
                      <View style={{ padding: 10, paddingTop: 0 }}>
                        <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }} numberOfLines={1}>{t.name}</Text>
                        <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>{league?.name}</Text>
                      </View>
                    </ImageBackground>
                    <View style={{ padding: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Users size={13} color={colors.slate[400]} />
                          <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.slate[300] }}>
                            {slotsLeft > 0 ? `${slotsLeft} slots left` : 'Full'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Clock size={13} color={colors.slate[400]} />
                          <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: colors.slate[300] }}>
                            GW {t.gameweek_start}-{t.gameweek_end}
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                        <View>
                          <Text style={{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Prize Pool</Text>
                          <Text style={{ fontSize: 20, fontFamily: 'Teko_700Bold', color: colors.success }}>{formatUsd(t.prize_pool)}</Text>
                        </View>
                        <View style={{ backgroundColor: league?.color ?? colors.primary.DEFAULT, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                          <Text style={{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                            {t.entry_fee > 0 ? formatUsd(t.entry_fee) : 'Free'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Card style={{ padding: 24, alignItems: 'center' }}>
              <Trophy size={36} color={colors.slate[600]} />
              <Text style={{ fontSize: 13, fontFamily: 'DMSans_500Medium', color: colors.slate[400], marginTop: 10 }}>No tournaments yet</Text>
              <Button variant="primary" size="sm" onPress={() => router.push('/(tabs)/tournaments/create')} style={{ marginTop: 14 }}>
                Create Tournament
              </Button>
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
