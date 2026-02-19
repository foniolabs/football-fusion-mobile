import React, { useState } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartLineUp, Crown, Medal, MagnifyingGlass, Trophy, Fire, User } from 'phosphor-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Header } from '@/components/layout/Header';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { data: leaderboard, isLoading, refetch } = useLeaderboard();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredData = leaderboard?.filter((entry) =>
    search ? entry.username.toLowerCase().includes(search.toLowerCase()) : true
  );

  const currentUserEntry = leaderboard?.find((e) => e.user_id === user?.id);
  const top3 = filteredData?.slice(0, 3) || [];
  const hasTop3 = top3.length >= 3 && !search;
  const listData = search ? filteredData : filteredData?.slice(3);

  return (
    <View style={{ flex: 1, backgroundColor: colors.slate[900] }}>
      <Header title="Leaderboard" hideSignIn />

      <FlatList
        data={listData}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
        ListHeaderComponent={
          <>
            {/* Subtitle */}
            <Text style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: colors.slate[400], marginTop: 4, marginBottom: 16 }}>
              Top players competing for glory
            </Text>

            {/* Search */}
            <View style={{ marginBottom: 16 }}>
              <Input
                placeholder="Search by username..."
                value={search}
                onChangeText={setSearch}
                icon={<MagnifyingGlass size={18} color={colors.slate[500]} />}
              />
            </View>

            {/* Current User Card */}
            {currentUserEntry && (
              <Card variant="bordered" style={{
                padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
                marginBottom: 16, borderColor: colors.primary.DEFAULT + '40',
                backgroundColor: colors.primary.DEFAULT + '08',
              }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={16} weight="fill" color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                      {currentUserEntry.username}
                    </Text>
                    <Badge variant="default">You</Badge>
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>
                    Rank #{currentUserEntry.overall_rank}
                  </Text>
                </View>
                <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.primary.DEFAULT }}>
                  {currentUserEntry.total_points} pts
                </Text>
              </Card>
            )}

            {/* Top 3 Podium — matches web layout */}
            {hasTop3 && (
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontFamily: 'Teko_600SemiBold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                  Top 3
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>

                  {/* 2nd Place */}
                  <View style={{ flex: 1, marginTop: 24 }}>
                    <Card style={{
                      padding: 14, alignItems: 'center',
                      backgroundColor: colors.slate[800], borderWidth: 1, borderColor: colors.slate[700],
                    }}>
                      <Medal size={20} weight="fill" color="#94A3B8" style={{ marginBottom: 6 }} />
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: colors.slate[700], alignItems: 'center', justifyContent: 'center',
                        marginBottom: 6,
                      }}>
                        <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.slate[300] }}>
                          {top3[1].username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: colors.white, marginBottom: 2 }} numberOfLines={1}>
                        {top3[1].username}
                      </Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Teko_700Bold', color: colors.white }}>
                        {top3[1].total_points}
                      </Text>
                      <Badge variant="default">2nd</Badge>
                    </Card>
                  </View>

                  {/* 1st Place */}
                  <View style={{ flex: 1 }}>
                    <Card style={{
                      padding: 14, alignItems: 'center',
                      backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
                    }}>
                      <Crown size={22} weight="fill" color="#F59E0B" style={{ marginBottom: 6 }} />
                      <View style={{
                        width: 52, height: 52, borderRadius: 26,
                        backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 6,
                        shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8,
                      }}>
                        <Text style={{ fontSize: 22, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                          {top3[0].username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: colors.white, marginBottom: 2 }} numberOfLines={1}>
                        {top3[0].username}
                      </Text>
                      <Text style={{ fontSize: 22, fontFamily: 'Teko_700Bold', color: colors.white }}>
                        {top3[0].total_points}
                      </Text>
                      <Badge variant="warning">Champion</Badge>
                    </Card>
                  </View>

                  {/* 3rd Place */}
                  <View style={{ flex: 1, marginTop: 24 }}>
                    <Card style={{
                      padding: 14, alignItems: 'center',
                      backgroundColor: colors.slate[800], borderWidth: 1, borderColor: colors.slate[700],
                    }}>
                      <Medal size={20} weight="fill" color="#CD7F32" style={{ marginBottom: 6 }} />
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: 'rgba(205,127,50,0.15)', alignItems: 'center', justifyContent: 'center',
                        marginBottom: 6,
                      }}>
                        <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#CD7F32' }}>
                          {top3[2].username.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: colors.white, marginBottom: 2 }} numberOfLines={1}>
                        {top3[2].username}
                      </Text>
                      <Text style={{ fontSize: 18, fontFamily: 'Teko_700Bold', color: colors.white }}>
                        {top3[2].total_points}
                      </Text>
                      <Badge variant="default">3rd</Badge>
                    </Card>
                  </View>
                </View>
              </View>
            )}

            {/* Full Rankings header */}
            {(listData && listData.length > 0) && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ChartLineUp size={18} weight="fill" color={colors.primary.DEFAULT} />
                <Text style={{ fontSize: 18, fontFamily: 'Teko_600SemiBold', color: colors.white, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Full Rankings
                </Text>
              </View>
            )}
          </>
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item, index }) => {
          const rank = search ? index + 1 : index + 4; // offset by top 3
          const isCurrentUser = item.user_id === user?.id;
          const isTop10 = rank <= 10;

          return (
            <Card
              style={{
                padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
                ...(isCurrentUser ? { borderWidth: 1, borderColor: colors.primary.DEFAULT + '50', backgroundColor: colors.primary.DEFAULT + '08' } : {}),
              }}
            >
              {/* Rank */}
              <View style={{ width: 32, alignItems: 'center' }}>
                <Text style={{
                  fontSize: 15, fontFamily: 'DMSans_700Bold',
                  color: isTop10 ? colors.primary.DEFAULT : colors.slate[500],
                }}>
                  #{rank}
                </Text>
              </View>

              {/* Avatar */}
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isCurrentUser ? colors.primary.DEFAULT : colors.slate[700],
                alignItems: 'center', justifyContent: 'center',
              }}>
                {isCurrentUser ? (
                  <User size={16} weight="bold" color={colors.white} />
                ) : (
                  <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.slate[300] }}>
                    {item.username.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.white }} numberOfLines={1}>
                    {item.username}
                  </Text>
                  {isCurrentUser && <Badge variant="default">You</Badge>}
                  {isTop10 && !isCurrentUser && <Fire size={14} weight="fill" color="#F97316" />}
                </View>
                <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>
                  {item.team_name} • GW: {item.gameweek_points}
                </Text>
              </View>

              {/* Points */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                  {item.total_points}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>
                  points
                </Text>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Skeleton width={36} height={36} borderRadius={18} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton height={14} width="50%" />
                    <Skeleton height={12} width="30%" />
                  </View>
                  <Skeleton width={40} height={16} />
                </Card>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Trophy size={48} color={colors.slate[600]} />
              <Text style={{ fontSize: 16, fontFamily: 'DMSans_500Medium', color: colors.slate[400], marginTop: 16 }}>
                No rankings available yet
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}
