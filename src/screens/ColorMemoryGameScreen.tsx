import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Platform, StyleSheet, Text,
  TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMemoryStore, COLOR_MEMORY_SETTINGS, COLOR_MEMORY_PALETTE } from '../store/colorMemoryStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ColorMemoryGame'> };

const CM_PRIMARY = '#F97316';
const REVEAL_MS = 5000;
const RESOLVE_DELAY_MS = 1200;
const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;

function colorName(hex: string): string {
  return COLOR_MEMORY_PALETTE.find(c => c.hex === hex)?.name ?? '';
}

function getGridInfo(colorCount: number, screenWidth: number) {
  const cols = colorCount === 3 ? 3 : colorCount === 4 ? 2 : colorCount === 6 ? 3 : 4;
  const GAP = 12;
  const H_PAD = 32;
  const maxTile = colorCount <= 4 ? 130 : colorCount === 6 ? 110 : 90;
  const tile = Math.min(Math.floor((screenWidth - H_PAD * 2 - GAP * (cols - 1)) / cols), maxTile);
  return { cols, tile, GAP };
}

export default function ColorMemoryGameScreen({ navigation }: Props) {
  const {
    config, rounds, currentIndex,
    score, phase, showingColors, lastAnswerCorrect, selectedHex,
    initGame, hideColors, submitAnswer, nextQuestion, resetGame,
  } = useColorMemoryStore();

  const { t } = useLanguageStore();
  const { C, G } = useTheme();
  const { width } = useWindowDimensions();

  const difficulty = config?.difficulty ?? 'easy';
  const { colorCount } = COLOR_MEMORY_SETTINGS[difficulty];
  const { cols, tile, GAP } = getGridInfo(colorCount, width);

  // Intro countdown
  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);
  const countdownScale = useRef(new Animated.Value(0.4)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  // Reveal timer
  const [revealLeft, setRevealLeft] = useState(REVEAL_MS);
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealStartRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);

  const clearReveal = useCallback(() => {
    if (revealTimerRef.current) { clearInterval(revealTimerRef.current); revealTimerRef.current = null; }
  }, []);

  // Tap flash for choice selection
  const [tapHex, setTapHex] = useState<string | null>(null);

  const animateCountdown = useCallback(() => {
    countdownScale.setValue(0.4);
    countdownOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(countdownScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(countdownOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  // Init
  useEffect(() => {
    if (!config) { navigation.replace('Home'); return; }
    initGame();
  }, []);

  // Intro countdown
  useEffect(() => {
    if (rounds.length === 0) return;
    let step = 0;
    animateCountdown();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const tick = () => {
      step++;
      if (step < COUNTDOWN_STEPS.length) {
        setCountdownStep(step);
        animateCountdown();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(tick, STEP_MS);
      } else {
        setCountdownDone(true);
      }
    };
    const id = setTimeout(tick, STEP_MS);
    return () => clearTimeout(id);
  }, [rounds.length]);

  // Reveal timer — fires whenever showingColors flips to true
  useEffect(() => {
    if (!countdownDone || !showingColors || phase !== 'active') return;

    revealStartRef.current = Date.now();
    setRevealLeft(REVEAL_MS);

    revealTimerRef.current = setInterval(() => {
      const left = Math.max(0, REVEAL_MS - (Date.now() - revealStartRef.current));
      setRevealLeft(left);
      if (left <= 0) {
        clearReveal();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        hideColors();
        questionStartRef.current = Date.now();
      }
    }, 50);

    return clearReveal;
  }, [showingColors, phase, countdownDone, currentIndex]);

  // Advance after resolve
  useEffect(() => {
    if (phase !== 'resolved') return;
    const id = setTimeout(nextQuestion, RESOLVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [phase, currentIndex]);

  // Navigate to result
  useEffect(() => {
    if (phase === 'finished') navigation.replace('ColorMemoryResult');
  }, [phase]);

  const handleQuit = useCallback(() => {
    Alert.alert(t.quitTitle, t.quitMessage, [
      { text: t.cancelAction, style: 'cancel' },
      {
        text: t.quitAction,
        style: 'destructive',
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          clearReveal();
          resetGame();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  }, [t, resetGame, navigation, clearReveal]);

  const handleChoiceTap = useCallback((hex: string) => {
    if (phase !== 'active' || showingColors) return;
    setTapHex(hex);
    setTimeout(() => setTapHex(cur => cur === hex ? null : cur), 160);
    const responseMs = Date.now() - questionStartRef.current;
    const result = submitAnswer(hex, responseMs);
    if (result === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [phase, showingColors, submitAnswer]);

  if (!config || rounds.length === 0) return null;

  const round = rounds[currentIndex];
  const isResolved = phase === 'resolved' || phase === 'finished';
  const revealProgress = Math.max(0, revealLeft / REVEAL_MS);

  const countdownLabel = COUNTDOWN_STEPS[countdownStep];
  const isGo = countdownStep === COUNTDOWN_STEPS.length - 1;

  const gridRows: number[][] = [];
  for (let i = 0; i < colorCount; i += cols) {
    gridRows.push(Array.from({ length: Math.min(cols, colorCount - i) }, (_, j) => i + j));
  }

  return (
    <LinearGradient colors={G.home} style={styles.outer}>

      {/* Intro countdown overlay */}
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
            <View style={[styles.nameBadge, { backgroundColor: CM_PRIMARY }]}>
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

          {/* Progress row */}
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: C.textMuted }]}>
              {currentIndex + 1} / {config.totalQuestions}
            </Text>
            {showingColors ? (
              <>
                <View style={[styles.timerTrack, { backgroundColor: C.surface }]}>
                  <View style={[styles.timerFill, { backgroundColor: CM_PRIMARY, width: `${revealProgress * 100}%` }]} />
                </View>
                <Text style={[styles.timerText, { color: CM_PRIMARY }]}>
                  {Math.ceil(revealLeft / 1000)}s
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.timerTrack, { backgroundColor: C.surface }]}>
                  <View style={[styles.timerFill, { backgroundColor: C.timerGreen, width: '100%' }]} />
                </View>
                <Text style={[styles.timerText, { color: C.timerGreen }]}>✓</Text>
              </>
            )}
          </View>

          {/* Instruction - only during question phase */}
          {/* Instruction / immediate feedback */}
          {!showingColors && (
            <View style={styles.instructionArea}>
              {isResolved ? (
                <Text style={[styles.instructionText, { color: lastAnswerCorrect ? C.timerGreen : C.timerRed }]}>
                  {lastAnswerCorrect ? '✅  Correct!' : `❌  It was ${colorName(round.correctHex)}`}
                </Text>
              ) : (
                <>
                  <Text style={[styles.instructionText, { color: C.text }]}>
                    {t.colorMemoryQuestion(round.questionPosition + 1)}
                  </Text>
                  <Text style={[styles.instructionSub, { color: C.textMuted }]}>
                    Tap the correct color below
                  </Text>
                </>
              )}
            </View>
          )}

          {/* Color grid */}
          <View style={styles.gridArea}>
            <View style={{ gap: GAP }}>
              {gridRows.map((row, rowIdx) => (
                <View key={rowIdx} style={[styles.gridRow, { gap: GAP }]}>
                  {row.map((posIdx) => {
                    const isQuestionTile = !showingColors && posIdx === round.questionPosition;
                    const tileColor = showingColors ? round.colors[posIdx] : '#6B7280';
                    return (
                      <View
                        key={posIdx}
                        style={[
                          styles.colorTile,
                          {
                            width: tile,
                            height: tile,
                            backgroundColor: tileColor,
                            borderColor: isQuestionTile ? '#FFFFFF' : 'transparent',
                            borderWidth: isQuestionTile ? 3 : 0,
                          },
                        ]}
                      >
                        {isQuestionTile ? (
                          <Text style={styles.tileMark}>?</Text>
                        ) : (
                          <View style={[styles.posLabel, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                            <Text style={styles.posLabelText}>{posIdx + 1}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            {showingColors && (
              <Text style={[styles.revealHint, { color: CM_PRIMARY }]}>
                {t.colorMemoryWatch} · {colorCount} colors
              </Text>
            )}
          </View>

          {/* Answer choices (visible only after reveal) */}
          {!showingColors && (
            <View style={styles.choicesArea}>
              <View style={styles.choiceGrid}>
                {round.choices.map((hex) => {
                  const isTapped = tapHex === hex;
                  const isSelected = isResolved && selectedHex === hex;
                  const isCorrectRevealed = isResolved && hex === round.correctHex;
                  const isWrongSelected = isSelected && !isCorrectRevealed;
                  let borderColor = 'transparent';
                  let bgColor = C.surface;
                  if (isCorrectRevealed) { borderColor = C.timerGreen; bgColor = 'rgba(34,197,94,0.15)'; }
                  else if (isWrongSelected) { borderColor = C.timerRed; bgColor = 'rgba(239,68,68,0.2)'; }
                  return (
                    <TouchableOpacity
                      key={hex}
                      onPress={() => handleChoiceTap(hex)}
                      disabled={isResolved}
                      activeOpacity={0.85}
                      style={[
                        styles.choiceBtn,
                        {
                          backgroundColor: bgColor,
                          borderColor,
                          borderWidth: 2.5,
                          transform: [{ scale: isTapped ? 0.94 : 1 }],
                        },
                      ]}
                    >
                      <View style={[styles.colorSwatch, { backgroundColor: hex }]} />
                      <Text style={[styles.colorLabel, { color: C.textMuted }]}>{colorName(hex)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 56 : 36 },

  countdownOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  countdownText: {
    fontSize: 130, fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 40,
    textShadowColor: 'rgba(249,115,22,0.4)',
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
    paddingHorizontal: 20, gap: 10, marginBottom: 14,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, minWidth: 40 },
  timerTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 4 },
  timerText: { fontSize: 13, fontWeight: '800', minWidth: 32, textAlign: 'right' },

  instructionArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  instructionText: { fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.2 },
  instructionSub: { fontSize: 13, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },

  gridArea: { flex: 2, alignItems: 'center', justifyContent: 'center' },
  revealHint: { fontSize: 13, fontWeight: '700', marginTop: 14, letterSpacing: 0.3 },
  gridRow: { flexDirection: 'row' },
  colorTile: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  posLabel: {
    position: 'absolute', bottom: 6, right: 8,
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  posLabelText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  tileMark: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },

  choicesArea: { paddingHorizontal: 20, marginBottom: 12 },
  choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  choiceBtn: {
    width: '47%',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  colorSwatch: { width: 56, height: 56, borderRadius: 12 },
  colorLabel: { fontSize: 13, fontWeight: '700' },

  inlineFeedback: { fontSize: 18, fontWeight: '900', marginTop: 14, textAlign: 'center' },
});
