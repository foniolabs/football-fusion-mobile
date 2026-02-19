import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Crown, Star, Lightning, Sparkle, ArrowsClockwise,
  ShieldCheck, User, Minus, ArrowsLeftRight, Trophy,
  Users, ChartLineUp, Check,
} from 'phosphor-react-native';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTeamStore, type TeamPlayer } from '@/stores/teamStore';
import { useAuth } from '@/hooks/useAuth';
import { saveTeam } from '@/lib/api/teams';
import { colors } from '@/theme/colors';
import { useToast } from '@/contexts/ToastContext';

// ---------- Constants ----------

const FORMATIONS: Record<string, { DEF: number; MID: number; FWD: number }> = {
  '4-4-2': { DEF: 4, MID: 4, FWD: 2 },
  '4-3-3': { DEF: 4, MID: 3, FWD: 3 },
  '3-5-2': { DEF: 3, MID: 5, FWD: 2 },
  '3-4-3': { DEF: 3, MID: 4, FWD: 3 },
  '5-3-2': { DEF: 5, MID: 3, FWD: 2 },
  '5-4-1': { DEF: 5, MID: 4, FWD: 1 },
  '4-5-1': { DEF: 4, MID: 5, FWD: 1 },
};
const FORMATION_KEYS = Object.keys(FORMATIONS);

type ChipType = 'tripleCaptain' | 'benchBoost' | 'freeHit' | 'wildcard';

const CHIPS: { id: ChipType; name: string; desc: string; color: string }[] = [
  { id: 'tripleCaptain', name: 'Triple Captain', desc: 'Captain 3x pts', color: '#F59E0B' },
  { id: 'benchBoost', name: 'Bench Boost', desc: 'Bench scores', color: '#10B981' },
  { id: 'freeHit', name: 'Free Hit', desc: '1 GW free transfers', color: '#38BDF8' },
  { id: 'wildcard', name: 'Wildcard', desc: 'Unlimited transfers', color: '#A855F7' },
];

const POS_COLORS: Record<string, string> = {
  GK: '#F59E0B', DEF: '#10B981', MID: '#38BDF8', FWD: '#EF4444',
};

// ---------- Component ----------

export default function TeamScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const store = useTeamStore();
  const { showToast } = useToast();

  const goalkeeper = store.goalkeeper;
  const defenders = store.defenders || [];
  const midfielders = store.midfielders || [];
  const forwards = store.forwards || [];
  const bench = store.bench || [];

  const [formation, setFormation] = useState(store.formation || '4-3-3');
  const [saving, setSaving] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const formConfig = FORMATIONS[formation] || FORMATIONS['4-3-3'];

  // Build starting lineup slots from store
  const buildStartingSlots = useCallback((): (TeamPlayer | null)[] => {
    const positions = [
      'GK',
      ...Array(formConfig.DEF).fill('DEF'),
      ...Array(formConfig.MID).fill('MID'),
      ...Array(formConfig.FWD).fill('FWD'),
    ];
    const slots: (TeamPlayer | null)[] = new Array(positions.length).fill(null);

    // Fill GK slot
    if (goalkeeper) slots[0] = goalkeeper;

    // Fill DEF slots
    defenders.forEach((p, i) => {
      const idx = 1 + i;
      if (idx < 1 + formConfig.DEF) slots[idx] = p;
    });

    // Fill MID slots
    midfielders.forEach((p, i) => {
      const idx = 1 + formConfig.DEF + i;
      if (idx < 1 + formConfig.DEF + formConfig.MID) slots[idx] = p;
    });

    // Fill FWD slots
    forwards.forEach((p, i) => {
      const idx = 1 + formConfig.DEF + formConfig.MID + i;
      if (idx < 1 + formConfig.DEF + formConfig.MID + formConfig.FWD) slots[idx] = p;
    });

    return slots;
  }, [goalkeeper, defenders, midfielders, forwards, formConfig]);

  const startingSlots = buildStartingSlots();
  const slotPositions = [
    'GK',
    ...Array(formConfig.DEF).fill('DEF'),
    ...Array(formConfig.MID).fill('MID'),
    ...Array(formConfig.FWD).fill('FWD'),
  ];

  const allPlayers = [goalkeeper, ...defenders, ...midfielders, ...forwards].filter(Boolean) as TeamPlayer[];
  const totalPoints = allPlayers.reduce((sum, p) => sum + (p?.points || 0), 0);
  const teamValue = allPlayers.reduce((sum, p) => sum + (p?.price || 0), 0);
  const filledCount = allPlayers.length;
  const hasTeam = filledCount > 0;

  const handleFormationChange = (newForm: string) => {
    setFormation(newForm);
    store.setFormation(newForm);
    setSelectedSlot(null);
  };

  const handleSlotTap = (slotIndex: number) => {
    if (!startingSlots[slotIndex]) return;
    setSelectedSlot(selectedSlot === slotIndex ? null : slotIndex);
  };

  const handleSetCaptain = (playerId: string) => {
    store.setCaptain(playerId);
    showToast({ type: 'success', title: 'Captain Set', message: 'Captain updated!' });
  };

  const handleSetViceCaptain = (playerId: string) => {
    const allP = [goalkeeper, ...defenders, ...midfielders, ...forwards].filter(Boolean) as TeamPlayer[];
    const captain = allP.find(p => p.isCaptain);
    if (captain && captain.id === playerId) {
      showToast({ type: 'error', title: 'Error', message: 'Captain cannot be vice captain' });
      return;
    }
    store.setViceCaptain(playerId);
    showToast({ type: 'success', title: 'Vice Captain Set', message: 'Vice captain updated!' });
  };

  const handleActivateChip = (chipId: ChipType) => {
    if (!store.chipsAvailable[chipId]) {
      showToast({ type: 'warning', title: 'Used', message: 'This chip has already been used' });
      return;
    }
    if (store.activeChip === chipId) {
      store.deactivateChip();
      showToast({ type: 'info', title: 'Deactivated', message: 'Chip deactivated' });
    } else {
      store.activateChip(chipId);
      showToast({ type: 'success', title: 'Activated', message: `${CHIPS.find(c => c.id === chipId)?.name} activated!` });
    }
  };

  const handleSave = async () => {
    if (filledCount < 11) {
      showToast({ type: 'warning', title: 'Incomplete', message: `Need at least 11 starters (${filledCount}/11)` });
      return;
    }
    const hasCaptain = allPlayers.some(p => p.isCaptain);
    if (!hasCaptain) {
      showToast({ type: 'warning', title: 'No Captain', message: 'Please tap a player on the pitch and set a captain' });
      return;
    }
    if (!user) {
      showToast({ type: 'error', title: 'Sign In Required', message: 'Please sign in to save your team.' });
      return;
    }

    setSaving(true);
    try {
      const allWithBench = [...allPlayers, ...bench];
      const team = await saveTeam(user.id, {
        name: store.teamName,
        formation,
        total_value: teamValue,
        players: allWithBench.map(p => ({
          player_id: p.id,
          position: p.position as 'GK' | 'DEF' | 'MID' | 'FWD',
          is_captain: p.isCaptain,
          is_vice_captain: p.isViceCaptain,
          is_benched: p.isBenched,
          bench_order: p.benchOrder ?? null,
          purchase_price: p.price,
          current_price: p.price,
        })),
      });
      store.setTeamId(team.id);
      showToast({ type: 'success', title: 'Saved!', message: 'Your lineup has been saved.' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err?.message || 'Failed to save team.' });
    } finally {
      setSaving(false);
    }
  };

  // -------- Render helpers --------

  const gkStart = 0;
  const defStart = 1;
  const midStart = 1 + formConfig.DEF;
  const fwdStart = 1 + formConfig.DEF + formConfig.MID;

  const renderPitchSlot = (slotIndex: number) => {
    const player = startingSlots[slotIndex];
    const pos = slotPositions[slotIndex];
    const posColor = POS_COLORS[pos] || colors.slate[500];
    const isSelected = selectedSlot === slotIndex;
    const isCaptain = player?.isCaptain;
    const isVc = player?.isViceCaptain;

    if (!player) {
      return (
        <View key={`slot-${slotIndex}`} style={{ alignItems: 'center' }}>
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
            <Text style={{ fontSize: 9, fontFamily: 'DMSans_700Bold', color: colors.white }}>{pos}</Text>
          </View>
        </View>
      );
    }

    return (
      <Pressable
        key={`slot-${slotIndex}`}
        onPress={() => handleSlotTap(slotIndex)}
        style={{ alignItems: 'center', transform: isSelected ? [{ scale: 1.1 }, { translateY: -4 }] : [] }}
      >
        {/* Captain/VC badge */}
        {(isCaptain || isVc) && (
          <View style={{
            position: 'absolute', top: -2, right: -2, width: 18, height: 18,
            borderRadius: 9, alignItems: 'center', justifyContent: 'center', zIndex: 20,
            backgroundColor: isCaptain ? '#F59E0B' : '#94A3B8',
          }}>
            <Text style={{ fontSize: 8, fontFamily: 'DMSans_700Bold', color: '#0F172A' }}>
              {isCaptain ? 'C' : 'V'}
            </Text>
          </View>
        )}

        {/* Remove badge when selected */}
        {isSelected && (
          <View style={{
            position: 'absolute', top: -2, left: -2, width: 18, height: 18,
            borderRadius: 9, backgroundColor: '#EF4444',
            alignItems: 'center', justifyContent: 'center', zIndex: 20,
          }}>
            <Minus size={10} color={colors.white} weight="bold" />
          </View>
        )}

        <View style={{
          width: 46, height: 46, borderRadius: 23, overflow: 'hidden',
          borderWidth: 2, backgroundColor: posColor,
          borderColor: isSelected ? 'white' : 'rgba(255,255,255,0.5)',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
        }}>
          {player.photo ? (
            <Image source={{ uri: player.photo }} style={{ width: 46, height: 46 }} resizeMode="cover" />
          ) : (
            <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white }}>
              {player.name.charAt(0)}
            </Text>
          )}
        </View>

        <View style={{
          marginTop: 3, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
          backgroundColor: 'rgba(15,23,42,0.95)', maxWidth: 65,
        }}>
          <Text style={{ fontSize: 9, fontFamily: 'DMSans_600SemiBold', color: colors.white }}
            numberOfLines={1}>
            {player.name.split(' ').pop()}
          </Text>
        </View>

        <Text style={{ fontSize: 8, fontFamily: 'DMSans_700Bold', color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
          {player.points} pts
        </Text>
      </Pressable>
    );
  };

  const renderPositionRow = (startIdx: number, count: number) => {
    const indices = [];
    for (let i = startIdx; i < startIdx + count; i++) indices.push(i);
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 6 }}>
        {indices.map(i => renderPitchSlot(i))}
      </View>
    );
  };

  // -------- No team state --------
  if (!hasTeam) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.slate[900] }} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 }}>
          <User size={48} color={colors.slate[600]} />
          <Text style={{ fontSize: 20, fontFamily: 'DMSans_700Bold', color: colors.white, marginTop: 16 }}>
            No Team Created
          </Text>
          <Text style={{ fontSize: 14, fontFamily: 'DMSans_400Regular', color: colors.slate[400], marginTop: 6, textAlign: 'center' }}>
            Build your 15-player squad to start competing
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/team/builder')}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: colors.primary.DEFAULT, paddingHorizontal: 24,
              paddingVertical: 14, borderRadius: 14, marginTop: 24,
            }}
          >
            <ArrowsLeftRight size={18} weight="fill" color={colors.white} />
            <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Create Team</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // -------- Main render --------
  return (
    <View style={{ flex: 1, backgroundColor: colors.slate[900] }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: 'rgba(30,41,59,0.8)' }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16, paddingVertical: 10,
          borderBottomWidth: 1, borderBottomColor: colors.slate[800],
        }}>
          <View>
            <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white }}>My Team</Text>
            <Text style={{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>
              {filledCount}/11 selected · {formation}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              onPress={() => router.push('/(tabs)/team/builder')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                borderWidth: 1, borderColor: colors.slate[600],
              }}
            >
              <ArrowsLeftRight size={14} color={colors.slate[300]} />
              <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300] }}>Transfers</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={filledCount < 11 || saving}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                backgroundColor: filledCount >= 11 ? colors.primary.DEFAULT : colors.slate[700],
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Check size={14} color={colors.white} weight="bold" />
              )}
              <Text style={{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: colors.white }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12, marginTop: 12 }}>
          {[
            { label: 'Points', value: totalPoints.toString(), icon: <Trophy size={14} weight="fill" color="#10B981" />, },
            { label: 'Squad', value: `${allPlayers.length + bench.length}/15`, icon: <Users size={14} weight="fill" color="#A855F7" />, },
            { label: 'Value', value: `€${teamValue.toFixed(1)}M`, icon: <Lightning size={14} weight="fill" color="#F59E0B" />, },
            { label: 'Bank', value: `€${(100 - teamValue).toFixed(1)}M`, icon: <ChartLineUp size={14} weight="fill" color="#38BDF8" />, },
          ].map((stat, i) => (
            <View key={i} style={{
              flex: 1, padding: 10, borderRadius: 14,
              backgroundColor: colors.slate[800], borderWidth: 1, borderColor: colors.slate[700],
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                {stat.icon}
                <Text style={{ fontSize: 9, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>{stat.label}</Text>
              </View>
              <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white }}>{stat.value}</Text>
            </View>
          ))}
        </View>

        {/* Formation Selector */}
        <View style={{ marginTop: 12, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: colors.slate[400], textTransform: 'uppercase', letterSpacing: 1 }}>
              Formation
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: colors.slate[600] }}>
              1 GK · {formConfig.DEF} DEF · {formConfig.MID} MID · {formConfig.FWD} FWD
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {FORMATION_KEYS.map(f => (
              <Pressable
                key={f}
                onPress={() => handleFormationChange(f)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                  backgroundColor: formation === f ? colors.primary.DEFAULT : colors.slate[800],
                  ...(formation === f ? {
                    shadowColor: colors.primary.DEFAULT,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 4,
                  } : {}),
                }}
              >
                <Text style={{
                  fontSize: 12, fontFamily: 'DMSans_600SemiBold',
                  color: formation === f ? colors.white : colors.slate[400],
                }}>
                  {f}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Chips */}
        <View style={{ marginTop: 12, paddingHorizontal: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Sparkle size={14} color="#A855F7" weight="fill" />
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_700Bold', color: colors.slate[300], textTransform: 'uppercase', letterSpacing: 1 }}>
              Chips
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CHIPS.map(chip => {
              const isUsed = !store.chipsAvailable[chip.id];
              const isActive = store.activeChip === chip.id;
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => !isUsed && handleActivateChip(chip.id)}
                  disabled={isUsed}
                  style={{
                    flex: 1, minWidth: '45%', padding: 10, borderRadius: 14,
                    borderWidth: 1,
                    backgroundColor: isActive ? `${chip.color}15` : colors.slate[800],
                    borderColor: isActive ? `${chip.color}50` : colors.slate[700],
                    opacity: isUsed ? 0.5 : 1,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{
                      width: 22, height: 22, borderRadius: 6,
                      backgroundColor: `${chip.color}20`, alignItems: 'center', justifyContent: 'center',
                    }}>
                      {chip.id === 'tripleCaptain' && <Crown size={12} color={chip.color} weight="fill" />}
                      {chip.id === 'benchBoost' && <Lightning size={12} color={chip.color} weight="fill" />}
                      {chip.id === 'freeHit' && <ArrowsClockwise size={12} color={chip.color} weight="fill" />}
                      {chip.id === 'wildcard' && <Sparkle size={12} color={chip.color} weight="fill" />}
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: colors.white, flexShrink: 1 }}
                      numberOfLines={1}>
                      {chip.name}
                    </Text>
                  </View>
                  {isUsed && (
                    <Text style={{ fontSize: 9, fontFamily: 'DMSans_400Regular', color: colors.slate[600], marginTop: 2 }}>Used</Text>
                  )}
                  {isActive && (
                    <Badge variant="success" style={{ marginTop: 4, alignSelf: 'flex-start' }}>Active</Badge>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Pitch */}
        <View style={{
          marginHorizontal: 12, marginTop: 12, borderRadius: 16,
          overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
        }}>
          <View style={{ position: 'relative', minHeight: 420 }}>
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
              {/* Center line */}
              <View style={{
                position: 'absolute', top: '50%', left: 0, right: 0,
                height: 2, backgroundColor: 'rgba(255,255,255,0.25)',
              }} />
              {/* Center circle */}
              <View style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 56, height: 56, borderRadius: 28,
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
                marginLeft: -28, marginTop: -28,
              }} />
              {/* Center dot */}
              <View style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: 'rgba(255,255,255,0.3)',
                marginLeft: -3, marginTop: -3,
              }} />
              {/* Top penalty box */}
              <View style={{
                position: 'absolute', top: 0, left: '20%', width: '60%',
                height: '15%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
                borderTopWidth: 0,
              }} />
              {/* Top goal box */}
              <View style={{
                position: 'absolute', top: 0, left: '35%', width: '30%',
                height: '6%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
                borderTopWidth: 0,
              }} />
              {/* Bottom penalty box */}
              <View style={{
                position: 'absolute', bottom: 0, left: '20%', width: '60%',
                height: '15%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
                borderBottomWidth: 0,
              }} />
              {/* Bottom goal box */}
              <View style={{
                position: 'absolute', bottom: 0, left: '35%', width: '30%',
                height: '6%', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
                borderBottomWidth: 0,
              }} />
            </View>

            {/* Player positions */}
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 4,
            }}>
              {renderPositionRow(fwdStart, formConfig.FWD)}
              {renderPositionRow(midStart, formConfig.MID)}
              {renderPositionRow(defStart, formConfig.DEF)}
              {renderPositionRow(gkStart, 1)}
            </View>
          </View>
        </View>

        {/* Selected player actions */}
        {selectedSlot !== null && startingSlots[selectedSlot] && (
          <View style={{ paddingHorizontal: 12, marginTop: 10 }}>
            {/* Swap hint */}
            <View style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
              backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
              alignItems: 'center', marginBottom: 8,
            }}>
              <Text style={{ fontSize: 11, fontFamily: 'DMSans_500Medium', color: '#10B981' }}>
                {startingSlots[selectedSlot]!.name} selected — set captain or vice captain
              </Text>
            </View>

            {/* Captain / Vice Captain buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
              <Pressable
                onPress={() => handleSetCaptain(startingSlots[selectedSlot]!.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: startingSlots[selectedSlot]?.isCaptain ? colors.primary.DEFAULT : colors.slate[800],
                  borderWidth: 1, borderColor: startingSlots[selectedSlot]?.isCaptain ? colors.primary.DEFAULT : colors.slate[700],
                }}
              >
                <Crown size={16} color={startingSlots[selectedSlot]?.isCaptain ? colors.white : '#F59E0B'} weight="fill" />
                <Text style={{
                  fontSize: 13, fontFamily: 'DMSans_600SemiBold',
                  color: startingSlots[selectedSlot]?.isCaptain ? colors.white : colors.slate[300],
                }}>Captain</Text>
              </Pressable>
              <Pressable
                onPress={() => handleSetViceCaptain(startingSlots[selectedSlot]!.id)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                  backgroundColor: startingSlots[selectedSlot]?.isViceCaptain ? colors.primary.DEFAULT : colors.slate[800],
                  borderWidth: 1, borderColor: startingSlots[selectedSlot]?.isViceCaptain ? colors.primary.DEFAULT : colors.slate[700],
                }}
              >
                <Star size={16} color={startingSlots[selectedSlot]?.isViceCaptain ? colors.white : '#94A3B8'} weight="fill" />
                <Text style={{
                  fontSize: 13, fontFamily: 'DMSans_600SemiBold',
                  color: startingSlots[selectedSlot]?.isViceCaptain ? colors.white : colors.slate[300],
                }}>Vice</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Substitutes */}
        {bench.length > 0 && (
          <View style={{ paddingHorizontal: 12, marginTop: 16 }}>
            <View style={{
              padding: 14, borderRadius: 16, backgroundColor: colors.slate[800],
              borderWidth: 1, borderColor: colors.slate[700],
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <ShieldCheck size={14} color={colors.slate[500]} />
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_700Bold', color: colors.slate[300], textTransform: 'uppercase', letterSpacing: 1 }}>
                  Substitutes
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 14 }}>
                {bench.map((p, idx) => {
                  const posColor = POS_COLORS[p.position] || colors.slate[500];
                  return (
                    <View key={p.id} style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 9, fontFamily: 'DMSans_500Medium', color: colors.slate[600], marginBottom: 4 }}>
                        Sub {idx + 1}
                      </Text>
                      <View style={{
                        width: 40, height: 40, borderRadius: 20, overflow: 'hidden',
                        borderWidth: 2, borderColor: colors.slate[600],
                        backgroundColor: posColor, opacity: 0.7,
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {p.photo ? (
                          <Image source={{ uri: p.photo }} style={{ width: 40, height: 40 }} resizeMode="cover" />
                        ) : (
                          <Text style={{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                            {p.name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <View style={{
                        marginTop: 3, paddingHorizontal: 5, paddingVertical: 1,
                        borderRadius: 4, backgroundColor: 'rgba(30,41,59,0.8)', maxWidth: 60,
                      }}>
                        <Text style={{ fontSize: 9, fontFamily: 'DMSans_500Medium', color: colors.slate[400] }}
                          numberOfLines={1}>
                          {p.name.split(' ').pop()}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Squad Pool - players not on pitch */}
        <View style={{ paddingHorizontal: 12, marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontFamily: 'DMSans_700Bold', color: colors.slate[300], textTransform: 'uppercase', letterSpacing: 1 }}>
              Your Squad
            </Text>
            <Text style={{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: colors.slate[600] }}>
              {allPlayers.length + bench.length} players
            </Text>
          </View>

          {/* Group by position */}
          {(['GK', 'DEF', 'MID', 'FWD'] as const).map(pos => {
            let posPlayers: TeamPlayer[] = [];
            if (pos === 'GK' && goalkeeper) posPlayers = [goalkeeper];
            else if (pos === 'DEF') posPlayers = defenders;
            else if (pos === 'MID') posPlayers = midfielders;
            else if (pos === 'FWD') posPlayers = forwards;

            if (posPlayers.length === 0) return null;
            const posColor = POS_COLORS[pos];

            return (
              <View key={pos} style={{ marginBottom: 10 }}>
                <Text style={{ fontSize: 10, fontFamily: 'DMSans_700Bold', color: posColor, textTransform: 'uppercase', marginBottom: 4 }}>
                  {pos}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                  {posPlayers.map(player => (
                    <View key={player.id} style={{ alignItems: 'center' }}>
                      <View style={{
                        width: 48, height: 48, borderRadius: 24,
                        overflow: 'hidden', borderWidth: 2,
                        borderColor: player.isCaptain ? '#F59E0B' : player.isViceCaptain ? '#94A3B8' : colors.slate[600],
                        backgroundColor: posColor, alignItems: 'center', justifyContent: 'center',
                      }}>
                        {player.photo ? (
                          <Image source={{ uri: player.photo }} style={{ width: 48, height: 48 }} resizeMode="cover" />
                        ) : (
                          <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                            {player.name.charAt(0)}
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 9, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300], marginTop: 3, maxWidth: 54 }}
                        numberOfLines={1}>
                        {player.name.split(' ').pop()}
                      </Text>
                      <Text style={{ fontSize: 8, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>
                        {player.points}pts
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
