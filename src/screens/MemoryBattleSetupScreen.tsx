import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemoryBattleStore } from '../store/memoryBattleStore';
import { useColorMemoryBattleStore } from '../store/colorMemoryBattleStore';
import { COLOR_MEMORY_GRID_DIM_MIN, COLOR_MEMORY_GRID_DIM_MAX } from '../store/colorMemoryStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import InfoButton from '../components/InfoButton';
import HowToPlayModal from '../components/HowToPlayModal';
import PlayerNames from '../components/PlayerNames';
import TourButton from '../components/TourButton';
import TourOverlay from '../components/TourOverlay';
import { useTourStore } from '../store/tourStore';
import { useTourTarget } from '../hooks/useTourTarget';
import { isTourSeen } from '../utils/tourSeen';
import { screenTours } from '../content/screenTours';
import { loadLastSetup, saveLastSetup } from '../utils/lastSetup';
import type { RootStackParamList } from '../types';
import {
  MEMORY_GRID_DIM_MIN, MEMORY_GRID_DIM_MAX, MEMORY_STEPS_MIN, MEMORY_STEPS_MAX,
} from '../utils/memoryGenerator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MemoryBattleSetup'> };
type GameMode = 'flash' | 'color';

const LAST_SETUP_KEY = 'memory_battle';
const TOUR_ID = LAST_SETUP_KEY;
interface LastSetup {
  p1Name: string;
  p2Name: string;
  mode: GameMode;
  gridDim: number;
  steps: number;
  colorGridDim: number;
  questionCount: number;
  timeLimitMs: number;
}
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const MEMORY_PRIMARY = '#6366F1';
const CM_PRIMARY = '#F97316';
const QUESTION_COUNTS = [10, 15, 20];
const TIME_LIMITS = [
  { label: '5s',  value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
  { label: '20s', value: 20000 },
  { label: '30s', value: 30000 },
  { label: '∞',   value: 0 },
];

export default function MemoryBattleSetupScreen({ navigation }: Props) {
  const { setConfig: setFlashConfig } = useMemoryBattleStore();
  const { setConfig: setColorConfig } = useColorMemoryBattleStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
  const [howToOpen, setHowToOpen] = useState(false);

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
  const memoryModeTarget = useTourTarget(`${TOUR_ID}:memoryMode`);
  const memoryGridTarget = useTourTarget(`${TOUR_ID}:memoryGrid`);
  const memoryStepsTarget = useTourTarget(`${TOUR_ID}:memorySteps`);
  const questionsTarget = useTourTarget(`${TOUR_ID}:questions`);
  const timeLimitTarget = useTourTarget(`${TOUR_ID}:timeLimit`);
  const startBtnTarget = useTourTarget(`${TOUR_ID}:startBtn`);

  const [p1Name, setP1Name] = useState('Player A');
  const [p2Name, setP2Name] = useState('Player B');
  const [mode, setMode] = useState<GameMode>('flash');
  const [gridDim, setGridDim] = useState(4);
  const [steps, setSteps] = useState(3);
  const [colorGridDim, setColorGridDim] = useState(4);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMs, setTimeLimitMs] = useState(15000);

  const isColor = mode === 'color';
  const accentColor = isColor ? CM_PRIMARY : MEMORY_PRIMARY;
  const accentBg = isColor ? 'rgba(249,115,22,0.14)' : 'rgba(99,102,241,0.14)';

  const beginTour = () => {
    setHowToOpen(false);
    const entry = screenTours[TOUR_ID];
    const tourSteps = typeof entry === 'function' ? entry(mode) : entry;
    useTourStore.getState().startTour(TOUR_ID, tourSteps);
  };

  useEffect(() => {
    isTourSeen(TOUR_ID).then((seen) => {
      if (!seen) setTimeout(beginTour, 250);
    });
  }, []);

  // Re-resolve the running tour's step list if the user switches Flash <-> Color mid-tour.
  useEffect(() => {
    if (useTourStore.getState().activeTour === TOUR_ID) {
      const entry = screenTours[TOUR_ID];
      const resolved = typeof entry === 'function' ? entry(mode) : entry;
      useTourStore.getState().updateSteps(resolved);
    }
  }, [mode]);

  useEffect(() => {
    loadLastSetup<LastSetup>(LAST_SETUP_KEY).then((saved) => {
      if (!saved) return;
      if (saved.p1Name) setP1Name(saved.p1Name);
      if (saved.p2Name) setP2Name(saved.p2Name);
      if (saved.mode) setMode(saved.mode);
      if (saved.gridDim) setGridDim(clamp(saved.gridDim, MEMORY_GRID_DIM_MIN, MEMORY_GRID_DIM_MAX));
      if (saved.steps) setSteps(clamp(saved.steps, MEMORY_STEPS_MIN, MEMORY_STEPS_MAX));
      if (saved.colorGridDim) setColorGridDim(clamp(saved.colorGridDim, COLOR_MEMORY_GRID_DIM_MIN, COLOR_MEMORY_GRID_DIM_MAX));
      if (saved.questionCount) setQuestionCount(saved.questionCount);
      if (saved.timeLimitMs !== undefined) setTimeLimitMs(saved.timeLimitMs);
    });
  }, []);

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;
  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    saveLastSetup<LastSetup>(LAST_SETUP_KEY, {
      p1Name: p1Name.trim(), p2Name: p2Name.trim(), mode, gridDim, steps, colorGridDim, questionCount, timeLimitMs,
    });
    if (isColor) {
      setColorConfig({
        player1Name: p1Name.trim(),
        player2Name: p2Name.trim(),
        gridDim: colorGridDim,
        totalQuestions: questionCount,
        timeLimitMs,
      });
      navigation.navigate('ColorMemoryBattleGame');
    } else {
      setFlashConfig({
        player1Name: p1Name.trim(),
        player2Name: p2Name.trim(),
        gridDim,
        steps,
        totalQuestions: questionCount,
        timeLimitMs,
      });
      navigation.navigate('MemoryBattleGame');
    }
  };

  const startGradient: [string, string] = canStart
    ? isColor ? ['#F97316', '#FB923C'] : ['#6366F1', '#F72585']
    : ['#888', '#999'];

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={styles.topRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={[styles.title, { color: C.text }]}>{t.memoryBattleSetup}</Text>
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

          {/* Mode selector */}
          <View style={styles.section} ref={memoryModeTarget.ref} onLayout={memoryModeTarget.onLayout}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.memoryModeLabel}</Text>
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  { backgroundColor: C.surface, borderColor: C.border },
                  mode === 'flash' && { borderColor: MEMORY_PRIMARY, backgroundColor: 'rgba(99,102,241,0.14)' },
                ]}
                onPress={() => { tap(); setMode('flash'); }}
                activeOpacity={0.85}
              >
                <Text style={styles.modeEmoji}>🧠</Text>
                <Text style={[styles.modeBtnLabel, { color: mode === 'flash' ? C.text : C.textMuted }]}>
                  {t.memoryModeFlash}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeBtn,
                  { backgroundColor: C.surface, borderColor: C.border },
                  mode === 'color' && { borderColor: CM_PRIMARY, backgroundColor: 'rgba(249,115,22,0.14)' },
                ]}
                onPress={() => {
                  tap();
                  setMode('color');
                  // ∞ isn't a valid "time to memorize" — fall back if it was picked in Flash mode.
                  if (timeLimitMs <= 0) setTimeLimitMs(15000);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modeEmoji}>🎨</Text>
                <Text style={[styles.modeBtnLabel, { color: mode === 'color' ? C.text : C.textMuted }]}>
                  {t.memoryModeColor}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Difficulty */}
          {isColor ? (
            <View style={styles.section} ref={memoryGridTarget.ref} onLayout={memoryGridTarget.onLayout}>
              <View style={styles.sliderHeaderRow}>
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.memoryGridSizeLabel}</Text>
                <Text style={[styles.sliderValue, { color: accentColor }]}>{colorGridDim}×{colorGridDim}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={COLOR_MEMORY_GRID_DIM_MIN}
                maximumValue={COLOR_MEMORY_GRID_DIM_MAX}
                step={1}
                value={colorGridDim}
                minimumTrackTintColor={accentColor}
                maximumTrackTintColor={C.border}
                thumbTintColor={accentColor}
                onValueChange={(v) => { if (v !== colorGridDim) { Haptics.selectionAsync(); setColorGridDim(v); } }}
              />
            </View>
          ) : (
            <>
              <View style={styles.section} ref={memoryGridTarget.ref} onLayout={memoryGridTarget.onLayout}>
                <View style={styles.sliderHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.memoryGridSizeLabel}</Text>
                  <Text style={[styles.sliderValue, { color: accentColor }]}>{gridDim}×{gridDim}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={MEMORY_GRID_DIM_MIN}
                  maximumValue={MEMORY_GRID_DIM_MAX}
                  step={1}
                  value={gridDim}
                  minimumTrackTintColor={accentColor}
                  maximumTrackTintColor={C.border}
                  thumbTintColor={accentColor}
                  onValueChange={(v) => { if (v !== gridDim) { Haptics.selectionAsync(); setGridDim(v); } }}
                />
              </View>

              <View style={styles.section} ref={memoryStepsTarget.ref} onLayout={memoryStepsTarget.onLayout}>
                <View style={styles.sliderHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.memoryStepsLabel}</Text>
                  <Text style={[styles.sliderValue, { color: accentColor }]}>{steps}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={MEMORY_STEPS_MIN}
                  maximumValue={MEMORY_STEPS_MAX}
                  step={1}
                  value={steps}
                  minimumTrackTintColor={accentColor}
                  maximumTrackTintColor={C.border}
                  thumbTintColor={accentColor}
                  onValueChange={(v) => { if (v !== steps) { Haptics.selectionAsync(); setSteps(v); } }}
                />
              </View>
            </>
          )}

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
                    questionCount === n && { borderColor: accentColor, backgroundColor: accentBg },
                  ]}
                  onPress={() => { tap(); setQuestionCount(n); }}
                >
                  <Text style={[styles.optionLabel, { color: questionCount === n ? C.text : C.textMuted }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time per question — for Color Memory this is how long colors stay visible to memorize, so ∞ isn't offered */}
          <View style={styles.section} ref={timeLimitTarget.ref} onLayout={timeLimitTarget.onLayout}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>
              {isColor ? t.colorMemoryRevealTimeLabel : t.timeLimitLabel}
            </Text>
            <View style={styles.timeLimitRow}>
              {(isColor ? TIME_LIMITS.filter((tl) => tl.value > 0) : TIME_LIMITS).map((tl) => (
                <TouchableOpacity
                  key={tl.value}
                  style={[styles.timeLimitBtn, { backgroundColor: C.surface, borderColor: C.border },
                    timeLimitMs === tl.value && { borderColor: accentColor, backgroundColor: accentBg }]}
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
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12, borderTopColor: C.border }]}>
          <TouchableOpacity
            ref={startBtnTarget.ref}
            onLayout={startBtnTarget.onLayout}
            style={[styles.startBtn, !canStart && styles.startBtnDisabled, { shadowColor: accentColor }]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={startGradient}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>
                {isColor ? t.startColorMemoryPractice : t.startMemoryBattle}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <HowToPlayModal
        visible={howToOpen}
        onClose={() => setHowToOpen(false)}
        title={t.howToPlayTitle}
        body={isColor ? t.colorMemoryBattleHowTo : t.memoryFlashBattleHowTo}
        accentColor={accentColor}
      />

      <TourOverlay scrollViewRef={scrollViewRef} scrollYRef={scrollYRef} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 8 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 70 },
  backText: { fontSize: 17, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center', flex: 1 },
  topRightIcons: { flexDirection: 'row', gap: 8 },

  section: { marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 8 },

  sliderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sliderValue: { fontSize: 15, fontWeight: '800' },
  slider: { width: '100%', height: 36 },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 3 },
  modeEmoji: { fontSize: 24 },
  modeBtnLabel: { fontSize: 13, fontWeight: '800' },
  modeBtnHint: { fontSize: 10, fontWeight: '500' },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  timeLimitRow: { flexDirection: 'row', gap: 6 },
  timeLimitBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  timeLimitLabel: { fontSize: 13, fontWeight: '800' },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffBtn: { flex: 0, width: '23%', paddingVertical: 10, paddingHorizontal: 2 },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  optionHint: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  footer: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  startBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 16, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
