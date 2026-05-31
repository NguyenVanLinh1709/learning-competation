import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorBattleStore } from '../store/colorBattleStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../types';
import type { ColorDifficulty } from '../utils/colorPerceptionGenerator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ColorBattleSetup'> };

const QUESTION_COUNTS = [10, 20, 30];
const DIFFICULTIES: { label: string; value: ColorDifficulty; emoji: string; hint: string }[] = [
  { label: 'Easy',   value: 'easy',   emoji: '🌈', hint: 'Obvious' },
  { label: 'Medium', value: 'medium', emoji: '🔮', hint: 'Subtle' },
  { label: 'Hard',   value: 'hard',   emoji: '🧠', hint: 'Very subtle' },
  { label: 'Expert', value: 'expert', emoji: '🎯', hint: 'Barely there' },
];
const TIME_LIMITS_MS = 15000;

export default function ColorBattleSetupScreen({ navigation }: Props) {
  const { setConfig } = useColorBattleStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const [p1Name, setP1Name] = useState('Player A');
  const [p2Name, setP2Name] = useState('Player B');
  const [difficulty, setDifficulty] = useState<ColorDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState(10);

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;
  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfig({
      player1Name: p1Name.trim(),
      player2Name: p2Name.trim(),
      difficulty,
      totalQuestions: questionCount,
      timeLimitMs: TIME_LIMITS_MS,
    });
    navigation.navigate('ColorBattleGame');
  };

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: C.textMuted }]}>{t.back}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: C.text }]}>{t.colorBattleSetup}</Text>
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
            <View style={styles.diffGrid}>
              {DIFFICULTIES.map((d) => (
                <TouchableOpacity
                  key={d.value}
                  style={[
                    styles.optionBtn,
                    styles.diffBtn,
                    { backgroundColor: C.surface, borderColor: C.border },
                    difficulty === d.value && { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.12)' },
                  ]}
                  onPress={() => { tap(); setDifficulty(d.value); }}
                >
                  <Text style={styles.optionEmoji}>{d.emoji}</Text>
                  <Text style={[styles.optionLabel, { color: difficulty === d.value ? C.text : C.textMuted }]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.optionHint, { color: C.textMuted }]}>{d.hint}</Text>
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
                  style={[
                    styles.optionBtn,
                    { backgroundColor: C.surface, borderColor: C.border },
                    questionCount === n && { borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.12)' },
                  ]}
                  onPress={() => { tap(); setQuestionCount(n); }}
                >
                  <Text style={[styles.optionLabel, { color: questionCount === n ? C.text : C.textMuted }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start */}
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canStart ? ['#7C3AED', '#F72585'] : ['#888', '#999']}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>{t.startColorBattle}</Text>
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
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 2 },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffBtn: { flex: 0, width: '23%', paddingVertical: 10, paddingHorizontal: 2 },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  optionHint: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  startBtn: {
    borderRadius: 18, overflow: 'hidden', marginTop: 8,
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
