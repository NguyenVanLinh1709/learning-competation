import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVocabSoloStore } from '../store/vocabSoloStore';
import { useProfileStore } from '../store/profileStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import type { RootStackParamList, VocabDifficulty, VocabMode } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'VocabSoloSetup'> };

const QUESTION_COUNTS = [10, 20, 30];

const TIME_LIMITS = [
  { label: '5s',  value: 5000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
  { label: '20s', value: 20000 },
  { label: '30s', value: 30000 },
  { label: '∞',   value: 0 },
];

const ACCENT = '#059669';

export default function VocabSoloSetupScreen({ navigation }: Props) {
  const { setConfig } = useVocabSoloStore();
  const { displayName, setDisplayName } = useProfileStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const [playerName, setPlayerName] = useState(displayName || 'Player');
  // Sync once the persisted profile name finishes loading.
  useEffect(() => { if (displayName) setPlayerName(displayName); }, [displayName]);
  const [vocabMode, setVocabMode] = useState<VocabMode>('vocab');
  const [difficulty, setDifficulty] = useState<VocabDifficulty>('medium');
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimitMs, setTimeLimitMs] = useState(15000);

  const canStart = playerName.trim().length > 0;

  const difficulties: { label: string; desc: string; value: VocabDifficulty; emoji: string }[] = [
    { label: t.vocabEasy,   desc: t.vocabEasyDesc,   value: 'easy',   emoji: '🌱' },
    { label: t.vocabMedium, desc: t.vocabMediumDesc, value: 'medium', emoji: '🔥' },
    { label: t.vocabHard,   desc: t.vocabHardDesc,   value: 'hard',   emoji: '💀' },
    { label: t.vocabExpert, desc: t.vocabExpertDesc, value: 'expert', emoji: '🧠' },
  ];

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDisplayName(playerName.trim());
    setConfig({ playerName: playerName.trim(), difficulty, totalQuestions: questionCount, timeLimitMs, vocabMode });
    navigation.navigate('VocabSoloGame');
  };

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.topRow}>
            <BackButton onPress={() => navigation.goBack()} />
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: C.text }]}>{t.vocabSoloSetup}</Text>
              <Text style={[styles.tagline, { color: C.textMuted }]}>{t.vocabSoloTagline}</Text>
            </View>
            <View style={{ width: 70 }} />
          </View>

          {/* Player name */}
          <View style={styles.section}>
            <View style={[styles.playerTag, { backgroundColor: ACCENT }]}>
              <Text style={styles.playerTagText}>{t.yourName}</Text>
            </View>
            <TextInput
              style={[styles.input, { borderColor: ACCENT, backgroundColor: C.surface, color: C.text }]}
              placeholder={t.enterName}
              placeholderTextColor={C.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={16}
              returnKeyType="done"
              autoFocus
            />
          </View>

          {/* Mode */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.vocabModeLabel}</Text>
            <View style={styles.modeRow}>
              {([
                { value: 'vocab' as VocabMode, label: t.vocabModeVocab, desc: t.vocabModeVocabDesc, emoji: '📖' },
                { value: 'odd_one_out' as VocabMode, label: t.vocabModeOddOneOut, desc: t.vocabModeOddOneOutDesc, emoji: '🔍' },
              ]).map((m) => {
                const selected = vocabMode === m.value;
                return (
                  <TouchableOpacity
                    key={m.value}
                    style={[
                      styles.modeBtn,
                      { backgroundColor: C.surface, borderColor: C.border },
                      selected && { borderColor: ACCENT, backgroundColor: 'rgba(5,150,105,0.15)' },
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
          <View style={styles.section}>
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
                      selected && { borderColor: ACCENT, backgroundColor: 'rgba(5,150,105,0.15)' },
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
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.questionsLabel}</Text>
            <View style={styles.optionRow}>
              {QUESTION_COUNTS.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.optionBtn, { backgroundColor: C.surface, borderColor: C.border },
                    questionCount === n && { borderColor: ACCENT, backgroundColor: 'rgba(5,150,105,0.15)' }]}
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
                    timeLimitMs === tl.value && { borderColor: ACCENT, backgroundColor: 'rgba(5,150,105,0.15)' }]}
                  onPress={() => { tap(); setTimeLimitMs(tl.value); }}
                >
                  <Text style={[styles.timeLimitLabel, { color: timeLimitMs === tl.value ? C.text : C.textMuted }]}>
                    {tl.label}
                  </Text>
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
              colors={canStart ? ['#059669', '#10B981'] : ['#888', '#999']}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>{t.startVocabPractice}</Text>
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

  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 },
  backBtn: { width: 70, paddingTop: 2 },
  backText: { fontSize: 17, fontWeight: '600' },
  titleBlock: { flex: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center' },
  tagline: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', marginTop: 4 },

  section: { marginBottom: 20 },
  playerTag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  playerTagText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  input: { borderWidth: 1.5, borderRadius: 14, padding: 14, fontSize: 17, fontWeight: '700' },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 3, marginBottom: 10 },

  modeRow: { flexDirection: 'row', gap: 8 },
  modeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  modeEmoji: { fontSize: 22 },
  modeLabel: { fontSize: 14, fontWeight: '800' },
  modeDesc: { fontSize: 10, textAlign: 'center', letterSpacing: 0.2 },

  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffBtn: { width: '48%', borderWidth: 1.5, borderRadius: 14, padding: 12, alignItems: 'center', gap: 4 },
  diffEmoji: { fontSize: 22 },
  diffLabel: { fontSize: 14, fontWeight: '800' },
  diffDesc: { fontSize: 10, textAlign: 'center', letterSpacing: 0.2 },

  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  optionLabel: { fontSize: 13, fontWeight: '700' },

  timeLimitRow: { flexDirection: 'row', gap: 6 },
  timeLimitBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  timeLimitLabel: { fontSize: 13, fontWeight: '800' },

  startBtn: { borderRadius: 18, overflow: 'hidden', marginTop: 8, shadowColor: '#059669', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 8 },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
