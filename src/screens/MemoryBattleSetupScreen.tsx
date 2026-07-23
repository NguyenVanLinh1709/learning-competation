import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemoryBattleStore } from '../store/memoryBattleStore';
import { useColorMemoryBattleStore } from '../store/colorMemoryBattleStore';
import type { ColorMemoryDifficulty } from '../store/colorMemoryStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import InfoButton from '../components/InfoButton';
import HowToPlayModal from '../components/HowToPlayModal';
import PlayerNames from '../components/PlayerNames';
import type { RootStackParamList } from '../types';
import type { MemoryDifficulty } from '../utils/memoryGenerator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MemoryBattleSetup'> };
type GameMode = 'flash' | 'color';

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

const FLASH_DIFFICULTIES: { label: string; value: MemoryDifficulty; emoji: string; hint: string }[] = [
  { label: 'Easy',        value: 'easy',        emoji: '🟢', hint: '4 tiles' },
  { label: 'Medium',      value: 'medium',      emoji: '🟡', hint: '4 · longer' },
  { label: 'Hard',        value: 'hard',        emoji: '🟠', hint: '9 tiles' },
  { label: 'Expert',      value: 'expert',      emoji: '🔴', hint: '9 · fast' },
  { label: 'Master',      value: 'master',      emoji: '🟣', hint: '16 tiles' },
  { label: 'Grandmaster', value: 'grandmaster', emoji: '⚫', hint: '16 · faster' },
  { label: 'Legendary',   value: 'legendary',   emoji: '👑', hint: '25 tiles' },
  { label: 'Insane',      value: 'insane',      emoji: '💀', hint: '25 · blitz' },
];

const COLOR_DIFFICULTIES: { label: string; value: ColorMemoryDifficulty; emoji: string; hint: string }[] = [
  { label: 'Easy',        value: 'easy',        emoji: '🟢', hint: '3 colors' },
  { label: 'Medium',      value: 'medium',      emoji: '🟡', hint: '4 colors' },
  { label: 'Hard',        value: 'hard',        emoji: '🟠', hint: '6 colors' },
  { label: 'Expert',      value: 'expert',      emoji: '🔴', hint: '8 colors' },
  { label: 'Master',      value: 'master',      emoji: '🟣', hint: '10 colors' },
  { label: 'Grandmaster', value: 'grandmaster', emoji: '⚫', hint: '12 colors' },
  { label: 'Legendary',   value: 'legendary',   emoji: '👑', hint: '14 colors' },
  { label: 'Insane',      value: 'insane',      emoji: '💀', hint: '16 colors' },
];

export default function MemoryBattleSetupScreen({ navigation }: Props) {
  const { setConfig: setFlashConfig } = useMemoryBattleStore();
  const { setConfig: setColorConfig } = useColorMemoryBattleStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
  const [howToOpen, setHowToOpen] = useState(false);

  const [p1Name, setP1Name] = useState('Player A');
  const [p2Name, setP2Name] = useState('Player B');
  const [mode, setMode] = useState<GameMode>('flash');
  const [flashDifficulty, setFlashDifficulty] = useState<MemoryDifficulty>('easy');
  const [colorDifficulty, setColorDifficulty] = useState<ColorMemoryDifficulty>('easy');
  const [questionCount, setQuestionCount] = useState(10);
  const [timeLimitMs, setTimeLimitMs] = useState(15000);

  const isColor = mode === 'color';
  const accentColor = isColor ? CM_PRIMARY : MEMORY_PRIMARY;
  const accentBg = isColor ? 'rgba(249,115,22,0.14)' : 'rgba(99,102,241,0.14)';

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;
  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isColor) {
      setColorConfig({
        player1Name: p1Name.trim(),
        player2Name: p2Name.trim(),
        difficulty: colorDifficulty,
        totalQuestions: questionCount,
      });
      navigation.navigate('ColorMemoryBattleGame');
    } else {
      setFlashConfig({
        player1Name: p1Name.trim(),
        player2Name: p2Name.trim(),
        difficulty: flashDifficulty,
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
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={[styles.title, { color: C.text }]}>{t.memoryBattleSetup}</Text>
            <InfoButton onPress={() => setHowToOpen(true)} />
          </View>

          {/* Player names */}
          <PlayerNames p1Name={p1Name} p2Name={p2Name} setP1Name={setP1Name} setP2Name={setP2Name} />

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
                onPress={() => { tap(); setMode('color'); }}
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
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.difficultyLabel}</Text>
            <View style={styles.diffGrid}>
              {(isColor ? COLOR_DIFFICULTIES : FLASH_DIFFICULTIES).map((d) => {
                const active = isColor ? colorDifficulty === d.value : flashDifficulty === d.value;
                return (
                  <TouchableOpacity
                    key={d.value}
                    style={[
                      styles.optionBtn,
                      styles.diffBtn,
                      { backgroundColor: C.surface, borderColor: C.border },
                      active && { borderColor: accentColor, backgroundColor: accentBg },
                    ]}
                    onPress={() => {
                      tap();
                      if (isColor) setColorDifficulty(d.value as ColorMemoryDifficulty);
                      else setFlashDifficulty(d.value as MemoryDifficulty);
                    }}
                  >
                    <Text style={styles.optionEmoji}>{d.emoji}</Text>
                    <Text style={[styles.optionLabel, { color: active ? C.text : C.textMuted }]}>{d.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

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

          {/* Time per question */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.timeLimitLabel}</Text>
            <View style={styles.timeLimitRow}>
              {TIME_LIMITS.map((tl) => (
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

          {/* Start */}
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
                {isColor ? t.startColorMemoryPractice : t.startMemoryBattle}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <HowToPlayModal
        visible={howToOpen}
        onClose={() => setHowToOpen(false)}
        title={t.howToPlayTitle}
        body={isColor ? t.colorMemoryBattleHowTo : t.memoryFlashBattleHowTo}
        accentColor={accentColor}
      />
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


  section: { marginBottom: 20, marginTop: 10 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 10 },

  modeRow: { flexDirection: 'row', gap: 10 },
  modeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 3 },
  modeEmoji: { fontSize: 24 },
  modeBtnLabel: { fontSize: 13, fontWeight: '800' },
  modeBtnHint: { fontSize: 10, fontWeight: '500' },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 2 },
  timeLimitRow: { flexDirection: 'row', gap: 6 },
  timeLimitBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  timeLimitLabel: { fontSize: 13, fontWeight: '800' },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffBtn: { flex: 0, width: '23%', paddingVertical: 10, paddingHorizontal: 2 },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  optionHint: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  startBtn: {
    borderRadius: 18, overflow: 'hidden', marginTop: 8,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
