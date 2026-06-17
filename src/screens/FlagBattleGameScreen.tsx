import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFlagBattleStore } from '../store/flagBattleStore';
import type { FlagBattlePlayerState } from '../store/flagBattleStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import { TimerBar } from '../components/TimerBar';
import type { FlagQuestion, GamePhase, PlayerPosition, RootStackParamList } from '../types';
import { SIZES } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FlagBattleGame'> };

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;
const RESOLVE_DELAY_MS = 1500;

// ─── Flag button ──────────────────────────────────────────────────────────────

function FlagButton({
  flag,
  state,
  accentColor,
  onPress,
}: {
  flag: string;
  state: 'idle' | 'correct' | 'wrong' | 'disabled';
  accentColor: string;
  onPress: () => void;
}) {
  const { C } = useTheme();
  const shakeX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 10,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 6,   duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0,   duration: 55, useNativeDriver: true }),
      ]).start();
    }
    if (state === 'correct') {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.08, friction: 4, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1,    friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [state]);

  const borderColor =
    state === 'correct'  ? '#16A34A'
    : state === 'wrong'  ? '#DC2626'
    : state === 'disabled' ? 'transparent'
    : accentColor;

  const bgColor =
    state === 'correct'  ? 'rgba(22,163,74,0.2)'
    : state === 'wrong'  ? 'rgba(220,38,38,0.15)'
    : state === 'disabled' ? C.surface
    : C.idleBg;

  return (
    <Animated.View style={[styles.flagBtnWrapper, { transform: [{ translateX: shakeX }, { scale }] }]}>
      <TouchableOpacity
        style={[styles.flagBtn, { backgroundColor: bgColor, borderColor }]}
        onPress={state === 'idle' ? onPress : undefined}
        disabled={state !== 'idle'}
        activeOpacity={0.75}
      >
        <View style={styles.flagEmojiWrapper}>
          <Text style={styles.flagEmoji}>{flag}</Text>
        </View>
        {state === 'correct' && <Text style={styles.flagOverlay}>✓</Text>}
        {state === 'wrong'   && <Text style={[styles.flagOverlay, { color: '#DC2626' }]}>✗</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Player panel ─────────────────────────────────────────────────────────────

function FlagPlayerPanel({
  player,
  question,
  phase,
  isRotated,
  onAnswer,
}: {
  player: FlagBattlePlayerState;
  question: FlagQuestion;
  phase: GamePhase;
  isRotated: boolean;
  onAnswer: (i: number) => void;
}) {
  const { C } = useTheme();
  const isP1 = player.position === 'bottom';
  const accent = isP1 ? C.p1Primary : C.p2Primary;
  const panelBg = isP1 ? C.p1PanelBg : C.p2PanelBg;

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const prevScore = useRef(player.score);

  useEffect(() => {
    if (player.score > prevScore.current) {
      prevScore.current = player.score;
      scoreAnim.setValue(1);
      Animated.timing(scoreAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }
  }, [player.score]);

  const getButtonState = (idx: number): 'idle' | 'correct' | 'wrong' | 'disabled' => {
    const isResolved = phase === 'resolved' || phase === 'finished';
    if (isResolved) {
      if (idx === question.correctIndex) return 'correct';
      if (idx === player.selectedIndex) return 'wrong';
      return 'disabled';
    }
    if (!player.hasAnswered) return 'idle';
    if (idx === player.selectedIndex) return player.lastAnswerCorrect ? 'correct' : 'wrong';
    return 'disabled';
  };

  return (
    <View style={[styles.panel, { backgroundColor: panelBg }, isRotated && styles.rotated]}>
      {/* Header */}
      <View style={styles.panelHeader}>
        <View style={[styles.nameBadge, { backgroundColor: accent }]}>
          <Text style={styles.nameText} numberOfLines={1}>{player.name}</Text>
        </View>
        <View style={styles.scoreRow}>
          <Animated.Text
            style={[styles.plusOne, {
              color: C.timerGreen, opacity: scoreAnim,
              transform: [{ translateY: scoreAnim.interpolate({ inputRange: [0, 1], outputRange: [-22, 0] }) }],
            }]}
          >+1</Animated.Text>
          <Text style={styles.scoreEmoji}>⭐</Text>
          <Text style={[styles.scoreNum, { color: C.text }]}>{player.score}</Text>
        </View>
      </View>

      {/* Country name */}
      <Text style={[styles.countryName, { color: C.text }]} numberOfLines={2} adjustsFontSizeToFit>
        {question.countryName}
      </Text>

      {/* 2×2 flag grid */}
      <View style={styles.flagGrid}>
        {question.choices.map((flag, idx) => (
          <FlagButton
            key={`${question.id}-${idx}`}
            flag={flag}
            state={getButtonState(idx)}
            accentColor={accent}
            onPress={() => onAnswer(idx)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FlagBattleGameScreen({ navigation }: Props) {
  const {
    config, questions, currentIndex,
    player1, player2, phase,
    initGame, submitAnswer, resolveQuestion, nextQuestion, resetGame,
  } = useFlagBattleStore();

  const { t } = useLanguageStore();
  const { C } = useTheme();

  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);

  const [remainingMs, setRemainingMs] = useState(config?.timeLimitMs ?? 15000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const onTimeUpRef = useRef<() => void>(() => {});
  onTimeUpRef.current = () => { resolveQuestion(); };

  const startTimer = useCallback(() => {
    if (!config) return;
    clearTimer();
    questionStartRef.current = Date.now();
    setRemainingMs(config.timeLimitMs);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, config.timeLimitMs - (Date.now() - questionStartRef.current));
      setRemainingMs(left);
      if (left <= 0) { clearTimer(); onTimeUpRef.current(); }
    }, 50);
  }, [config, clearTimer]);

  useEffect(() => {
    if (!config) { navigation.replace('Home'); return; }
    initGame();
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;
    let step = 0;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const tick = () => {
      step++;
      if (step < COUNTDOWN_STEPS.length) {
        setCountdownStep(step);
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
    if (phase === 'finished') navigation.replace('FlagBattleResult');
  }, [phase]);

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

  const handleQuit = useCallback(() => {
    Alert.alert(t.quitTitle, t.quitMessage, [
      { text: t.cancelAction, style: 'cancel' },
      {
        text: t.quitAction,
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          resetGame();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  }, [t, resetGame, navigation]);

  if (!config || questions.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: C.screenBg }]}>
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: C.text }]}>
            {COUNTDOWN_STEPS[countdownStep]}
          </Text>
        </View>
      </View>
    );
  }

  const question = questions[currentIndex];

  return (
    <View style={[styles.root, { backgroundColor: C.screenBg }]}>
      {!countdownDone && (
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: C.text }]}>
            {COUNTDOWN_STEPS[countdownStep]}
          </Text>
        </View>
      )}

      {countdownDone && (
        <>
          <View style={styles.half}>
            <FlagPlayerPanel
              player={player2}
              question={question}
              phase={phase}
              isRotated
              onAnswer={(i) => handleAnswer('top', i)}
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

          <View style={styles.half}>
            <FlagPlayerPanel
              player={player1}
              question={question}
              phase={phase}
              isRotated={false}
              onAnswer={(i) => handleAnswer('bottom', i)}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  half: { flex: 1, overflow: 'hidden' },
  center: { height: SIZES.centerBarHeight, justifyContent: 'center', gap: 6 },
  centerLine: { height: 1 },
  centerRow: { flexDirection: 'row', alignItems: 'center' },
  quitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, marginRight: 8,
  },
  quitIcon: { fontSize: 11, fontWeight: '800' },
  quitLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  countdownText: { fontSize: 120, fontWeight: '900' },

  // Panel
  panel: { flex: 1, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  rotated: { transform: [{ rotate: '180deg' }] },
  panelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, maxWidth: '60%' },
  nameText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'relative' },
  plusOne: { position: 'absolute', right: 0, top: -20, fontSize: 14, fontWeight: '900' },
  scoreEmoji: { fontSize: 18 },
  scoreNum: { fontSize: 22, fontWeight: '900', minWidth: 28, textAlign: 'right' },

  countryName: {
    fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5,
  },

  flagGrid: {
    flex: 1,
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 8,
    alignContent: 'center',
  },

  // Flag button
  flagBtnWrapper: { width: '48%' },
  flagBtn: {
    aspectRatio: 1.6,
    borderRadius: 16,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagEmojiWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  flagEmoji: { fontSize: 52, includeFontPadding: false, lineHeight: 60, textAlignVertical: 'center' },
  flagOverlay: {
    position: 'absolute', top: 4, right: 8,
    fontSize: 20, fontWeight: '900', color: '#16A34A',
  },
});
