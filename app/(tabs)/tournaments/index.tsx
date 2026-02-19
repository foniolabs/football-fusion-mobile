import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Image, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Trophy, Plus, MagnifyingGlass, Users, Clock } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs } from '@/components/ui/Tabs';
import { useTournaments } from '@/hooks/useTournaments';
import { MAJOR_LEAGUES, getLeagueById } from '@/lib/constants/leagues';
import { colors } from '@/theme/colors';
import { formatUsd } from '@/lib/utils/helpers';
import type { Database } from '@/types/database';

type Tournament = Database['public']['Tables']['tournaments']['Row'];

const leagueTabs = [
  { key: 'all', label: 'All' },
  ...MAJOR_LEAGUES.map((l) => ({ key: String(l.id), label: l.shortName })),
];

function TournamentCard({ tournament, onPress }: { tournament: Tournament; onPress: () => void }) {
  const league = getLeagueById(tournament.league_id);
  const slotsLeft = tournament.max_participants - tournament.current_participants;

  return (
    <Pressable onPress={onPress} style={{ marginHorizontal: 16, marginBottom: 14, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.slate[800] }}>
      {/* Banner Image */}
      <ImageBackground
        source={{ uri: league?.banner }}
        style={{ height: 140, justifyContent: 'flex-end' }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 90 }}
        />
        {/* Status badge */}
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <Badge variant={tournament.status === 'live' ? 'live' : tournament.status === 'upcoming' ? 'success' : 'default'} pulse={tournament.status === 'live'}>
            {tournament.status.toUpperCase()}
          </Badge>
        </View>
        {/* League logo */}
        {league?.logo && (
          <View style={{ position: 'absolute', top: 10, left: 10, width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
            <Image source={{ uri: league.logo }} style={{ width: 26, height: 26 }} resizeMode="contain" />
          </View>
        )}
        {/* Title on image */}
        <View style={{ padding: 12, paddingTop: 0 }}>
          <Text style={{ fontSize: 17, fontFamily: 'DMSans_700Bold', color: colors.white }} numberOfLines={1}>{tournament.name}</Text>
          <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
            {league?.name}
          </Text>
        </View>
      </ImageBackground>

      {/* Info Section */}
      <View style={{ padding: 14 }}>
        {/* Meta row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Users size={14} color={colors.slate[400]} />
            <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.slate[300] }}>
              {slotsLeft > 0 ? `${slotsLeft} slots left` : 'Full'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={14} color={colors.slate[400]} />
            <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.slate[300] }}>
              GW {tournament.gameweek_start}-{tournament.gameweek_end}
            </Text>
          </View>
        </View>

        {/* Prize & Entry */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
          <View>
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Prize Pool</Text>
            <Text style={{ fontSize: 22, fontFamily: 'Teko_700Bold', color: colors.success }}>{formatUsd(tournament.prize_pool)}</Text>
          </View>
          <View style={{ backgroundColor: league?.color ?? colors.primary.DEFAULT, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}>
            <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: colors.white }}>
              {tournament.entry_fee > 0 ? formatUsd(tournament.entry_fee) : 'Free'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function TournamentsScreen() {
  const router = useRouter();
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [search, setSearch] = useState('');

  const filters = selectedLeague !== 'all' ? { league_id: Number(selectedLeague) } : undefined;
  const { data: tournaments, isLoading, refetch } = useTournaments(filters);
  const [refreshing, setRefreshing] = useState(false);

  const filteredTournaments = tournaments?.filter((t) =>
    search ? t.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[900] }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Trophy size={24} weight="fill" color={colors.primary.DEFAULT} />
          <Text style={{ fontSize: 26, fontFamily: 'Teko_700Bold', color: colors.white, textTransform: 'uppercase', letterSpacing: 1 }}>
            Tournaments
          </Text>
        </View>
        <Button variant="primary" size="sm" icon={<Plus size={16} weight="bold" color={colors.white} />} onPress={() => router.push('/(tabs)/tournaments/create')}>
          Create
        </Button>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Input
          placeholder="Search tournaments..."
          value={search}
          onChangeText={setSearch}
          icon={<MagnifyingGlass size={18} color={colors.slate[500]} />}
        />
      </View>

      {/* League Filter Tabs */}
      <Tabs
        tabs={leagueTabs}
        activeTab={selectedLeague}
        onTabChange={setSelectedLeague}
        style={{ marginBottom: 12, paddingHorizontal: 12 }}
      />

      {/* Tournament List */}
      <FlatList
        data={filteredTournaments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TournamentCard
            tournament={item}
            onPress={() => router.push(`/(tabs)/tournaments/${item.id}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 140, paddingTop: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary.DEFAULT} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ padding: 16, gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.slate[800] }}>
                  <Skeleton height={140} width="100%" />
                  <View style={{ padding: 14, gap: 10 }}>
                    <Skeleton height={14} width="50%" />
                    <Skeleton height={12} width="30%" />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Trophy size={48} color={colors.slate[600]} />
              <Text style={{ fontSize: 16, fontFamily: 'DMSans_500Medium', color: colors.slate[400], marginTop: 16 }}>
                No tournaments found
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
