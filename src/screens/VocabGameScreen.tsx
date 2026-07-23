import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVocabStore } from '../store/vocabStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import { VocabPlayerPanel } from '../components/VocabPlayerPanel';
import { TimerBar } from '../components/TimerBar';
import ConfirmModal from '../components/ConfirmModal';
import type { PlayerPosition, RootStackParamList } from '../types';
import { SIZES } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'VocabGame'> };

export default function VocabGameScreen({ navigation }: Props) {
  const {
    config, questions, currentIndex,
    player1, player2, phase,
    submitAnswer, resolveQuestion, nextQuestion, resetGame,
  } = useVocabStore();

  const { t } = useLanguageStore();
  const { C } = useTheme();
  const insets = useSafeAreaInsets();

  const [remainingMs, setRemainingMs] = useState(config?.timeLimitMs ?? 15000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());
  const onTimeUpRef = useRef<() => void>(() => {});

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    if (!config) return;
    clearTimer();
    questionStartRef.current = Date.now();
    setRemainingMs(config.timeLimitMs);

    // timeLimitMs === 0 means unlimited — no countdown, question never times out.
    if (config.timeLimitMs <= 0) return;

    timerRef.current = setInterval(() => {
      const left = Math.max(0, config.timeLimitMs - (Date.now() - questionStartRef.current));
      setRemainingMs(left);
      if (left <= 0) { clearTimer(); onTimeUpRef.current(); }
    }, 50);
  }, [config, clearTimer]);

  onTimeUpRef.current = () => resolveQuestion();

  useEffect(() => {
    if (phase === 'active') startTimer();
    return clearTimer;
  }, [phase, currentIndex]);

  useEffect(() => {
    if (phase !== 'resolved') return;
    const id = setTimeout(nextQuestion, 1500);
    return () => clearTimeout(id);
  }, [phase, currentIndex]);

  useEffect(() => {
    if (phase === 'finished') navigation.replace('VocabResult');
  }, [phase]);

  useEffect(() => {
    if (!config || questions.length === 0) navigation.replace('Home');
  }, []);

  const handleAnswer = useCallback(
    (position: PlayerPosition, choiceIndex: number) => {
      if (phase !== 'active') return;
      const responseMs = Date.now() - questionStartRef.current;
      const result = submitAnswer(position, choiceIndex, responseMs);

      if (result === 'correct') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearTimer();
        resolveQuestion();
      } else if (result === 'both-wrong') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        clearTimer();
        resolveQuestion();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [phase, submitAnswer, resolveQuestion, clearTimer],
  );

  const [quitVisible, setQuitVisible] = useState(false);
  const handleQuit = useCallback(() => setQuitVisible(true), []);
  const confirmQuit = useCallback(() => {
    setQuitVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetGame();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  }, [resetGame, navigation]);

  if (!config || questions.length === 0) return null;

  const question = questions[currentIndex];

  return (
    <View style={[styles.root, { backgroundColor: C.screenBg }]}>
      <View style={[styles.half, { paddingTop: insets.top }]}>
        <VocabPlayerPanel
          player={player2}
          question={question}
          isRotated
          onAnswer={(i) => handleAnswer('top', i)}
          phase={phase}
        />
      </View>

      <View style={[styles.center, { backgroundColor: C.screenBg }]}>
        <View style={[styles.centerLine, { backgroundColor: C.divider }]} />
        <View style={styles.centerRow}>
          <View style={{ flex: 1 }}>
            <TimerBar
              remainingMs={remainingMs}
              totalMs={config.timeLimitMs}
              questionNumber={currentIndex + 1}
              totalQuestions={config.totalQuestions}
            />
          </View>
          <TouchableOpacity
            onPress={handleQuit}
            style={[styles.quitBtn, { borderColor: C.border, backgroundColor: C.surface }]}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            activeOpacity={0.7}
          >
            <Text style={[styles.quitIcon, { color: C.textMuted }]}>✕</Text>
            <Text style={[styles.quitLabel, { color: C.textMuted }]}>QUIT</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.centerLine, { backgroundColor: C.divider }]} />
      </View>

      <View style={[styles.half, { paddingBottom: insets.bottom }]}>
        <VocabPlayerPanel
          player={player1}
          question={question}
          isRotated={false}
          onAnswer={(i) => handleAnswer('bottom', i)}
          phase={phase}
        />
      </View>

      <ConfirmModal
        visible={quitVisible}
        title={t.quitTitle}
        message={t.quitMessage}
        cancelLabel={t.cancelAction}
        confirmLabel={t.quitAction}
        onCancel={() => setQuitVisible(false)}
        onConfirm={confirmQuit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  half: { flex: 1, overflow: 'hidden' },
  center: { height: SIZES.centerBarHeight, justifyContent: 'center', gap: 6 },
  centerRow: { flexDirection: 'row', alignItems: 'center' },
  centerLine: { height: 1 },
  quitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, marginRight: 8,
  },
  quitIcon: { fontSize: 11, fontWeight: '800' },
  quitLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
});
