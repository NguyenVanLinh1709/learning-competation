import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFlagBattleStore } from '../store/flagBattleStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { DifficultyLevel, RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FlagBattleSetup'> };

const QUESTION_COUNTS = [10, 20, 30];
const FLAG_ACCENT = '#0F766E';
const FLAG_ACCENT_LIGHT = '#14B8A6';

export default function FlagBattleSetupScreen({ navigation }: Props) {
  const { setConfig } = useFlagBattleStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const [p1Name, setP1Name] = useState('Player A');
  const [p2Name, setP2Name] = useState('Player B');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [questionCount, setQuestionCount] = useState(20);

  const canStart = p1Name.trim().length > 0 && p2Name.trim().length > 0;

  const difficulties: { label: string; desc: string; value: DifficultyLevel; emoji: string }[] = [
    { label: t.easy,   desc: '20 well-known nations',     value: 'easy',   emoji: '🌱' },
    { label: t.medium, desc: '40 nations',                value: 'medium', emoji: '🔥' },
    { label: t.hard,   desc: '60+ nations worldwide',     value: 'hard',   emoji: '💀' },
  ];

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setConfig({
      player1Name: p1Name.trim(),
      player2Name: p2Name.trim(),
      difficulty,
      totalQuestions: questionCount,
      timeLimitMs: 15000,
    });
    navigation.navigate('FlagBattleGame');
  };

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={[styles.backText, { color: C.textMuted }]}>{t.back}</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: C.text }]}>{t.flagBattleSetup}</Text>
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
                    <Text style={[styles.diffDesc, { color: C.textMuted }]} numberOfLines={2}>{d.desc}</Text>
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
                    questionCount === n && { borderColor: FLAG_ACCENT, backgroundColor: 'rgba(15,118,110,0.15)' },
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
              colors={canStart ? [FLAG_ACCENT, FLAG_ACCENT_LIGHT] : ['#888', '#999']}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>{t.startFlagBattle}</Text>
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

  diffRow: { flexDirection: 'row', gap: 8 },
  diffBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  diffEmoji: { fontSize: 22 },
  diffLabel: { fontSize: 13, fontWeight: '800' },
  diffDesc: { fontSize: 10, textAlign: 'center', letterSpacing: 0.2 },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  optionLabel: { fontSize: 13, fontWeight: '700' },

  startBtn: {
    borderRadius: 18, overflow: 'hidden', marginTop: 8,
    shadowColor: FLAG_ACCENT, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 14, elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
