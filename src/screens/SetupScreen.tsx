import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/gameStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import InfoButton from '../components/InfoButton';
import HowToPlayModal from '../components/HowToPlayModal';
import PlayerNames from '../components/PlayerNames';
import { loadLastSetup, saveLastSetup } from '../utils/lastSetup';
import type { DifficultyLevel, MathOperation, RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Setup'> };

const LAST_SETUP_KEY = 'math_battle';
interface LastSetup {
  p1Name: string;
  p2Name: string;
  difficulty: DifficultyLevel;
  operation: MathOperation;
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

export default function SetupScreen({ navigation }: Props) {
  const { setConfig } = useGameStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
  const [howToOpen, setHowToOpen] = useState(false);

  const [p1Name, setP1Name] = useState('Player A');
  const [p2Name, setP2Name] = useState('Player B');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [operation, setOperation] = useState<MathOperation>('mixed');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimitMs, setTimeLimitMs] = useState(15000);

  useEffect(() => {
    loadLastSetup<LastSetup>(LAST_SETUP_KEY).then((saved) => {
      if (!saved) return;
      if (saved.p1Name) setP1Name(saved.p1Name);
      if (saved.p2Name) setP2Name(saved.p2Name);
      if (saved.difficulty) setDifficulty(saved.difficulty);
      if (saved.operation) setOperation(saved.operation);
      if (saved.questionCount) setQuestionCount(saved.questionCount);
      if (saved.timeLimitMs !== undefined) setTimeLimitMs(saved.timeLimitMs);
    });
  }, []);

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;

  const difficulties = [
    { label: t.easy,   value: 'easy'   as DifficultyLevel, emoji: '🌱' },
    { label: t.medium, value: 'medium' as DifficultyLevel, emoji: '🔥' },
    { label: t.hard,   value: 'hard'   as DifficultyLevel, emoji: '💀' },
  ];

  const operations = [
    { label: '+',       value: 'addition'       as MathOperation },
    { label: '−',       value: 'subtraction'    as MathOperation },
    { label: '×',       value: 'multiplication' as MathOperation },
    { label: '÷',       value: 'division'       as MathOperation },
    { label: t.mixedOp, value: 'mixed'          as MathOperation },
  ];

  const modes = [
    { emoji: '📏', label: t.convertOp,  value: 'conversion' as MathOperation },
    { emoji: '½',  label: t.fractionOp, value: 'fraction'   as MathOperation },
    { emoji: '🔢', label: t.sequenceOp, value: 'sequence'   as MathOperation },
    { emoji: '🧮', label: t.countOp,    value: 'count'      as MathOperation },
    { emoji: '⚖️', label: t.comparisonOp, value: 'comparison' as MathOperation },
  ];

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfig({ player1Name: p1Name.trim(), player2Name: p2Name.trim(), difficulty, operation, totalQuestions: questionCount, timeLimitMs });
    saveLastSetup<LastSetup>(LAST_SETUP_KEY, {
      p1Name: p1Name.trim(), p2Name: p2Name.trim(), difficulty, operation, questionCount, timeLimitMs,
    });
    navigation.navigate('Countdown');
  };

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.topRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={[styles.title, { color: C.text }]}>{t.battleSetup}</Text>
            <InfoButton onPress={() => setHowToOpen(true)} />
          </View>

          {/* Player names */}
          <PlayerNames p1Name={p1Name} p2Name={p2Name} setP1Name={setP1Name} setP2Name={setP2Name} />

          {/* Difficulty */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.difficultyLabel}</Text>
            <View style={styles.optionRow}>
              {difficulties.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[styles.optionBtn, { backgroundColor: C.surface, borderColor: C.border },
                    difficulty === d.value && { borderColor: C.p1Primary, backgroundColor: 'rgba(67,97,238,0.15)' }]}
                  onPress={() => { tap(); setDifficulty(d.value); }}
                >
                  <Text style={styles.optionEmoji}>{d.emoji}</Text>
                  <Text
                    style={[styles.optionLabel, { color: difficulty === d.value ? C.text : C.textMuted }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {d.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Operations */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.operationLabel}</Text>
            <View style={styles.optionRow}>
              {operations.map((op) => (
                <TouchableOpacity
                  key={op.value}
                  style={[styles.optionBtn, styles.optionBtnSmall, { backgroundColor: C.surface, borderColor: C.border },
                    operation === op.value && { borderColor: C.p1Primary, backgroundColor: 'rgba(67,97,238,0.15)' }]}
                  onPress={() => { tap(); setOperation(op.value); }}
                >
                  <Text style={[styles.optionLabel, styles.opLabel, { color: operation === op.value ? C.text : C.textMuted }]}>
                    {op.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.optionRow, { marginTop: 8 }]}>
              {modes.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.optionBtn, { backgroundColor: C.surface, borderColor: C.border },
                    operation === m.value && { borderColor: C.p1Primary, backgroundColor: 'rgba(67,97,238,0.15)' }]}
                  onPress={() => { tap(); setOperation(m.value); }}
                >
                  <Text style={styles.optionEmoji}>{m.emoji}</Text>
                  <Text
                    style={[styles.optionLabel, { color: operation === m.value ? C.text : C.textMuted }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.75}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Question count */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.questionsLabel}</Text>
            <View style={styles.optionRow}>
              {QUESTION_COUNTS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.optionBtn, { backgroundColor: C.surface, borderColor: C.border },
                    questionCount === n && { borderColor: C.p1Primary, backgroundColor: 'rgba(67,97,238,0.15)' }]}
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
                    timeLimitMs === tl.value && { borderColor: C.p1Primary, backgroundColor: 'rgba(67,97,238,0.15)' }]}
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

        {/* Start button — fixed footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: C.border }]}>
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canStart ? ['#4361EE', '#F72585'] : ['#888', '#999']}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>{t.startBattle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <HowToPlayModal
        visible={howToOpen}
        onClose={() => setHowToOpen(false)}
        title={t.howToPlayTitle}
        body={t.mathBattleHowTo}
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


  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 },
  optionBtnSmall: { paddingVertical: 14 },
  optionEmoji: { fontSize: 18 },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  opLabel: { fontSize: 18 },

  timeLimitRow: { flexDirection: 'row', gap: 6 },
  timeLimitBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  timeLimitLabel: { fontSize: 13, fontWeight: '800' },

  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  startBtn: { borderRadius: 18, overflow: 'hidden', shadowColor: '#4361EE', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
