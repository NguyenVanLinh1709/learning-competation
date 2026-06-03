import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/gameStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { DifficultyLevel, MathOperation, RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Setup'> };

const QUESTION_COUNTS = [10, 20, 30];

export default function SetupScreen({ navigation }: Props) {
  const { setConfig } = useGameStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const [p1Name, setP1Name] = useState('Player A');
  const [p2Name, setP2Name] = useState('Player B');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [operation, setOperation] = useState<MathOperation>('mixed');
  const [questionCount, setQuestionCount] = useState(20);

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
  ];

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfig({ player1Name: p1Name.trim(), player2Name: p2Name.trim(), difficulty, operation, totalQuestions: questionCount, timeLimitMs: 15000 });
    navigation.navigate('Countdown');
  };

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: C.textMuted }]}>{t.back}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: C.text }]}>{t.battleSetup}</Text>
            <View style={{ width: 70 }} />
          </View>

          {/* Player 2 */}
          <View style={styles.playerSection}>
            <View style={[styles.playerTag, { backgroundColor: C.p2Primary }]}>
              <Text style={styles.playerTagText}>{t.player2Tag}</Text>
            </View>
            <TextInput
              style={[styles.input, { borderColor: C.p2Primary, backgroundColor: C.surface, color: C.text }]}
              placeholder={t.enterName}
              placeholderTextColor={C.textMuted}
              value={p2Name}
              onChangeText={setP2Name}
              maxLength={16}
              returnKeyType="next"
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
            <Text style={[styles.dividerText, { color: C.textMuted }]}>{t.vs}</Text>
            <View style={[styles.dividerLine, { backgroundColor: C.border }]} />
          </View>

          {/* Player 1 */}
          <View style={styles.playerSection}>
            <View style={[styles.playerTag, { backgroundColor: C.p1Primary }]}>
              <Text style={styles.playerTagText}>{t.player1Tag}</Text>
            </View>
            <TextInput
              style={[styles.input, { borderColor: C.p1Primary, backgroundColor: C.surface, color: C.text }]}
              placeholder={t.enterName}
              placeholderTextColor={C.textMuted}
              value={p1Name}
              onChangeText={setP1Name}
              maxLength={16}
              returnKeyType="done"
            />
          </View>

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
                  <Text style={[styles.optionLabel, { color: difficulty === d.value ? C.text : C.textMuted }]}>
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
                  <Text style={[styles.optionLabel, { color: operation === m.value ? C.text : C.textMuted }]}>
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

          {/* Start button */}
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

        </ScrollView>
      </KeyboardAvoidingView>
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

  playerSection: { marginBottom: 10 },
  playerTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  playerTagText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  input: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 17, fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },

  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 },
  optionBtnSmall: { paddingVertical: 14 },
  optionEmoji: { fontSize: 18 },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  opLabel: { fontSize: 18 },

  startBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 8, shadowColor: '#4361EE', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
