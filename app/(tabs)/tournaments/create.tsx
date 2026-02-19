import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Trophy,
  Coin,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Users,
  Globe,
  Lock,
  CheckCircle,
  GameController,
  SoccerBall,
  Crown,
  Gift,
  PencilSimple,
  Clock,
  CaretLeft,
  CaretRight,
} from 'phosphor-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateTournament } from '@/hooks/useTournaments';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '@/contexts/ToastContext';
import { useSolanaWallet } from '@/hooks/useSolanaWallet';
import { useFootballFusion } from '@/hooks/useFootballFusion';

/* ─── config matching web ─── */
const COMPETITIONS = [
  { value: 'EPL', label: 'Premier League', logo: 'https://media.api-sports.io/football/leagues/39.png', color: '#37003C' },
  { value: 'UCL', label: 'Champions League', logo: 'https://media.api-sports.io/football/leagues/2.png', color: '#1E40AF' },
  { value: 'LaLiga', label: 'La Liga', logo: 'https://media.api-sports.io/football/leagues/140.png', color: '#F97316' },
  { value: 'Bundesliga', label: 'Bundesliga', logo: 'https://media.api-sports.io/football/leagues/78.png', color: '#EF4444' },
  { value: 'SerieA', label: 'Serie A', logo: 'https://media.api-sports.io/football/leagues/135.png', color: '#3B82F6' },
  { value: 'Mixed', label: 'Mixed Leagues', logo: null, color: '#8B5CF6' },
];

const ENTRY_FEES = [
  { value: '0', label: 'Free', icon: Gift },
  { value: '10', label: '10 USDC', icon: GameController },
  { value: '25', label: '25 USDC', icon: SoccerBall },
  { value: '50', label: '50 USDC', icon: Trophy },
  { value: '100', label: '100 USDC', icon: Crown },
];

const MAX_PARTICIPANTS = [
  { value: '8', label: '8' },
  { value: '16', label: '16' },
  { value: '32', label: '32' },
  { value: '64', label: '64' },
  { value: '100', label: '100' },
];

const PRIZE_DISTRIBUTIONS = [
  { value: 'standard', label: 'Standard', desc: '60% / 30% / 10%' },
  { value: 'winner-takes-all', label: 'Winner Takes All', desc: '100% to 1st' },
  { value: 'top-heavy', label: 'Top Heavy', desc: '70% / 20% / 10%' },
  { value: 'balanced', label: 'Balanced', desc: '50% / 30% / 15% / 5%' },
];

const DURATIONS = [
  { value: '1', label: '1 Day' },
  { value: '3', label: '3 Days' },
  { value: '7', label: '1 Week' },
  { value: '14', label: '2 Weeks' },
  { value: '30', label: '1 Month' },
  { value: 'custom', label: 'Custom' },
];

const STEPS = [
  { num: 1, label: 'Basics', Icon: Trophy },
  { num: 2, label: 'Details', Icon: Coin },
  { num: 3, label: 'Schedule', Icon: Calendar },
];

export default function CreateTournamentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { mutateAsync: create, isPending } = useCreateTournament();
  const { showToast } = useToast();
  const wallet = useSolanaWallet();
  const { createTournament: createOnChain } = useFootballFusion();

  const scrollRef = useRef<ScrollView>(null);
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [competition, setCompetition] = useState('EPL');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [entryFee, setEntryFee] = useState('10');
  const [maxParticipants, setMaxParticipants] = useState('32');
  const [prizeDistribution, setPrizeDistribution] = useState('standard');
  const [duration, setDuration] = useState('7');
  const [customDays, setCustomDays] = useState('');
  const [gameweekStart, setGameweekStart] = useState('1');
  const [gameweekEnd, setGameweekEnd] = useState('38');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempMonth, setTempMonth] = useState(deadline.getMonth());
  const [tempYear, setTempYear] = useState(deadline.getFullYear());
  const [tempHour, setTempHour] = useState(deadline.getHours());
  const [tempMinute, setTempMinute] = useState(deadline.getMinutes());

  const actualDurationDays = duration === 'custom' ? (parseInt(customDays, 10) || 0) : Number(duration);
  const prizePool = Number(entryFee) * Number(maxParticipants);

  const nextStep = () => {
    if (step === 1 && !title.trim()) {
      showToast({ type: 'error', title: 'Error', message: 'Please enter a tournament name' });
      return;
    }
    setStep(Math.min(step + 1, 3));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };
  const prevStep = () => {
    setStep(Math.max(step - 1, 1));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = async () => {
    if (!user) { showToast({ type: 'error', title: 'Error', message: 'Please sign in first' }); return; }
    if (actualDurationDays < 1) {
      showToast({ type: 'error', title: 'Error', message: 'Please set a valid tournament duration' });
      return;
    }
    if (deadline <= new Date()) {
      showToast({ type: 'error', title: 'Error', message: 'Registration deadline must be in the future' });
      return;
    }
    try {
      const startDate = new Date(deadline.getTime());
      const endDate = new Date(startDate.getTime() + actualDurationDays * 24 * 60 * 60 * 1000);

      // Attempt on-chain creation if wallet is connected
      let onChainTxSignature: string | null = null;
      let onChainId: number | null = null;
      if (wallet.connected) {
        try {
          const result = await createOnChain({
            name: title.trim(),
            competition: competition,
            entryFee: Number(entryFee),
            maxParticipants: Number(maxParticipants),
            registrationDeadline: Math.floor(deadline.getTime() / 1000),
            durationDays: actualDurationDays,
          });
          onChainTxSignature = result.signature;
          onChainId = result.onChainId;
        } catch (chainErr: any) {
          const msg = chainErr?.message || '';
          if (msg.includes('rejected') || msg.includes('cancelled') || msg.includes('denied')) {
            showToast({ type: 'warning', title: 'Cancelled', message: 'On-chain transaction was cancelled.' });
            return;
          }
          // If on-chain fails for other reasons, continue with Supabase-only
          console.warn('On-chain creation failed, saving to Supabase only:', chainErr);
        }
      }

      // Save to Supabase
      await create({
        name: title.trim(),
        description: description.trim() || null,
        league_id: COMPETITIONS.findIndex(c => c.value === competition) + 1,
        entry_fee: Number(entryFee),
        prize_pool: prizePool * 0.97,
        max_participants: Number(maxParticipants),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        gameweek_start: parseInt(gameweekStart, 10) || 1,
        gameweek_end: parseInt(gameweekEnd, 10) || 38,
        wallet_address: user.address,
        contract_address: onChainTxSignature,
        on_chain_id: onChainId,
      });

      showToast({
        type: 'success',
        title: 'Success',
        message: onChainTxSignature
          ? 'Tournament created on-chain & saved!'
          : 'Tournament created!',
      });
      router.back();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: err.message || 'Failed to create tournament' });
    }
  };

  /* ─── selectable card helper ─── */
  const SelectCard = ({ active, onPress, children, style }: any) => (
    <Pressable
      onPress={onPress}
      style={[{
        padding: 12, borderRadius: 10, borderWidth: 2,
        borderColor: active ? colors.primary.DEFAULT : colors.slate[700],
        backgroundColor: active ? 'rgba(37,150,190,0.08)' : colors.slate[800],
        position: 'relative',
      }, style]}
    >
      {active && (
        <View style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
          <CheckCircle size={14} weight="fill" color={colors.white} />
        </View>
      )}
      {children}
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.slate[900] }}>
      {/* Top Header */}
      <View style={{ paddingTop: insets.top + 4, paddingBottom: 8, paddingHorizontal: 16, backgroundColor: colors.slate[900], borderBottomWidth: 1, borderBottomColor: colors.slate[800] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Pressable onPress={() => step > 1 ? prevStep() : router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.slate[800], alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} color={colors.slate[300]} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={16} weight="fill" color={colors.white} />
              </View>
              <View>
                <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white }}>Create Tournament</Text>
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>Set up your fantasy competition</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Step indicators */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <View style={{ alignItems: 'center' }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: step >= s.num ? colors.primary.DEFAULT : colors.slate[800],
                  borderWidth: step === s.num ? 2 : 0,
                  borderColor: step === s.num ? 'rgba(37,150,190,0.3)' : undefined,
                }}>
                  {step > s.num ? (
                    <CheckCircle size={16} weight="fill" color={colors.white} />
                  ) : (
                    <s.Icon size={16} weight={step >= s.num ? 'fill' : 'regular'} color={step >= s.num ? colors.white : colors.slate[500]} />
                  )}
                </View>
                <Text style={{ fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: step >= s.num ? colors.white : colors.slate[500], marginTop: 4 }}>{s.label}</Text>
              </View>
              {i < 2 && (
                <View style={{ flex: 1, height: 2, backgroundColor: colors.slate[700], marginHorizontal: 8, marginBottom: 14, borderRadius: 1 }}>
                  <View style={{ height: 2, backgroundColor: step > s.num ? colors.primary.DEFAULT : 'transparent', borderRadius: 1 }} />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, paddingBottom: 180, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* ─── STEP 1: Basics ─── */}
        {step === 1 && (
          <>
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={14} weight="fill" color={colors.white} />
                </View>
                <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Tournament Basics</Text>
              </View>

              <View style={{ gap: 14 }}>
                <View>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300], marginBottom: 6 }}>Tournament Name *</Text>
                  <Input placeholder="e.g., Premier League GW15 Challenge" value={title} onChangeText={setTitle} />
                </View>
                <View>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300], marginBottom: 6 }}>Description</Text>
                  <Input placeholder="Describe your tournament..." value={description} onChangeText={setDescription} multiline numberOfLines={3} />
                </View>
              </View>
            </Card>

            {/* Competition — grid cards like web */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Trophy size={14} weight="fill" color={colors.primary.DEFAULT} />
                <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300] }}>Competition</Text>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {COMPETITIONS.map(c => (
                  <SelectCard key={c.value} active={competition === c.value} onPress={() => setCompetition(c.value)} style={{ width: '47%' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {c.logo ? (
                        <Image source={{ uri: c.logo }} style={{ width: 24, height: 24 }} resizeMode="contain" />
                      ) : (
                        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: c.color + '30', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={14} color={c.color} />
                        </View>
                      )}
                      <Text style={{
                        fontSize: 12, fontFamily: 'DMSans_700Bold',
                        color: competition === c.value ? colors.primary.DEFAULT : colors.white,
                        flexShrink: 1,
                      }} numberOfLines={1}>{c.label}</Text>
                    </View>
                  </SelectCard>
                ))}
              </View>
            </Card>

            {/* Visibility — matches web */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Globe size={14} weight="fill" color={colors.primary.DEFAULT} />
                <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300] }}>Visibility</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <SelectCard active={visibility === 'public'} onPress={() => setVisibility('public')} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: visibility === 'public' ? colors.primary.DEFAULT : colors.slate[700],
                  }}>
                    <Globe size={18} weight="fill" color={colors.white} />
                  </View>
                  <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: visibility === 'public' ? colors.primary.DEFAULT : colors.white, marginTop: 8 }}>Public</Text>
                </SelectCard>
                <SelectCard active={visibility === 'private'} onPress={() => setVisibility('private')} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: visibility === 'private' ? colors.primary.DEFAULT : colors.slate[700],
                  }}>
                    <Lock size={18} weight="fill" color={colors.white} />
                  </View>
                  <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: visibility === 'private' ? colors.primary.DEFAULT : colors.white, marginTop: 8 }}>Private</Text>
                </SelectCard>
              </View>
            </Card>
          </>
        )}

        {/* ─── STEP 2: Details ─── */}
        {step === 2 && (
          <>
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Coin size={14} weight="fill" color={colors.white} />
                </View>
                <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Entry & Prizes</Text>
              </View>

              {/* Entry Fee — card grid like web */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <Coin size={13} weight="fill" color={colors.primary.DEFAULT} />
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300] }}>Entry Fee</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {ENTRY_FEES.map(fee => {
                    const active = entryFee === fee.value;
                    const Icon = fee.icon;
                    return (
                      <SelectCard key={fee.value} active={active} onPress={() => setEntryFee(fee.value)} style={{ width: '30%', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6 }}>
                        <Icon size={18} weight={active ? 'fill' : 'regular'} color={active ? colors.primary.DEFAULT : colors.slate[500]} />
                        <Text style={{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: active ? colors.primary.DEFAULT : colors.white, marginTop: 4 }}>{fee.label}</Text>
                      </SelectCard>
                    );
                  })}
                </View>
              </View>

              {/* Max Participants */}
              <View style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                  <Users size={13} weight="fill" color={colors.primary.DEFAULT} />
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300] }}>Max Participants</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {MAX_PARTICIPANTS.map(opt => {
                    const active = maxParticipants === opt.value;
                    return (
                      <SelectCard key={opt.value} active={active} onPress={() => setMaxParticipants(opt.value)} style={{ width: '18%', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 }}>
                        <Users size={14} weight={active ? 'fill' : 'regular'} color={active ? colors.primary.DEFAULT : colors.slate[500]} />
                        <Text style={{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: active ? colors.primary.DEFAULT : colors.white, marginTop: 2 }}>{opt.label}</Text>
                      </SelectCard>
                    );
                  })}
                </View>
              </View>

              {/* Prize Distribution */}
              <View>
                <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300], marginBottom: 10 }}>Prize Distribution</Text>
                <View style={{ gap: 8 }}>
                  {PRIZE_DISTRIBUTIONS.map(p => {
                    const active = prizeDistribution === p.value;
                    return (
                      <SelectCard key={p.value} active={active} onPress={() => setPrizeDistribution(p.value)}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={{
                            width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: active ? colors.primary.DEFAULT : colors.slate[700],
                          }}>
                            <Trophy size={16} weight="fill" color={colors.white} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: active ? colors.primary.DEFAULT : colors.white }}>{p.label}</Text>
                            <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>{p.desc}</Text>
                          </View>
                          {active && <CheckCircle size={18} weight="fill" color={colors.primary.DEFAULT} />}
                        </View>
                      </SelectCard>
                    );
                  })}
                </View>
              </View>
            </Card>

            {/* Prize Pool Preview */}
            <Card style={{ padding: 16, backgroundColor: 'rgba(37,150,190,0.06)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={20} weight="fill" color={colors.white} />
                </View>
                <View>
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: colors.slate[400] }}>Estimated Prize Pool</Text>
                  <Text style={{ fontSize: 24, fontFamily: 'Teko_700Bold', color: colors.primary.DEFAULT }}>{prizePool} USDC</Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* ─── STEP 3: Schedule ─── */}
        {step === 3 && (
          <>
            {/* Registration Deadline */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={14} weight="fill" color={colors.white} />
                </View>
                <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Registration Deadline</Text>
              </View>

              <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400], marginBottom: 12 }}>
                Set the last date and time players can join
              </Text>

              {/* Date button */}
              <Pressable
                onPress={() => {
                  setTempMonth(deadline.getMonth());
                  setTempYear(deadline.getFullYear());
                  setShowDateModal(true);
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 14, borderRadius: 12, backgroundColor: colors.slate[800],
                  borderWidth: 1, borderColor: colors.slate[700], marginBottom: 10,
                }}
              >
                <Calendar size={18} color={colors.primary.DEFAULT} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Date</Text>
                  <Text style={{ fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: colors.white }}>
                    {deadline.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <PencilSimple size={16} color={colors.slate[500]} />
              </Pressable>

              {/* Time button */}
              <Pressable
                onPress={() => {
                  setTempHour(deadline.getHours());
                  setTempMinute(deadline.getMinutes());
                  setShowTimeModal(true);
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  padding: 14, borderRadius: 12, backgroundColor: colors.slate[800],
                  borderWidth: 1, borderColor: colors.slate[700],
                }}
              >
                <Clock size={18} color={colors.primary.DEFAULT} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500] }}>Time</Text>
                  <Text style={{ fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: colors.white }}>
                    {deadline.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <PencilSimple size={16} color={colors.slate[500]} />
              </Pressable>
            </Card>

            {/* Duration */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={14} weight="fill" color={colors.white} />
                </View>
                <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Tournament Duration</Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DURATIONS.map(d => {
                  const active = duration === d.value;
                  return (
                    <SelectCard key={d.value} active={active} onPress={() => setDuration(d.value)} style={{ width: '30%', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: active ? colors.primary.DEFAULT : colors.white }}>{d.label}</Text>
                    </SelectCard>
                  );
                })}
              </View>

              {/* Custom duration input */}
              {duration === 'custom' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300], marginBottom: 6 }}>Number of Days</Text>
                  <TextInput
                    value={customDays}
                    onChangeText={setCustomDays}
                    placeholder="e.g., 21"
                    placeholderTextColor={colors.slate[600]}
                    keyboardType="number-pad"
                    style={{
                      padding: 14, borderRadius: 12, backgroundColor: colors.slate[800],
                      borderWidth: 1, borderColor: colors.slate[700],
                      fontSize: 15, fontFamily: 'DMSans_500Medium', color: colors.white,
                    }}
                  />
                  {parseInt(customDays, 10) > 0 && (
                    <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500], marginTop: 4 }}>
                      ≈ {Math.floor(parseInt(customDays, 10) / 7)} weeks {parseInt(customDays, 10) % 7 > 0 ? `and ${parseInt(customDays, 10) % 7} days` : ''}
                    </Text>
                  )}
                </View>
              )}
            </Card>

            {/* Gameweek Range */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={14} weight="fill" color={colors.white} />
                </View>
                <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white }}>Gameweek Range</Text>
              </View>

              <Text style={{ fontSize: 12, fontFamily: 'DMSans_400Regular', color: colors.slate[400], marginBottom: 12 }}>
                Set the starting and ending gameweeks for scoring
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300], marginBottom: 6 }}>Start GW</Text>
                  <TextInput
                    value={gameweekStart}
                    onChangeText={setGameweekStart}
                    placeholder="1"
                    placeholderTextColor={colors.slate[600]}
                    keyboardType="number-pad"
                    style={{
                      padding: 14, borderRadius: 12, backgroundColor: colors.slate[800],
                      borderWidth: 1, borderColor: colors.slate[700],
                      fontSize: 15, fontFamily: 'DMSans_500Medium', color: colors.white, textAlign: 'center',
                    }}
                  />
                </View>
                <View style={{ justifyContent: 'flex-end', paddingBottom: 18 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: colors.slate[500] }}>to</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: colors.slate[300], marginBottom: 6 }}>End GW</Text>
                  <TextInput
                    value={gameweekEnd}
                    onChangeText={setGameweekEnd}
                    placeholder="38"
                    placeholderTextColor={colors.slate[600]}
                    keyboardType="number-pad"
                    style={{
                      padding: 14, borderRadius: 12, backgroundColor: colors.slate[800],
                      borderWidth: 1, borderColor: colors.slate[700],
                      fontSize: 15, fontFamily: 'DMSans_500Medium', color: colors.white, textAlign: 'center',
                    }}
                  />
                </View>
              </View>

              {parseInt(gameweekStart, 10) > 0 && parseInt(gameweekEnd, 10) > 0 && (
                <Text style={{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: colors.slate[500], marginTop: 8, textAlign: 'center' }}>
                  {parseInt(gameweekEnd, 10) - parseInt(gameweekStart, 10) + 1} gameweeks of competition
                </Text>
              )}
            </Card>

            {/* Summary */}
            <Card variant="bordered" style={{ padding: 16 }}>
              <Text style={{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: colors.white, marginBottom: 12 }}>Summary</Text>
              {[
                { l: 'Name', v: title || '—' },
                { l: 'Competition', v: COMPETITIONS.find(c => c.value === competition)?.label ?? competition },
                { l: 'Entry Fee', v: `${entryFee} USDC` },
                { l: 'Max Players', v: maxParticipants },
                { l: 'Prize Pool', v: `${(prizePool * 0.97).toFixed(0)} USDC`, color: colors.success },
                { l: 'Deadline', v: deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + deadline.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                { l: 'Duration', v: duration === 'custom' ? `${customDays || 0} days` : (DURATIONS.find(d => d.value === duration)?.label ?? `${duration} days`) },
                { l: 'Gameweeks', v: `GW${gameweekStart}–${gameweekEnd}` },
                { l: 'Platform Fee', v: '3%' },
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: i < 8 ? 1 : 0, borderBottomColor: colors.slate[800] }}>
                  <Text style={{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: colors.slate[400] }}>{row.l}</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: row.color ?? colors.white }}>{row.v}</Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>

      {/* Bottom navigation — sits above tab bar (~70px) */}
      <View style={{
        position: 'absolute', bottom: 70 + insets.bottom, left: 0, right: 0,
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        backgroundColor: colors.slate[900], borderTopWidth: 1, borderTopColor: colors.slate[800],
        flexDirection: 'row', gap: 10,
      }}>
        {step > 1 && (
          <Button variant="outline" size="lg" onPress={prevStep} style={{ flex: 1 }}>
            Back
          </Button>
        )}
        {step < 3 ? (
          <Button variant="primary" size="lg" onPress={nextStep} style={{ flex: 1 }}>
            Next
          </Button>
        ) : (
          <Button variant="primary" size="lg" loading={isPending} onPress={handleSubmit} style={{ flex: 1 }}>
            Create Tournament
          </Button>
        )}
      </View>

      {/* ─── Date Picker Modal ─── */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setShowDateModal(false)}>
          <Pressable style={{ backgroundColor: colors.slate[900], borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
            {/* Month/Year header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Pressable onPress={() => {
                if (tempMonth === 0) { setTempMonth(11); setTempYear(tempYear - 1); }
                else setTempMonth(tempMonth - 1);
              }} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.slate[800], alignItems: 'center', justifyContent: 'center' }}>
                <CaretLeft size={18} color={colors.white} />
              </Pressable>
              <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white }}>
                {new Date(tempYear, tempMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable onPress={() => {
                if (tempMonth === 11) { setTempMonth(0); setTempYear(tempYear + 1); }
                else setTempMonth(tempMonth + 1);
              }} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.slate[800], alignItems: 'center', justifyContent: 'center' }}>
                <CaretRight size={18} color={colors.white} />
              </Pressable>
            </View>

            {/* Day-of-week headers */}
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <View key={d} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: colors.slate[500] }}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Calendar grid */}
            {(() => {
              const firstDay = new Date(tempYear, tempMonth, 1).getDay();
              const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate();
              const today = new Date(); today.setHours(0, 0, 0, 0);
              const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
              const rows: React.ReactNode[] = [];
              let cells: React.ReactNode[] = [];

              for (let i = 0; i < firstDay; i++) {
                cells.push(<View key={`empty-${i}`} style={{ flex: 1, height: 40 }} />);
              }
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(tempYear, tempMonth, day);
                const isPast = date < tomorrow;
                const isSelected = deadline.getDate() === day && deadline.getMonth() === tempMonth && deadline.getFullYear() === tempYear;

                cells.push(
                  <Pressable
                    key={day}
                    disabled={isPast}
                    onPress={() => {
                      const next = new Date(deadline);
                      next.setFullYear(tempYear, tempMonth, day);
                      setDeadline(next);
                      setShowDateModal(false);
                    }}
                    style={{
                      flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 8,
                      backgroundColor: isSelected ? colors.primary.DEFAULT : 'transparent',
                    }}
                  >
                    <Text style={{
                      fontSize: 14, fontFamily: isSelected ? 'DMSans_700Bold' : 'DMSans_500Medium',
                      color: isPast ? colors.slate[700] : isSelected ? colors.white : colors.slate[200],
                    }}>{day}</Text>
                  </Pressable>
                );

                if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                  while (cells.length < 7) cells.push(<View key={`pad-${cells.length}`} style={{ flex: 1, height: 40 }} />);
                  rows.push(<View key={`row-${rows.length}`} style={{ flexDirection: 'row', marginBottom: 4 }}>{cells}</View>);
                  cells = [];
                }
              }
              return rows;
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ─── Time Picker Modal ─── */}
      <Modal visible={showTimeModal} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }} onPress={() => setShowTimeModal(false)}>
          <Pressable style={{ backgroundColor: colors.slate[900], borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 }}>
            <Text style={{ fontSize: 16, fontFamily: 'DMSans_700Bold', color: colors.white, textAlign: 'center', marginBottom: 20 }}>Select Time</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              {/* Hour */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Pressable onPress={() => setTempHour((tempHour + 1) % 24)} style={{ width: 44, height: 36, borderRadius: 8, backgroundColor: colors.slate[800], alignItems: 'center', justifyContent: 'center' }}>
                  <CaretLeft size={16} color={colors.white} style={{ transform: [{ rotate: '90deg' }] }} />
                </Pressable>
                <View style={{ width: 64, height: 56, borderRadius: 12, backgroundColor: colors.slate[800], borderWidth: 1, borderColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 28, fontFamily: 'Teko_700Bold', color: colors.white }}>{String(tempHour).padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => setTempHour((tempHour + 23) % 24)} style={{ width: 44, height: 36, borderRadius: 8, backgroundColor: colors.slate[800], alignItems: 'center', justifyContent: 'center' }}>
                  <CaretRight size={16} color={colors.white} style={{ transform: [{ rotate: '90deg' }] }} />
                </Pressable>
              </View>

              <Text style={{ fontSize: 28, fontFamily: 'Teko_700Bold', color: colors.slate[500] }}>:</Text>

              {/* Minute */}
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Pressable onPress={() => setTempMinute((tempMinute + 5) % 60)} style={{ width: 44, height: 36, borderRadius: 8, backgroundColor: colors.slate[800], alignItems: 'center', justifyContent: 'center' }}>
                  <CaretLeft size={16} color={colors.white} style={{ transform: [{ rotate: '90deg' }] }} />
                </Pressable>
                <View style={{ width: 64, height: 56, borderRadius: 12, backgroundColor: colors.slate[800], borderWidth: 1, borderColor: colors.primary.DEFAULT, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 28, fontFamily: 'Teko_700Bold', color: colors.white }}>{String(tempMinute).padStart(2, '0')}</Text>
                </View>
                <Pressable onPress={() => setTempMinute((tempMinute + 55) % 60)} style={{ width: 44, height: 36, borderRadius: 8, backgroundColor: colors.slate[800], alignItems: 'center', justifyContent: 'center' }}>
                  <CaretRight size={16} color={colors.white} style={{ transform: [{ rotate: '90deg' }] }} />
                </Pressable>
              </View>
            </View>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => {
                const next = new Date(deadline);
                next.setHours(tempHour, tempMinute);
                setDeadline(next);
                setShowTimeModal(false);
              }}
              style={{ marginTop: 24 }}
            >
              Confirm
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
