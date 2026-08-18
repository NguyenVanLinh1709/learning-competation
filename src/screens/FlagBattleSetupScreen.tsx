import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFlagBattleStore } from '../store/flagBattleStore';
import { useCreditsStore } from '../store/creditsStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import InfoButton from '../components/InfoButton';
import HowToPlayModal from '../components/HowToPlayModal';
import CreditsBadge from '../components/CreditsBadge';
import OutOfCreditsModal from '../components/OutOfCreditsModal';
import PlayerNames from '../components/PlayerNames';
import TourButton from '../components/TourButton';
import TourOverlay from '../components/TourOverlay';
import { useTourStore } from '../store/tourStore';
import { useTourTarget } from '../hooks/useTourTarget';
import { isTourSeen } from '../utils/tourSeen';
import { screenTours } from '../content/screenTours';
import { loadLastSetup, saveLastSetup } from '../utils/lastSetup';
import type { DifficultyLevel, RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FlagBattleSetup'> };

const LAST_SETUP_KEY = 'flag_battle';
const TOUR_ID = LAST_SETUP_KEY;
interface LastSetup {
  p1Name: string;
  p2Name: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  timeLimitMs: number;
}

const QUESTION_COUNTS = [10, 20, 30, 50];

const TIME_LIMITS = [
  { label: '5s',  value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
  { label: '20s', value: 20000 },
  { label: '30s', value: 30000 },
  { label: '∞',   value: 0 },
];
const FLAG_ACCENT = '#0F766E';
const FLAG_ACCENT_LIGHT = '#14B8A6';

export default function FlagBattleSetupScreen({ navigation }: Props) {
  const { setConfig } = useFlagBattleStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
  const [howToOpen, setHowToOpen] = useState(false);
  const [outOfCreditsVisible, setOutOfCreditsVisible] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - scrollYRef.current;
    scrollYRef.current = y;
    // Shift every cached target rect by the real scroll delta as it happens —
    // more reliable than predicting where an animated scrollTo will land,
    // since RN clamps it to the actual scrollable extent.
    if (delta !== 0 && useTourStore.getState().activeTour === TOUR_ID) {
      useTourStore.getState().shiftTargets(TOUR_ID, delta);
    }
  };

  const playerNamesTarget = useTourTarget(`${TOUR_ID}:playerNames`);
  const difficultyTarget = useTourTarget(`${TOUR_ID}:difficulty`);
  const questionsTarget = useTourTarget(`${TOUR_ID}:questions`);
  const timeLimitTarget = useTourTarget(`${TOUR_ID}:timeLimit`);
  const startBtnTarget = useTourTarget(`${TOUR_ID}:startBtn`);

  const beginTour = () => {
    setHowToOpen(false);
    useTourStore.getState().startTour(TOUR_ID, screenTours[TOUR_ID] as string[]);
  };

  useEffect(() => {
    isTourSeen(TOUR_ID).then((seen) => {
      if (!seen) setTimeout(beginTour, 250);
    });
  }, []);

  const [p1Name, setP1Name] = useState('Player A');
  const [p2Name, setP2Name] = useState('Player B');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimitMs, setTimeLimitMs] = useState(15000);

  useEffect(() => {
    loadLastSetup<LastSetup>(LAST_SETUP_KEY).then((saved) => {
      if (!saved) return;
      if (saved.p1Name) setP1Name(saved.p1Name);
      if (saved.p2Name) setP2Name(saved.p2Name);
      if (saved.difficulty) setDifficulty(saved.difficulty);
      if (saved.questionCount) setQuestionCount(saved.questionCount);
      if (saved.timeLimitMs !== undefined) setTimeLimitMs(saved.timeLimitMs);
    });
  }, []);

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;

  const difficulties: { label: string; desc: string; value: DifficultyLevel; emoji: string }[] = [
    { label: t.easy,   desc: '20 well-known nations',     value: 'easy',   emoji: '🌱' },
    { label: t.medium, desc: '40 nations',                value: 'medium', emoji: '🔥' },
    { label: t.hard,   desc: '60+ nations worldwide',     value: 'hard',   emoji: '💀' },
  ];

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const proceedToGame = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfig({
      player1Name: p1Name.trim(),
      player2Name: p2Name.trim(),
      difficulty,
      totalQuestions: questionCount,
      timeLimitMs,
    });
    saveLastSetup<LastSetup>(LAST_SETUP_KEY, {
      p1Name: p1Name.trim(), p2Name: p2Name.trim(), difficulty, questionCount, timeLimitMs,
    });
    navigation.navigate('FlagBattleGame');
  };

  const handleStart = () => {
    if (!canStart) return;
    if (useCreditsStore.getState().consumeCredit('flag')) {
      proceedToGame();
    } else {
      setOutOfCreditsVisible(true);
    }
  };

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >

          <View style={styles.topRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={[styles.title, { color: C.text }]}>{t.flagBattleSetup}</Text>
            <View style={styles.topRightIcons}>
              <TourButton onPress={beginTour} />
              <InfoButton onPress={() => setHowToOpen(true)} />
            </View>
          </View>

          {/* Player names */}
          <PlayerNames
            ref={playerNamesTarget.ref}
            onLayout={playerNamesTarget.onLayout}
            p1Name={p1Name}
            p2Name={p2Name}
            setP1Name={setP1Name}
            setP2Name={setP2Name}
          />

          {/* Difficulty */}
          <View style={styles.section} ref={difficultyTarget.ref} onLayout={difficultyTarget.onLayout}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.difficultyLabel}</Text>
            <View style={styles.diffRow}>
              {difficulties.map((d) => {
                const selected = difficulty === d.value;
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[
                      styles.diffBtn,
                      { backgroundColor: C.surface, borderColor: C.border },
                      selected && { borderColor: FLAG_ACCENT, backgroundColor: 'rgba(15,118,110,0.15)' },
                    ]}
                    onPress={() => { tap(); setDifficulty(d.value); }}
                  >
                    <Text style={styles.diffEmoji}>{d.emoji}</Text>
                    <Text style={[styles.diffLabel, { color: selected ? C.text : C.textMuted }]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Question count */}
          <View style={styles.section} ref={questionsTarget.ref} onLayout={questionsTarget.onLayout}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.questionsLabel}</Text>
            <View style={styles.optionRow}>
              {QUESTION_COUNTS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[
                    styles.optionBtn,
                    { backgroundColor: C.surface, borderColor: C.border },
                    questionCount === n && { borderColor: FLAG_ACCENT, backgroundColor: 'rgba(15,118,110,0.15)' },
                  ]}
                  onPress={() => { tap(); setQuestionCount(n); }}
                >
                  <Text style={[styles.optionLabel, { color: questionCount === n ? C.text : C.textMuted }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time per question */}
          <View style={styles.section} ref={timeLimitTarget.ref} onLayout={timeLimitTarget.onLayout}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.timeLimitLabel}</Text>
            <View style={styles.timeLimitRow}>
              {TIME_LIMITS.map((tl) => (
                <TouchableOpacity
                  key={tl.value}
                  style={[styles.timeLimitBtn, { backgroundColor: C.surface, borderColor: C.border },
                    timeLimitMs === tl.value && { borderColor: FLAG_ACCENT, backgroundColor: 'rgba(15,118,110,0.15)' }]}
                  onPress={() => { tap(); setTimeLimitMs(tl.value); }}
                >
                  <Text style={[styles.timeLimitLabel, { color: timeLimitMs === tl.value ? C.text : C.textMuted }]}>
                    {tl.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Start — fixed footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: C.border }]}>
          <CreditsBadge family="flag" />
          <TouchableOpacity
            ref={startBtnTarget.ref}
            onLayout={startBtnTarget.onLayout}
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canStart ? [FLAG_ACCENT, FLAG_ACCENT_LIGHT] : ['#888', '#999']}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>{t.startFlagBattle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <HowToPlayModal
        visible={howToOpen}
        onClose={() => setHowToOpen(false)}
        title={t.howToPlayTitle}
        body={t.flagBattleHowTo}
      />

      <OutOfCreditsModal
        visible={outOfCreditsVisible}
        family="flag"
        onCancel={() => setOutOfCreditsVisible(false)}
        onGranted={() => { setOutOfCreditsVisible(false); proceedToGame(); }}
      />

      <TourOverlay scrollViewRef={scrollViewRef} scrollYRef={scrollYRef} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 40 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 70 },
  backText: { fontSize: 17, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center', flex: 1 },
  topRightIcons: { flexDirection: 'row', gap: 8 },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 10 },

  diffRow: { flexDirection: 'row', gap: 8 },
  diffBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  diffEmoji: { fontSize: 22 },
  diffLabel: { fontSize: 13, fontWeight: '800' },
  diffDesc: { fontSize: 10, textAlign: 'center', letterSpacing: 0.2 },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  timeLimitRow: { flexDirection: 'row', gap: 6 },
  timeLimitBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  timeLimitLabel: { fontSize: 13, fontWeight: '800' },
  optionLabel: { fontSize: 13, fontWeight: '700' },

  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  startBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: FLAG_ACCENT, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
