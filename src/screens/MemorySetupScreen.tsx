import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemoryStore } from '../store/memoryStore';
import { useColorMemoryStore, COLOR_MEMORY_GRID_DIM_MIN, COLOR_MEMORY_GRID_DIM_MAX } from '../store/colorMemoryStore';
import { useProfileStore } from '../store/profileStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import InfoButton from '../components/InfoButton';
import HowToPlayModal from '../components/HowToPlayModal';
import { loadLastSetup, saveLastSetup } from '../utils/lastSetup';
import type { RootStackParamList } from '../types';
import {
  MEMORY_GRID_DIM_MIN, MEMORY_GRID_DIM_MAX, MEMORY_STEPS_MIN, MEMORY_STEPS_MAX,
} from '../utils/memoryGenerator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MemorySetup'> };
type GameMode = 'flash' | 'color';

const LAST_SETUP_KEY = 'memory_solo';
interface LastSetup {
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
  { label: '8s',  value: 8000 },
  { label: '12s', value: 12000 },
  { label: '15s', value: 15000 },
  { label: '20s', value: 20000 },
  { label: '∞',   value: 0 },
];

export default function MemorySetupScreen({ navigation }: Props) {
  const { setConfig: setFlashConfig } = useMemoryStore();
  const { setConfig: setColorConfig } = useColorMemoryStore();
  const { displayName, setDisplayName } = useProfileStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
  const [howToOpen, setHowToOpen] = useState(false);

  const [playerName, setPlayerName] = useState(displayName);
  useEffect(() => { if (displayName) setPlayerName(displayName); }, [displayName]);
  const [mode, setMode] = useState<GameMode>('flash');
  const [gridDim, setGridDim] = useState(4);
  const [steps, setSteps] = useState(3);
  const [colorGridDim, setColorGridDim] = useState(4);
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMs, setTimeLimitMs] = useState(12000);

  const isColor = mode === 'color';
  const accentColor = isColor ? CM_PRIMARY : MEMORY_PRIMARY;
  const accentBg = isColor ? 'rgba(249,115,22,0.14)' : 'rgba(99,102,241,0.14)';

  useEffect(() => {
    loadLastSetup<LastSetup>(LAST_SETUP_KEY).then((saved) => {
      if (!saved) return;
      if (saved.mode) setMode(saved.mode);
      if (saved.gridDim) setGridDim(clamp(saved.gridDim, MEMORY_GRID_DIM_MIN, MEMORY_GRID_DIM_MAX));
      if (saved.steps) setSteps(clamp(saved.steps, MEMORY_STEPS_MIN, MEMORY_STEPS_MAX));
      if (saved.colorGridDim) setColorGridDim(clamp(saved.colorGridDim, COLOR_MEMORY_GRID_DIM_MIN, COLOR_MEMORY_GRID_DIM_MAX));
      if (saved.questionCount) setQuestionCount(saved.questionCount);
      if (saved.timeLimitMs !== undefined) setTimeLimitMs(saved.timeLimitMs);
    });
  }, []);

  const canStart = playerName.trim().length > 0;
  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDisplayName(playerName.trim());
    saveLastSetup<LastSetup>(LAST_SETUP_KEY, { mode, gridDim, steps, colorGridDim, questionCount, timeLimitMs });
    if (isColor) {
      setColorConfig({ playerName: playerName.trim(), gridDim: colorGridDim, totalQuestions: questionCount, timeLimitMs });
      navigation.navigate('ColorMemoryGame');
    } else {
      setFlashConfig({ playerName: playerName.trim(), gridDim, steps, totalQuestions: questionCount, timeLimitMs });
      navigation.navigate('MemoryGame');
    }
  };

  const startGradient: [string, string] = canStart
    ? isColor ? ['#F97316', '#FB923C'] : ['#6366F1', '#818CF8']
    : ['#888', '#999'];

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: C.text }]}>{t.memorySetup}</Text>
              <Text style={[styles.tagline, { color: C.textMuted }]}>{t.memoryTagline}</Text>
            </View>
            <InfoButton onPress={() => setHowToOpen(true)} />
          </View>

          {/* Player name */}
          <View style={styles.section}>
            <View style={[styles.playerTag, { backgroundColor: accentColor }]}>
              <Text style={styles.playerTagText}>{t.yourName}</Text>
            </View>
            <TextInput
              style={[styles.input, { borderColor: accentColor, backgroundColor: C.surface, color: C.text }]}
              placeholder={t.enterName}
              placeholderTextColor={C.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={16}
              returnKeyType="done"
            />
          </View>

          {/* Mode selector */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>MODE</Text>
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
                  Memory Flash
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
                  if (timeLimitMs <= 0) setTimeLimitMs(12000);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.modeEmoji}>🎨</Text>
                <Text style={[styles.modeBtnLabel, { color: mode === 'color' ? C.text : C.textMuted }]}>
                  Color Memory
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Difficulty */}
          {isColor ? (
            <View style={styles.section}>
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
              <View style={styles.section}>
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

              <View style={styles.section}>
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
          <View style={styles.section}>
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
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>
              {isColor ? t.colorMemoryRevealTimeLabel : t.timeLimitLabel}
            </Text>
            <View style={styles.timeLimitRow}>
              {(isColor ? TIME_LIMITS.filter((tl) => tl.value > 0) : TIME_LIMITS).map((tl) => (
                <TouchableOpacity
                  key={tl.value}
                  style={[
                    styles.timeLimitBtn,
                    { backgroundColor: C.surface, borderColor: C.border },
                    timeLimitMs === tl.value && { borderColor: accentColor, backgroundColor: accentBg },
                  ]}
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
                {isColor ? t.startColorMemoryPractice : t.startMemoryPractice}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <HowToPlayModal
        visible={howToOpen}
        onClose={() => setHowToOpen(false)}
        title={t.howToPlayTitle}
        body={isColor ? t.colorMemorySoloHowTo : t.memoryFlashSoloHowTo}
        accentColor={accentColor}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 8 },

  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 },
  backBtn: { width: 70, paddingTop: 2 },
  backText: { fontSize: 17, fontWeight: '600' },
  titleBlock: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  tagline: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', marginTop: 4 },

  section: { marginBottom: 14 },
  playerTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 6 },
  playerTagText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  input: { borderWidth: 1.5, borderRadius: 14, padding: 12, fontSize: 17, fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 8 },

  sliderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  sliderValue: { fontSize: 15, fontWeight: '800' },
  slider: { width: '100%', height: 36 },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 10, alignItems: 'center', gap: 3 },
  modeEmoji: { fontSize: 24 },
  modeBtnLabel: { fontSize: 13, fontWeight: '800' },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, alignItems: 'center', gap: 2 },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffBtn: { flex: 0, width: '23%', paddingVertical: 10, paddingHorizontal: 2 },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  optionHint: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  timeLimitRow: { flexDirection: 'row', gap: 6 },
  timeLimitBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  timeLimitLabel: { fontSize: 13, fontWeight: '800' },

  footer: { paddingHorizontal: 20, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  startBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 16, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
