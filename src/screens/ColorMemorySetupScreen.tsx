import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMemoryStore } from '../store/colorMemoryStore';
import type { ColorMemoryDifficulty } from '../store/colorMemoryStore';
import { useProfileStore } from '../store/profileStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ColorMemorySetup'> };

const CM_PRIMARY = '#F97316';
const QUESTION_COUNTS = [10, 15, 20];

const DIFFICULTIES: { label: string; value: ColorMemoryDifficulty; emoji: string; hint: string }[] = [
  { label: 'Easy',   value: 'easy',   emoji: '🟢', hint: '3 colors' },
  { label: 'Medium', value: 'medium', emoji: '🟡', hint: '4 colors' },
  { label: 'Hard',   value: 'hard',   emoji: '🟠', hint: '6 colors' },
  { label: 'Expert', value: 'expert', emoji: '🔴', hint: '8 colors' },
];

export default function ColorMemorySetupScreen({ navigation }: Props) {
  const { setConfig } = useColorMemoryStore();
  const { displayName, setDisplayName } = useProfileStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const [playerName, setPlayerName] = useState(displayName);
  useEffect(() => { if (displayName) setPlayerName(displayName); }, [displayName]);
  const [difficulty, setDifficulty] = useState<ColorMemoryDifficulty>('easy');
  const [questionCount, setQuestionCount] = useState(10);

  const canStart = playerName.trim().length > 0;
  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const handleStart = () => {
    if (!canStart) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDisplayName(playerName.trim());
    setConfig({ playerName: playerName.trim(), difficulty, totalQuestions: questionCount });
    navigation.navigate('ColorMemoryGame');
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
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: C.text }]}>{t.colorMemorySetup}</Text>
              <Text style={[styles.tagline, { color: C.textMuted }]}>{t.colorMemoryTagline}</Text>
            </View>
            <View style={{ width: 70 }} />
          </View>

          {/* Player name */}
          <View style={styles.section}>
            <View style={[styles.playerTag, { backgroundColor: CM_PRIMARY }]}>
              <Text style={styles.playerTagText}>{t.yourName}</Text>
            </View>
            <TextInput
              style={[styles.input, { borderColor: CM_PRIMARY, backgroundColor: C.surface, color: C.text }]}
              placeholder={t.enterName}
              placeholderTextColor={C.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={16}
              returnKeyType="done"
              autoFocus
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
                    difficulty === d.value && { borderColor: CM_PRIMARY, backgroundColor: 'rgba(249,115,22,0.14)' },
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
                    questionCount === n && { borderColor: CM_PRIMARY, backgroundColor: 'rgba(249,115,22,0.14)' },
                  ]}
                  onPress={() => { tap(); setQuestionCount(n); }}
                >
                  <Text style={[styles.optionLabel, { color: questionCount === n ? C.text : C.textMuted }]}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* How it works hint */}
          <View style={[styles.hintCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.hintTitle, { color: CM_PRIMARY }]}>How it works</Text>
            <Text style={[styles.hintBody, { color: C.textMuted }]}>
              Colors are shown for 5 seconds. Then all tiles turn gray. Answer which color was at the highlighted position.
            </Text>
          </View>

          {/* Start */}
          <TouchableOpacity
            style={[styles.startBtn, !canStart && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={!canStart}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canStart ? ['#F97316', '#FB923C'] : ['#888', '#999']}
              style={styles.startGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startText}>{t.startColorMemoryPractice}</Text>
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
  optionRow: { flexDirection: 'row', gap: 8 },
  optionBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 2 },
  diffGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  diffBtn: { flex: 0, width: '23%', paddingVertical: 10, paddingHorizontal: 2 },
  optionEmoji: { fontSize: 20 },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  optionHint: { fontSize: 10, fontWeight: '500', textAlign: 'center' },

  hintCard: { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 20, gap: 6 },
  hintTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  hintBody: { fontSize: 13, lineHeight: 18 },

  startBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  startBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  startGradient: { paddingVertical: 18, alignItems: 'center' },
  startText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
});
