import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Platform, StyleSheet, Text,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemoryStore } from '../store/memoryStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import { memoryFlashMs, tileColor } from '../utils/memoryShared';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MemoryGame'> };

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;
const RESOLVE_DELAY_MS = 1300;
const SHOW_START_DELAY = 550;
const MEMORY_PRIMARY = '#6366F1';

export default function MemoryGameScreen({ navigation }: Props) {
  const {
    config, rounds, currentIndex,
    score, phase, inputIndex, lastAnswerCorrect, wrongTile,
    initGame, submitTap, failByTimeout, resolveQuestion, nextQuestion, resetGame,
  } = useMemoryStore();

  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const gridDim = config?.gridDim ?? 2;
  const gridSize = gridDim * gridDim;
  const flashMs = memoryFlashMs(gridDim, config?.steps ?? 2);
  const cols = gridDim;
  const GAP = gridDim <= 5 ? 14 : gridDim <= 8 ? 8 : 5;
  const H_PAD = 24;
  const rawTile = Math.floor((width - H_PAD * 2 - GAP * (cols - 1)) / cols);
  const tileSizeCap = Math.max(28, Math.min(150, Math.round(300 / gridDim)));
  const tileSize = Math.min(rawTile, tileSizeCap);

  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);
  const countdownScale = useRef(new Animated.Value(0.4)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  const [flashTile, setFlashTile] = useState<number | null>(null);
  const [tapFlash, setTapFlash] = useState<number | null>(null);
  const [inputOpen, setInputOpen] = useState(false);

  const [remainingMs, setRemainingMs] = useState(config?.timeLimitMs ?? 15000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const onTimeUpRef = useRef<() => void>(() => {});
  onTimeUpRef.current = () => {
    setInputOpen(false);
    failByTimeout();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resolveQuestion();
  };

  const startTimer = useCallback(() => {
    if (!config || config.timeLimitMs <= 0) return;
    clearTimer();
    questionStartRef.current = Date.now();
    setRemainingMs(config.timeLimitMs);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, config.timeLimitMs - (Date.now() - questionStartRef.current));
      setRemainingMs(left);
      if (left <= 0) { clearTimer(); onTimeUpRef.current(); }
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

  // Countdown intro
  useEffect(() => {
    if (rounds.length === 0) return;
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
  }, [rounds.length]);

  // Show the sequence for the current round, then open input.
  useEffect(() => {
    if (phase !== 'active' || !countdownDone || rounds.length === 0) return;
    const sequence = rounds[currentIndex].sequence;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    setInputOpen(false);
    setFlashTile(null);

    let i = 0;
    const gap = Math.max(150, flashMs * 0.4);
    const playNext = () => {
      if (cancelled) return;
      if (i >= sequence.length) {
        setFlashTile(null);
        setInputOpen(true);
        startTimer();
        return;
      }
      setFlashTile(sequence[i]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      timeouts.push(setTimeout(() => {
        if (cancelled) return;
        setFlashTile(null);
        i++;
        timeouts.push(setTimeout(playNext, gap));
      }, flashMs));
    };
    timeouts.push(setTimeout(playNext, SHOW_START_DELAY));

    return () => { cancelled = true; timeouts.forEach(clearTimeout); clearTimer(); };
  }, [phase, currentIndex, countdownDone]);

  // After a round resolves, advance to the next.
  useEffect(() => {
    if (phase !== 'resolved') return;
    const id = setTimeout(nextQuestion, RESOLVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [phase, currentIndex]);

  useEffect(() => {
    if (phase === 'finished') navigation.replace('MemoryResult');
  }, [phase]);

  const handleQuit = useCallback(() => {
    Alert.alert(t.quitTitle, t.quitMessage, [
      { text: t.cancelAction, style: 'cancel' },
      {
        text: t.quitAction,
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          resetGame();
          navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'MemorySetup' }] });
        },
      },
    ]);
  }, [t, resetGame, navigation]);

  const handleTap = useCallback(
    (tile: number) => {
      if (!inputOpen || phase !== 'active') return;
      setTapFlash(tile);
      setTimeout(() => setTapFlash((cur) => (cur === tile ? null : cur)), 180);

      const responseMs = Date.now() - questionStartRef.current;
      const result = submitTap(tile, responseMs);

      if (result === 'progress') {
        Haptics.selectionAsync();
      } else if (result === 'correct') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearTimer();
        setInputOpen(false);
        resolveQuestion();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        clearTimer();
        setInputOpen(false);
        resolveQuestion();
      }
    },
    [inputOpen, phase, submitTap, resolveQuestion, clearTimer],
  );

  if (!config || rounds.length === 0) return null;

  const round = rounds[currentIndex];
  const isResolved = phase === 'resolved' || phase === 'finished';
  const isUnlimited = config.timeLimitMs <= 0;
  const progress = isUnlimited ? 1 : Math.max(0, remainingMs / config.timeLimitMs);
  const timerColor = isUnlimited
    ? MEMORY_PRIMARY
    : progress > 0.5 ? C.timerGreen
    : progress > 0.25 ? C.timerYellow
    : C.timerRed;

  const countdownLabel = COUNTDOWN_STEPS[countdownStep];
  const isGo = countdownStep === COUNTDOWN_STEPS.length - 1;
  const showing = !inputOpen && !isResolved;

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
            <View style={[styles.nameBadge, { backgroundColor: MEMORY_PRIMARY }]}>
              <Text style={styles.nameText} numberOfLines={1}>{config.playerName}</Text>
            </View>
            <View style={styles.scoreRow}>
              <Text style={styles.scoreEmoji}>⭐</Text>
              <Text style={[styles.scoreText, { color: C.text }]}>{score}</Text>
            </View>
            <TouchableOpacity
              onPress={handleQuit}
              style={styles.quitBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.quitIcon, { color: C.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Progress + timer */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: C.textMuted }]}>
              {currentIndex + 1} / {config.totalQuestions}
            </Text>
            <View style={[styles.timerTrack, { backgroundColor: C.surface }]}>
              <View style={[styles.timerFill, { backgroundColor: showing ? MEMORY_PRIMARY : timerColor, width: `${(showing ? 1 : progress) * 100}%` }]} />
            </View>
            <Text style={[styles.timerText, { color: showing ? MEMORY_PRIMARY : timerColor }]}>
              {showing ? '👀' : isUnlimited ? '∞' : `${Math.ceil(remainingMs / 1000)}s`}
            </Text>
          </View>

          {/* Instruction */}
          <View style={styles.instructionArea}>
            <Text style={[styles.instructionText, { color: showing ? MEMORY_PRIMARY : C.text }]}>
              {showing ? t.memoryWatch : t.memoryRepeat}
            </Text>
            <Text style={[styles.instructionSub, { color: C.textMuted }]}>
              {showing
                ? `${round.sequence.length} ${t.memoryStepsHint}`
                : `${inputIndex} / ${round.sequence.length}`}
            </Text>
          </View>

          {/* Tile grid */}
          <View style={[styles.gridArea]}>
            <View style={[styles.grid, { width: cols * tileSize + (cols - 1) * GAP, gap: GAP }]}>
              {Array.from({ length: gridSize }, (_, idx) => {
                const color = tileColor(idx);
                const lit = flashTile === idx || tapFlash === idx;
                const isWrong = isResolved && wrongTile === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.9}
                    onPress={() => handleTap(idx)}
                    disabled={!inputOpen}
                    style={[
                      styles.tile,
                      {
                        width: tileSize,
                        height: tileSize,
                        backgroundColor: color,
                        opacity: lit ? 1 : 0.28,
                        borderColor: isWrong ? '#DC2626' : lit ? '#FFFFFF' : 'transparent',
                        transform: [{ scale: lit ? 1 : 0.94 }],
                      },
                    ]}
                  >
                    {isWrong && <Text style={styles.tileMark}>✗</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Feedback label */}
          {isResolved && (
            <View style={styles.feedbackRow}>
              <Text style={[
                styles.feedbackText,
                { color: lastAnswerCorrect ? C.timerGreen : C.timerRed },
              ]}>
                {lastAnswerCorrect ? '✅  Correct!' : '❌  Try again!'}
              </Text>
            </View>
          )}
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
    textShadowColor: 'rgba(99,102,241,0.4)',
  },
  goText: { fontSize: 90 },
  countdownHint: { position: 'absolute', bottom: 80, fontSize: 16, fontWeight: '700', letterSpacing: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  nameBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, maxWidth: '60%' },
  nameText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoreEmoji: { fontSize: 20 },
  scoreText: { fontSize: 24, fontWeight: '900', minWidth: 28 },
  quitBtn: { padding: 4 },
  quitIcon: { fontSize: 16, fontWeight: '700' },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 18,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, minWidth: 40 },
  timerTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 4 },
  timerText: { fontSize: 13, fontWeight: '800', minWidth: 32, textAlign: 'right' },

  instructionArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  instructionText: { fontSize: 26, fontWeight: '900', letterSpacing: -0.3 },
  instructionSub: { fontSize: 13, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },

  gridArea: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  tile: {
    borderRadius: 20,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileMark: { fontSize: 40, fontWeight: '900', color: '#FFFFFF' },

  feedbackRow: { marginTop: 12, marginBottom: 28, alignItems: 'center' },
  feedbackText: { fontSize: 22, fontWeight: '900' },
});
