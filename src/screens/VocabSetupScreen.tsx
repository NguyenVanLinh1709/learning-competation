import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVocabStore } from '../store/vocabStore';
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
import type { RootStackParamList, VocabDifficulty, VocabMode } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'VocabSetup'> };

const LAST_SETUP_KEY = 'vocab_battle';
const TOUR_ID = LAST_SETUP_KEY;
interface LastSetup {
  p1Name: string;
  p2Name: string;
  vocabMode: VocabMode;
  difficulty: VocabDifficulty;
  questionCount: number;
  timeLimitMs: number;
}

const QUESTION_COUNTS = [10, 20, 30];

const TIME_LIMITS = [
  { label: '5s',  value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
  { label: '20s', value: 20000 },
  { label: '30s', value: 30000 },
  { label: '∞',   value: 0 },
];

export default function VocabSetupScreen({ navigation }: Props) {
  const { setConfig } = useVocabStore();
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
  const vocabModeTarget = useTourTarget(`${TOUR_ID}:vocabMode`);
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
  const [vocabMode, setVocabMode] = useState<VocabMode>('vocab');
  const [difficulty, setDifficulty] = useState<VocabDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimitMs, setTimeLimitMs] = useState(15000);

  useEffect(() => {
    loadLastSetup<LastSetup>(LAST_SETUP_KEY).then((saved) => {
      if (!saved) return;
      if (saved.p1Name) setP1Name(saved.p1Name);
      if (saved.p2Name) setP2Name(saved.p2Name);
      if (saved.vocabMode) setVocabMode(saved.vocabMode);
      if (saved.difficulty) setDifficulty(saved.difficulty);
      if (saved.questionCount) setQuestionCount(saved.questionCount);
      if (saved.timeLimitMs !== undefined) setTimeLimitMs(saved.timeLimitMs);
    });
  }, []);

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;

  const difficulties: { label: string; value: VocabDifficulty; emoji: string }[] = [
    { label: t.vocabEasy,   value: 'easy',   emoji: '🌱' },
    { label: t.vocabMedium, value: 'medium', emoji: '🔥' },
    { label: t.vocabHard,   value: 'hard',   emoji: '💀' },
    { label: t.vocabExpert, value: 'expert', emoji: '🧠' },
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
      vocabMode,
    });
    saveLastSetup<LastSetup>(LAST_SETUP_KEY, {
      p1Name: p1Name.trim(), p2Name: p2Name.trim(), vocabMode, difficulty, questionCount, timeLimitMs,
    });
    navigation.navigate('VocabCountdown');
  };

  const handleStart = () => {
    if (!canStart) return;
    if (useCreditsStore.getState().consumeCredit('vocab')) {
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
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >

          {/* Header */}
          <View style={styles.topRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={[styles.title, { color: C.text }]}>{t.vocabSetup}</Text>
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

          {/* Mode */}
          <View style={styles.section} ref={vocabModeTarget.ref} onLayout={vocabModeTarget.onLayout}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.vocabModeLabel}</Text>
            <View style={styles.modeRow}>
              {([
                { value: 'vocab' as VocabMode, label: t.vocabModeVocab, emoji: '📖' },
                { value: 'odd_one_out' as VocabMode, label: t.vocabModeOddOneOut, emoji: '🔍' },
              ]).map((m) => {
                const selected = vocabMode === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[
                      styles.modeBtn,
                      { backgroundColor: C.surface, borderColor: C.border },
                      selected && { borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.15)' },
                    ]}
                    onPress={() => { tap(); setVocabMode(m.value); }}
                  >
                    <Text style={styles.modeEmoji}>{m.emoji}</Text>
                    <Text style={[styles.modeLabel, { color: selected ? C.text : C.textMuted }]}>{m.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Difficulty */}
          <View style={styles.section} ref={difficultyTarget.ref} onLayout={difficultyTarget.onLayout}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.vocabDifficultyLabel}</Text>
            <View style={styles.diffGrid}>
              {difficulties.map((d) => {
                const selected = difficulty === d.value;
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[
                      styles.diffBtn,
                      { backgroundColor: C.surface, borderColor: C.border },
                      selected && { borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.15)' },
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
                    questionCount === n && { borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.15)' },
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
                    timeLimitMs === tl.value && { borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.15)' }]}
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
        <View style={[styles.footer, { paddingBottom: insets.bottom + 10, borderTopColor: C.border }]}>
          <CreditsBadge family="vocab" />
          <TouchableOpacity
            ref={startBtnTarget.ref}
            onLayout={startBtnTarget.onLayout}
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canStart ? ['#059669', '#10B981'] : ['#888', '#999']}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>{t.startVocabBattle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <HowToPlayModal
        visible={howToOpen}
        onClose={() => setHowToOpen(false)}
        title={t.howToPlayTitle}
        body={t.vocabBattleHowTo}
      />

      <OutOfCreditsModal
        visible={outOfCreditsVisible}
        family="vocab"
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
  scroll: { padding: 16, paddingTop: Platform.OS === 'ios' ? 44 : 28, paddingBottom: 24 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { width: 70 },
  backText: { fontSize: 17, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center', flex: 1 },
  topRightIcons: { flexDirection: 'row', gap: 8 },

  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 6 },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center', gap: 3 },
  modeEmoji: { fontSize: 22 },
  modeLabel: { fontSize: 14, fontWeight: '800' },

  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffBtn: { width: '48%', borderWidth: 1.5, borderRadius: 14, padding: 10, alignItems: 'center', gap: 3 },
  diffEmoji: { fontSize: 22 },
  diffLabel: { fontSize: 14, fontWeight: '800' },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  timeLimitRow: { flexDirection: 'row', gap: 6 },
  timeLimitBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  timeLimitLabel: { fontSize: 13, fontWeight: '800' },
  optionLabel: { fontSize: 13, fontWeight: '700' },

  footer: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  startBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#059669', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 14, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
