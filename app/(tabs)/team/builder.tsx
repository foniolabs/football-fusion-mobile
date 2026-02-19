import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MagnifyingGlass,
  X,
  User,
  Lightning,
  FloppyDisk,
  Trash,
} from 'phosphor-react-native';
import { Header } from '@/components/layout/Header';
import { useTeamStore, type Player, type Position } from '@/stores/teamStore';
import { useFPLPlayers, type FPLPlayerData } from '@/hooks/useFPLPlayers';
import { useAuth } from '@/hooks/useAuth';
import { saveTeam } from '@/lib/api/teams';
import { colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/contexts/ToastContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const POSITIONS = ['all', 'GK', 'DEF', 'MID', 'FWD'] as const;

/* ─── position colors ─── */
const POS_COLORS: Record<string, string> = {
  GK: '#F59E0B', DEF: '#3B82F6', MID: '#10B981', FWD: '#EF4444',
};

/* ─── Pitch slot types ─── */
type SlotKey = string;

const SLOT_CONFIG = {
  GK: ['gk1', 'gk2'],
  DEF: ['def1', 'def2', 'def3', 'def4', 'def5'],
  MID: ['mid1', 'mid2', 'mid3', 'mid4', 'mid5'],
  FWD: ['fwd1', 'fwd2', 'fwd3'],
};

const ALL_SLOTS: SlotKey[] = [...SLOT_CONFIG.GK, ...SLOT_CONFIG.DEF, ...SLOT_CONFIG.MID, ...SLOT_CONFIG.FWD];

/** Convert FPL player data to store Player format */
function toStorePlayer(p: FPLPlayerData): Player {
  return {
    id: p.id,
    name: p.webName,
    team: p.teamShort,
    teamColor: p.teamColor,
    position: p.position,
    price: p.price,
    points: p.points,
    photo: p.photo,
    form: p.form,
    goals: p.goals,
    assists: p.assists,
  };
}

export default function TeamBuilderScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const store = useTeamStore();
  const { data: fplPlayers, isLoading: playersLoading } = useFPLPlayers();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [selectedPlayers, setSelectedPlayers] = useState<Record<SlotKey, Player | null>>(() => {
    const initial: Record<string, Player | null> = {};
    ALL_SLOTS.forEach(s => { initial[s] = null; });
    return initial;
  });
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Convert FPL data to Player format
  const allPlayers: Player[] = useMemo(() => {
    if (!fplPlayers) return [];
    return fplPlayers.map(toStorePlayer);
  }, [fplPlayers]);

  // Calculate stats
  const selectedList = useMemo(() =>
    Object.values(selectedPlayers).filter(Boolean) as Player[], [selectedPlayers]);
  const selectedIds = useMemo(() => new Set(selectedList.map(p => p.id)), [selectedList]);
  const selectedCount = selectedList.length;
  const spentBudget = selectedList.reduce((sum, p) => sum + p.price, 0);
  const remainingBudget = 100 - spentBudget;
  const isTeamComplete = selectedCount === 15;

  // Filter available players
  const filtered = useMemo(() => {
    let list = allPlayers.filter(p => !selectedIds.has(p.id));
    if (posFilter !== 'all') list = list.filter(p => p.position === posFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
    }
    return list.sort((a, b) => b.points - a.points);
  }, [search, posFilter, selectedIds, allPlayers]);

  // Add player to pitch
  const handleSelectPlayer = useCallback((player: Player) => {
    const posSlots = SLOT_CONFIG[player.position as keyof typeof SLOT_CONFIG] || [];
    const emptySlot = posSlots.find(slot => !selectedPlayers[slot]);

    if (!emptySlot) {
      showToast({ type: 'warning', title: 'Full', message: `All ${player.position} slots are filled` });
      return;
    }
    if (player.price > remainingBudget) {
      showToast({ type: 'warning', title: 'Budget', message: `Need £${player.price}M, have £${remainingBudget.toFixed(1)}M` });
      return;
    }

    // Max 3 from same club
    const sameClubCount = selectedList.filter(p => p.team === player.team).length;
    if (sameClubCount >= 3) {
      showToast({ type: 'warning', title: 'Limit', message: `Max 3 players from ${player.team}` });
      return;
    }

    setSelectedPlayers(prev => ({ ...prev, [emptySlot]: player }));
  }, [selectedPlayers, remainingBudget, selectedList]);

  // Remove player from pitch
  const handleRemovePlayer = useCallback((slot: SlotKey) => {
    setSelectedPlayers(prev => ({ ...prev, [slot]: null }));
  }, []);

  // Auto-select
  const handleAutoSelect = useCallback(() => {
    if (allPlayers.length === 0) {
      showToast({ type: 'info', title: 'Loading', message: 'Players are still loading...' });
      return;
    }

    const newSelection = { ...selectedPlayers };
    let budget = remainingBudget;

    const configs = [
      { position: 'GK' as Position, slots: SLOT_CONFIG.GK },
      { position: 'DEF' as Position, slots: SLOT_CONFIG.DEF },
      { position: 'MID' as Position, slots: SLOT_CONFIG.MID },
      { position: 'FWD' as Position, slots: SLOT_CONFIG.FWD },
    ];

    // Track club counts for the 3-per-club rule
    const clubCounts: Record<string, number> = {};
    Object.values(newSelection).forEach(p => {
      if (p) clubCounts[p.team] = (clubCounts[p.team] || 0) + 1;
    });

    for (const config of configs) {
      let available = allPlayers
        .filter(p => p.position === config.position)
        .filter(p => !Object.values(newSelection).some(sel => sel?.id === p.id))
        .sort(() => Math.random() - 0.5);

      for (const slot of config.slots) {
        if (newSelection[slot]) continue;
        const affordable = available.filter(p =>
          p.price <= budget && (clubCounts[p.team] || 0) < 3
        );
        if (affordable.length === 0) continue;
        const pick = affordable[Math.floor(Math.random() * Math.min(5, affordable.length))];
        newSelection[slot] = pick;
        budget -= pick.price;
        clubCounts[pick.team] = (clubCounts[pick.team] || 0) + 1;
        available = available.filter(p => p.id !== pick.id);
      }
    }

    setSelectedPlayers(newSelection);
    showToast({ type: 'success', title: 'Done', message: 'Team auto-selected!' });
  }, [selectedPlayers, remainingBudget, allPlayers]);

  // Clear team
  const handleClearTeam = useCallback(() => {
    const empty: Record<string, Player | null> = {};
    ALL_SLOTS.forEach(s => { empty[s] = null; });
    setSelectedPlayers(empty);
  }, []);

  const [saving, setSaving] = useState(false);

  // Save team to store + Supabase
  const handleSaveTeam = useCallback(async () => {
    if (!isTeamComplete) {
      showToast({ type: 'warning', title: 'Incomplete', message: `Select all 15 players (${selectedCount}/15)` });
      return;
    }

    setSaving(true);

    // Save to Zustand store
    store.resetTeam();
    const allSelected = Object.entries(selectedPlayers).filter(([, p]) => p !== null);

    for (const [, player] of allSelected) {
      if (!player) continue;
      store.addPlayer(player, player.position);
    }

    // Save to Supabase if logged in
    if (user) {
      try {
        const players = allSelected
          .filter(([, p]) => p !== null)
          .map(([slot, p]) => {
            const player = p!;
            const isBench = slot.startsWith('bench');
            const benchOrder = isBench ? parseInt(slot.replace('bench', ''), 10) : null;
            return {
              player_id: player.id,
              position: player.position as 'GK' | 'DEF' | 'MID' | 'FWD',
              is_captain: false,
              is_vice_captain: false,
              is_benched: isBench,
              bench_order: benchOrder,
              purchase_price: player.price,
              current_price: player.price,
            };
          });

        const totalValue = allSelected.reduce((sum, [, p]) => sum + (p?.price || 0), 0);
        const team = await saveTeam(user.id, {
          name: store.teamName,
          formation: store.formation,
          total_value: totalValue,
          players,
        });
        store.setTeamId(team.id);
      } catch (err: any) {
        console.warn('Failed to save to Supabase:', err?.message);
      }
    }

    setSaving(false);
    showToast({ type: 'success', title: 'Saved!', message: 'Your team has been saved.' });
    router.push('/(tabs)/team');
  }, [selectedPlayers, isTeamComplete, selectedCount, store, router, user]);

  // Player avatar component - shows photo with fallback to initials
  const PlayerAvatar = ({ player, size, borderColor }: {
    player: Player; size: number; borderColor?: string;
  }) => {
    const posColor = POS_COLORS[player.position] || colors.slate[500];
    const showImage = player.photo && !failedImages.has(player.id);

    return (
      <View style={{
        width: size, height: size, borderRadius: size / 2, borderWidth: 2,
        borderColor: borderColor || 'rgba(255,255,255,0.5)',
        backgroundColor: posColor, overflow: 'hidden',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
      }}>
        {showImage ? (
          <Image
            source={{ uri: player.photo }}
            style={{ width: size, height: size }}
            resizeMode="cover"
            onError={() => setFailedImages(prev => new Set(prev).add(player.id))}
          />
        ) : (
          <Text style={{ fontSize: size * 0.38, fontFamily: 'DMSans_700Bold', color: colors.white }}>
            {player.name.charAt(0)}
          </Text>
        )}
      </View>
    );
  };

  // Pitch slot component
  const PitchSlot = ({ slot, label }: { slot: SlotKey; label: string }) => {
    const player = selectedPlayers[slot];
    const posColor = POS_COLORS[label] || colors.slate[500];

    if (player) {
      return (
        <Pressable onPress={() => handleRemovePlayer(slot)} style={{ alignItems: 'center' }}>
          <PlayerAvatar player={player} size={44} />
          <View style={{
            marginTop: 3, backgroundColor: 'rgba(15,23,42,0.95)',
            paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
            maxWidth: 65,
          }}>
            <Text style={{ fontSize: 9, fontFamily: 'DMSans_600SemiBold', color: colors.white }}
              numberOfLines={1}>
              {player.name}
            </Text>
          </View>
          <Text style={{ fontSize: 8, fontFamily: 'DMSans_700Bold', color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
            {player.points} pts
          </Text>
        </Pressable>
      );
    }

    return (
      <View style={{ alignItems: 'center' }}>
        <View style={{
          width: 44, height: 44, borderRadius: 22, borderWidth: 2,
          borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.3)',
          backgroundColor: 'rgba(0,0,0,0.25)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={16} color="rgba(255,255,255,0.3)" weight="bold" />
        </View>
        <View style={{
          marginTop: 3, paddingHorizontal: 8, paddingVertical: 2,
          borderRadius: 4, backgroundColor: posColor,
        }}>
          <Text style={{ fontSize: 9, fontFamily: 'DMSans_700Bold', color: colors.white }}>{label}</Text>
        </View>
      </View>
    );
  };

  // Pitch position row
  const PitchRow = ({ slots, label }: { slots: string[]; label: string }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
      {slots.map(slot => <PitchSlot key={slot} slot={slot} label={label} />)}
    </View>
  );

  // Player row in list
  const renderRow = useCallback(({ item: p }: { item: Player }) => {
    const posColor = POS_COLORS[p.position] || colors.slate[500];
    const tooExpensive = p.price > remainingBudget;
    const showImage = p.photo && !failedImages.has(p.id);

    return (
      <Pressable
        onPress={() => !tooExpensive && handleSelectPlayer(p)}
        disabled={tooExpensive}
        style={{
          flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
          borderBottomWidth: 1, borderBottomColor: colors.slate[800],
          opacity: tooExpensive ? 0.4 : 1,
        }}
      >
        {/* Player photo */}
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: posColor + '30', overflow: 'hidden',
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          {showImage ? (
            <Image
              source={{ uri: p.photo }}
              style={{ width: 36, height: 36 }}
              resizeMode="cover"
              onError={() => setFailedImages(prev => new Set(prev).add(p.id))}
            />
          ) : (
            <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: posColor }}>
              {p.name.charAt(0)}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: posColor }} />
            <Text style={{ fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: colors.white }} numberOfLines={1}>
              {p.name}
            </Text>
          </View>
          <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500], marginTop: 1 }}>
            {p.team} · {p.position}
          </Text>
        </View>

        <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.slate[300], width: 50, textAlign: 'center' }}>
          £{p.price.toFixed(1)}M
        </Text>

        <Text style={{ fontSize: 12, fontFamily: 'DMSans_500Medium', color: colors.slate[300], width: 32, textAlign: 'center' }}>
          {p.points}
        </Text>
      </Pressable>
    );
  }, [remainingBudget, handleSelectPlayer, failedImages]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.slate[950] ?? '#020617' }}>
      <Header title="Create your team" showBack hideSignIn />

      {/* Stats bar */}
      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1,
        borderBottomColor: colors.slate[800],
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>PLAYERS:</Text>
          <Text style={{
            fontSize: 12, fontFamily: 'DMSans_700Bold',
            color: isTeamComplete ? colors.success : colors.danger,
          }}>
            {selectedCount}/15
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>BANK:</Text>
          <Text style={{
            fontSize: 12, fontFamily: 'DMSans_700Bold',
            color: remainingBudget > 0 ? colors.white : colors.danger,
          }}>
            £{remainingBudget.toFixed(1)}M
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* ── Pitch View ── */}
        <View style={{
          marginHorizontal: 12, marginTop: 12, borderRadius: 16,
          overflow: 'hidden', aspectRatio: 1 / 1.15,
        }}>
          {/* Pitch background */}
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: '#16a34a',
          }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={{
                position: 'absolute', left: 0, right: 0,
                top: `${i * 10}%`, height: '10%',
                backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.02)',
              }} />
            ))}
          </View>

          {/* Pitch markings */}
          <View style={{
            position: 'absolute', top: 12, left: 12, right: 12, bottom: 12,
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 4,
          }}>
            <View style={{
              position: 'absolute', top: '50%', left: 0, right: 0,
              height: 2, backgroundColor: 'rgba(255,255,255,0.25)',
            }} />
            <View style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 56, height: 56, borderRadius: 28,
              borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
              marginLeft: -28, marginTop: -28,
            }} />
            <View style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.3)',
              marginLeft: -3, marginTop: -3,
            }} />
            <View style={{
              position: 'absolute', top: 0, left: '20%', width: '60%',
              height: '15%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
              borderTopWidth: 0,
            }} />
            <View style={{
              position: 'absolute', bottom: 0, left: '20%', width: '60%',
              height: '15%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
              borderBottomWidth: 0,
            }} />
          </View>

          {/* Player positions */}
          <View style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 4,
          }}>
            <PitchRow slots={SLOT_CONFIG.GK} label="GK" />
            <PitchRow slots={SLOT_CONFIG.DEF} label="DEF" />
            <PitchRow slots={SLOT_CONFIG.MID} label="MID" />
            <PitchRow slots={SLOT_CONFIG.FWD} label="FWD" />
          </View>
        </View>

        {/* Help text */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[400], textAlign: 'center' }}>
            {isTeamComplete
              ? 'Team complete! Save your team to continue.'
              : 'Tap players below to add them, or use auto-select.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 }}>
          {isTeamComplete ? (
            <>
              <Pressable
                onPress={handleClearTeam}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 12, borderRadius: 12,
                  borderWidth: 1, borderColor: colors.slate[600],
                }}
              >
                <Trash size={16} color={colors.slate[300]} />
                <Text style={{ fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300] }}>Clear</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveTeam}
                disabled={saving}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6, paddingVertical: 12, borderRadius: 12,
                  backgroundColor: colors.primary.DEFAULT,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <FloppyDisk size={16} weight="fill" color={colors.white} />
                )}
                <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                  {saving ? 'Saving...' : 'Save Team'}
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={handleAutoSelect}
              disabled={playersLoading}
              style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 6, paddingVertical: 12, borderRadius: 12,
                backgroundColor: colors.primary.DEFAULT,
                opacity: playersLoading ? 0.6 : 1,
              }}
            >
              <Lightning size={16} weight="fill" color={colors.white} />
              <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: colors.white }}>Auto-Select</Text>
            </Pressable>
          )}
        </View>

        {/* ── Player Search Section ── */}
        <View style={{
          marginHorizontal: 12, borderRadius: 16, overflow: 'hidden',
          backgroundColor: colors.slate[900], borderWidth: 1, borderColor: colors.slate[800],
        }}>
          {/* Section header */}
          <View style={{ paddingHorizontal: 14, paddingTop: 14, paddingBottom: 8 }}>
            <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white, marginBottom: 10 }}>
              Search players
            </Text>

            {/* Position filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {POSITIONS.map(pos => {
                const isActive = posFilter === pos;
                const posColor = pos !== 'all' ? POS_COLORS[pos] : undefined;
                return (
                  <Pressable
                    key={pos}
                    onPress={() => setPosFilter(pos)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
                      backgroundColor: isActive ? colors.primary.DEFAULT : colors.slate[800],
                      borderWidth: isActive ? 0 : 1, borderColor: colors.slate[700],
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                    }}
                  >
                    {posColor && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: posColor }} />}
                    <Text style={{
                      fontSize: 13,
                      fontFamily: isActive ? 'DMSans_700Bold' : 'DMSans_500Medium',
                      color: isActive ? colors.white : colors.slate[400],
                      textTransform: pos === 'all' ? 'capitalize' : 'uppercase',
                    }}>
                      {pos === 'all' ? 'All' : pos}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Search bar */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate[800],
              borderRadius: 10, paddingHorizontal: 12, height: 40, marginTop: 8,
              borderWidth: 1, borderColor: colors.slate[700],
            }}>
              <MagnifyingGlass size={16} color={colors.slate[400]} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search players..."
                placeholderTextColor={colors.slate[500]}
                style={{ flex: 1, marginLeft: 8, fontSize: 13, fontFamily: 'DMSans_400Regular', color: colors.white }}
              />
              {search ? (
                <Pressable onPress={() => setSearch('')}>
                  <X size={14} color={colors.slate[400]} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Table header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6,
            backgroundColor: 'rgba(30,41,59,0.6)', borderBottomWidth: 1, borderBottomColor: colors.slate[800],
          }}>
            <View style={{ width: 46 }} />
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 10, fontFamily: 'DMSans_700Bold', color: colors.slate[500], width: 50, textAlign: 'center' }}>PRICE</Text>
            <Text style={{ fontSize: 10, fontFamily: 'DMSans_700Bold', color: colors.slate[500], width: 32, textAlign: 'center' }}>PTS</Text>
          </View>

          {/* Player list */}
          {playersLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
              <Text style={{ fontSize: 13, fontFamily: 'DMSans_500Medium', color: colors.slate[400], marginTop: 12 }}>
                Loading players from FPL...
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <User size={32} color={colors.slate[600]} />
              <Text style={{ fontSize: 13, fontFamily: 'DMSans_500Medium', color: colors.slate[400], marginTop: 8 }}>
                No players found
              </Text>
            </View>
          ) : (
            filtered.slice(0, 30).map(p => (
              <View key={p.id}>{renderRow({ item: p })}</View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
