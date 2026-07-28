import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFlagSoloStore } from '../store/flagSoloStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import { SIZES } from '../constants/theme';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FlagSoloGame'> };

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;
const RESOLVE_DELAY_MS = 1000;
const ACCENT = '#0F766E';

export default function FlagSoloGameScreen({ navigation }: Props) {
  const {
    config, questions, currentIndex,
    score, phase, selectedIndex, lastAnswerCorrect,
    initGame, submitAnswer, resolveQuestion, nextQuestion, resetGame,
  } = useFlagSoloStore();

  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();

  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);
  const countdownScale = useRef(new Animated.Value(0.4)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  const [remainingMs, setRemainingMs] = useState(config?.timeLimitMs ?? 15000);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const onTimeUpRef = useRef<() => void>(() => {});
  onTimeUpRef.current = () => {
    resolveQuestion();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const startTimer = useCallback(() => {
    if (!config) return;
    clearTimer();
    questionStartRef.current = Date.now();
    setRemainingMs(config.timeLimitMs);
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - questionStartRef.current;
      if (config.timeLimitMs > 0) {
        const left = Math.max(0, config.timeLimitMs - elapsed);
        setRemainingMs(left);
        if (left <= 0) { clearTimer(); onTimeUpRef.current(); }
      } else {
        setElapsedMs(elapsed);
      }
    }, 50);
  }, [config, clearTimer]);

  const animateCountdownStep = useCallback(() => {
    countdownScale.setValue(0.4);
    countdownOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(countdownScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(countdownOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!config) { navigation.replace('Home'); return; }
    initGame();
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;
    let step = 0;
    animateCountdownStep();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const tick = () => {
      step++;
      if (step < COUNTDOWN_STEPS.length) {
        setCountdownStep(step);
        animateCountdownStep();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(tick, STEP_MS);
      } else {
        setCountdownDone(true);
      }
    };
    const id = setTimeout(tick, STEP_MS);
    return () => clearTimeout(id);
  }, [questions.length]);

  useEffect(() => {
    if (phase === 'active' && countdownDone) startTimer();
    return clearTimer;
  }, [phase, currentIndex, countdownDone]);

  useEffect(() => {
    if (phase !== 'resolved') return;
    const id = setTimeout(nextQuestion, RESOLVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [phase, currentIndex]);

  useEffect(() => {
    if (phase === 'finished') navigation.replace('FlagSoloResult');
  }, [phase]);

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      if (phase !== 'active') return;
      const responseMs = Date.now() - questionStartRef.current;
      clearTimer();
      const result = submitAnswer(choiceIndex, responseMs);
      if (result === 'correct') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      resolveQuestion();
    },
    [phase, submitAnswer, resolveQuestion, clearTimer],
  );

  const handleQuit = useCallback(() => {
    Alert.alert(t.quitTitle, t.quitMessage, [
      { text: t.cancelAction, style: 'cancel' },
      {
        text: t.quitAction,
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          resetGame();
          navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'FlagSoloSetup' }] });
        },
      },
    ]);
  }, [t, resetGame, navigation]);

  const getButtonState = (idx: number) => {
    if (questions.length === 0) return 'idle' as const;
    const question = questions[currentIndex];
    if (phase === 'resolved' || phase === 'finished') {
      if (idx === question.correctIndex) return 'correct' as const;
      if (idx === selectedIndex) return 'wrong' as const;
      return 'disabled' as const;
    }
    if (selectedIndex === null) return 'idle' as const;
    if (idx === selectedIndex) return lastAnswerCorrect ? 'correct' as const : 'wrong' as const;
    return 'disabled' as const;
  };

  if (!config || questions.length === 0) return null;

  const question = questions[currentIndex];
  const isUnlimited = config.timeLimitMs === 0;
  const progress = isUnlimited ? 1 : Math.max(0, remainingMs / config.timeLimitMs);
  const timerColor = isUnlimited
    ? ACCENT
    : progress > 0.5 ? C.timerGreen
    : progress > 0.25 ? C.timerYellow
    : C.timerRed;

  const countdownLabel = COUNTDOWN_STEPS[countdownStep];
  const isGo = countdownStep === COUNTDOWN_STEPS.length - 1;

  return (
    <LinearGradient colors={G.home} style={[styles.outer, { paddingTop: insets.top + 12, paddingBottom: insets.bottom }]}>
      {/* Countdown overlay */}
      {!countdownDone && (
        <View style={styles.countdownOverlay}>
          <Animated.Text
            style={[
              styles.countdownText,
              isGo && styles.goText,
              { color: isGo ? C.timerGreen : C.text, transform: [{ scale: countdownScale }], opacity: countdownOpacity },
            ]}
          >
            {countdownLabel}
          </Animated.Text>
          <Text style={[styles.countdownHint, { color: C.textMuted }]}>{config.playerName}</Text>
        </View>
      )}

      {countdownDone && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.nameBadge, { backgroundColor: ACCENT }]}>
              <Text style={styles.nameText} numberOfLines={1}>{config.playerName}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreEmoji}>⭐</Text>
              <Text style={[styles.scoreText, { color: C.text }]}>{score}</Text>
            </View>
            <TouchableOpacity onPress={handleQuit} style={styles.quitBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.quitIcon, { color: C.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Progress + timer */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: C.textMuted }]}>
              {currentIndex + 1} / {config.totalQuestions}
            </Text>
            <View style={[styles.timerTrack, { backgroundColor: C.surface }]}>
              <View style={[styles.timerFill, { backgroundColor: timerColor, width: `${progress * 100}%` }]} />
            </View>
            <Text style={[styles.timerText, { color: timerColor }]}>
              {isUnlimited
                ? `${Math.floor(elapsedMs / 1000)}s`
                : `${Math.ceil(remainingMs / 1000)}s`}
            </Text>
          </View>

          {/* Country name + flags centered together */}
          <View style={styles.centerArea}>
            <View style={styles.questionArea}>
              <Text style={[styles.questionText, { color: C.text }]} adjustsFontSizeToFit numberOfLines={2}>
                {question.countryName}
              </Text>
            </View>

            {/* 2×2 flag grid */}
            <View style={styles.flagGrid}>
              {question.choices.map((flag, idx) => {
                const state = getButtonState(idx);
                const borderColor =
                  state === 'correct'  ? '#16A34A'
                  : state === 'wrong'  ? '#DC2626'
                  : state === 'disabled' ? 'transparent'
                  : ACCENT;
                const bgColor =
                  state === 'correct'  ? 'rgba(22,163,74,0.2)'
                  : state === 'wrong'  ? 'rgba(220,38,38,0.15)'
                  : state === 'disabled' ? C.surface
                  : C.idleBg;

                return (
                  <TouchableOpacity
                    key={`${question.id}-${idx}`}
                    style={[styles.flagBtn, { backgroundColor: bgColor, borderColor }]}
                    onPress={() => handleAnswer(idx)}
                    disabled={state !== 'idle'}
                    activeOpacity={0.75}
                  >
                    <View style={styles.flagEmojiWrapper}>
                      <Text style={styles.flagEmoji}>{flag}</Text>
                    </View>
                    {state === 'correct' && <Text style={styles.flagCheck}>✓</Text>}
                    {state === 'wrong'   && <Text style={[styles.flagCheck, { color: '#DC2626' }]}>✗</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 36 },

  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 130,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
    textShadowColor: 'rgba(15,118,110,0.4)',
  },
  goText: { fontSize: 90 },
  countdownHint: { position: 'absolute', bottom: 80, fontSize: 16, fontWeight: '700', letterSpacing: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 14,
  },
  nameBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, maxWidth: '60%' },
  nameText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreEmoji: { fontSize: 20 },
  scoreText: { fontSize: 24, fontWeight: '900', minWidth: 28 },
  quitBtn: { padding: 4 },
  quitIcon: { fontSize: 16, fontWeight: '700' },

  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, gap: 10, marginBottom: 20,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, minWidth: 40 },
  timerTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 4 },
  timerText: { fontSize: 13, fontWeight: '800', minWidth: 32, textAlign: 'right' },

  centerArea: {
    flex: 1,
  },
  questionArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  questionText: { fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },

  flagGrid: {
    flex: 2,
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    paddingHorizontal: 16,
    columnGap: 12,
    rowGap: 8,
    width: '100%',
    maxWidth: SIZES.maxPlayWidth,
    alignSelf: 'center',
  },
  flagBtn: {
    width: '47%',
    aspectRatio: 1.6,
    borderRadius: 18,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmojiWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  flagEmoji: { fontSize: 56, includeFontPadding: false, lineHeight: 64, textAlignVertical: 'center' },
  flagCheck: {
    position: 'absolute', top: 6, right: 10,
    fontSize: 20, fontWeight: '900', color: '#16A34A',
  },
});
