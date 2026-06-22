import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorMemoryBattleStore } from '../store/colorMemoryBattleStore';
import type { ColorMemoryBattlePlayerState } from '../store/colorMemoryBattleStore';
import { COLOR_MEMORY_SETTINGS, COLOR_MEMORY_PALETTE } from '../store/colorMemoryStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { PlayerPosition, RootStackParamList } from '../types';
import { SIZES } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ColorMemoryBattleGame'> };

const CM_PRIMARY = '#F97316';
const REVEAL_MS = 5000;
const RESOLVE_DELAY_MS = 1600;
const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;

function colorName(hex: string): string {
  return COLOR_MEMORY_PALETTE.find(c => c.hex === hex)?.name ?? '';
}

function getGridInfo(colorCount: number, screenWidth: number) {
  const cols = colorCount === 3 ? 3 : colorCount === 4 ? 2 : colorCount === 6 ? 3 : 4;
  const GAP = 8;
  const H_PAD = 24;
  const maxTile = colorCount <= 4 ? 80 : colorCount === 6 ? 70 : 60;
  const tile = Math.min(Math.floor((screenWidth - H_PAD * 2 - GAP * (cols - 1)) / cols), maxTile);
  return { cols, tile, GAP };
}

// ─── Player half ─────────────────────────────────────────────────────────────

function PlayerHalf({
  player,
  round,
  showingColors,
  isResolved,
  isRotated,
  gridInfo,
  onChoiceTap,
  questionPosition,
}: {
  player: ColorMemoryBattlePlayerState;
  round: { colors: string[]; choices: string[]; questionPosition: number; correctHex: string };
  showingColors: boolean;
  isResolved: boolean;
  isRotated: boolean;
  gridInfo: ReturnType<typeof getGridInfo>;
  onChoiceTap: (hex: string) => void;
  questionPosition: number;
}) {
  const accentColor = isRotated ? '#F72585' : CM_PRIMARY;
  const { cols, tile, GAP } = gridInfo;
  const colorCount = round.colors.length;

  const gridRows: number[][] = [];
  for (let i = 0; i < colorCount; i += cols) {
    gridRows.push(Array.from({ length: Math.min(cols, colorCount - i) }, (_, j) => i + j));
  }

  const canAnswer = !showingColors && !player.hasAnswered && !isResolved;

  return (
    <View style={[styles.half, isRotated && styles.rotated]}>
      {/* Header — shows immediate feedback when resolved */}
      <View style={styles.playerHeader}>
        {isResolved && player.hasAnswered ? (
          <Text style={[styles.feedbackLabel, { color: player.lastAnswerCorrect ? '#22C55E' : '#EF4444' }]}>
            {player.lastAnswerCorrect ? '✅  Correct!' : `❌  ${colorName(round.correctHex)}`}
          </Text>
        ) : (
          <View style={[styles.nameBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.nameText} numberOfLines={1}>{player.name}</Text>
          </View>
        )}
        <Text style={styles.scoreText}>⭐ {player.score}</Text>
      </View>

      {/* Color grid */}
      <View style={styles.gridArea}>
        <View style={{ gap: GAP }}>
          {gridRows.map((row, ri) => (
            <View key={ri} style={[styles.gridRow, { gap: GAP }]}>
              {row.map((posIdx) => {
                const isQ = !showingColors && posIdx === questionPosition;
                const bg = showingColors ? round.colors[posIdx] : '#6B7280';
                return (
                  <View
                    key={posIdx}
                    style={[
                      styles.tile,
                      {
                        width: tile,
                        height: tile,
                        backgroundColor: bg,
                        borderColor: isQ ? '#FFFFFF' : 'transparent',
                        borderWidth: isQ ? 2.5 : 0,
                      },
                    ]}
                  >
                    {isQ ? (
                      <Text style={styles.tileMark}>?</Text>
                    ) : (
                      <View style={styles.posLabel}>
                        <Text style={styles.posLabelText}>{posIdx + 1}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      {/* Choices (after reveal) */}
      {!showingColors && (
        <View style={styles.choices}>
          {round.choices.map((hex) => {
            const isSelected = player.selectedHex === hex;
            const isCorrectReveal = isResolved && hex === round.correctHex;
            const isWrongSelected = isSelected && hex !== round.correctHex;
            let borderColor = 'rgba(255,255,255,0.15)';
            let bgColor = 'rgba(255,255,255,0.08)';
            if (isCorrectReveal) { borderColor = '#22C55E'; bgColor = 'rgba(34,197,94,0.2)'; }
            else if (isWrongSelected) { borderColor = '#EF4444'; bgColor = 'rgba(239,68,68,0.25)'; }

            return (
              <TouchableOpacity
                key={hex}
                onPress={() => onChoiceTap(hex)}
                disabled={!canAnswer}
                activeOpacity={0.8}
                style={[styles.choiceBtn, { borderColor, borderWidth: 2, backgroundColor: bgColor }]}
              >
                <View style={[styles.swatch, { backgroundColor: hex }]} />
                <Text style={styles.choiceLabel}>{colorName(hex)}</Text>
                {isWrongSelected && (
                  <View style={[styles.choiceMark, styles.choiceMarkWrong]}>
                    <Text style={styles.choiceMarkText}>✕</Text>
                  </View>
                )}
                {isCorrectReveal && (
                  <View style={[styles.choiceMark, styles.choiceMarkCorrect]}>
                    <Text style={styles.choiceMarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ColorMemoryBattleGameScreen({ navigation }: Props) {
  const {
    config, rounds, currentIndex,
    player1, player2, phase, showingColors,
    initGame, hideColors, submitAnswer, resolveQuestion, nextQuestion, resetGame,
  } = useColorMemoryBattleStore();

  const { t } = useLanguageStore();
  const { C } = useTheme();
  const { width } = useWindowDimensions();

  const difficulty = config?.difficulty ?? 'easy';
  const { colorCount } = COLOR_MEMORY_SETTINGS[difficulty];
  const gridInfo = getGridInfo(colorCount, width);

  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);

  const [revealLeft, setRevealLeft] = useState(REVEAL_MS);
  const revealTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const revealStartRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);

  const clearReveal = useCallback(() => {
    if (revealTimerRef.current) { clearInterval(revealTimerRef.current); revealTimerRef.current = null; }
  }, []);

  useEffect(() => {
    if (!config) { navigation.replace('Home'); return; }
    initGame();
  }, []);

  // Intro countdown
  useEffect(() => {
    if (rounds.length === 0) return;
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
  }, [rounds.length]);

  // Reveal timer
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

  // Resolve after both answered or one correct
  useEffect(() => {
    if (phase !== 'active' || showingColors) return;
    if (player1.hasAnswered && player2.hasAnswered) {
      resolveQuestion();
    } else if (
      (player1.hasAnswered && player1.lastAnswerCorrect) ||
      (player2.hasAnswered && player2.lastAnswerCorrect)
    ) {
      resolveQuestion();
    }
  }, [player1.hasAnswered, player2.hasAnswered, phase, showingColors]);

  // Advance after resolve
  useEffect(() => {
    if (phase !== 'resolved') return;
    const id = setTimeout(nextQuestion, RESOLVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [phase, currentIndex]);

  useEffect(() => {
    if (phase === 'finished') navigation.replace('ColorMemoryBattleResult');
  }, [phase]);

  const handleChoiceTap = useCallback((position: PlayerPosition, hex: string) => {
    if (phase !== 'active' || showingColors) return;
    const responseMs = Date.now() - questionStartRef.current;
    const result = submitAnswer(position, hex, responseMs);
    if (result === 'correct') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (result === 'wrong' || result === 'both-answered') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [phase, showingColors, submitAnswer]);

  const handleQuit = useCallback(() => {
    Alert.alert(t.quitTitle, t.quitMessage, [
      { text: t.cancelAction, style: 'cancel' },
      {
        text: t.quitAction,
        style: 'destructive',
        onPress: () => {
          clearReveal();
          resetGame();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  }, [t, resetGame, navigation, clearReveal]);

  if (!config || rounds.length === 0) {
    return (
      <View style={[styles.root, { backgroundColor: C.screenBg }]}>
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: C.text }]}>{COUNTDOWN_STEPS[countdownStep]}</Text>
        </View>
      </View>
    );
  }

  const round = rounds[currentIndex];
  const isResolved = phase === 'resolved' || phase === 'finished';
  const revealProgress = Math.max(0, revealLeft / REVEAL_MS);

  return (
    <View style={[styles.root, { backgroundColor: C.screenBg }]}>

      {/* Intro countdown overlay */}
      {!countdownDone && (
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: C.text }]}>{COUNTDOWN_STEPS[countdownStep]}</Text>
        </View>
      )}

      {countdownDone && (
        <>
          {/* Player 2 — top, rotated */}
          <View style={styles.halfWrap}>
            <PlayerHalf
              player={player2}
              round={round}
              showingColors={showingColors}
              isResolved={isResolved}
              isRotated
              gridInfo={gridInfo}
              onChoiceTap={(hex) => handleChoiceTap('top', hex)}
              questionPosition={round.questionPosition}
            />
          </View>

          {/* Center bar */}
          <View style={[styles.center, { backgroundColor: C.screenBg }]}>
            <View style={[styles.centerLine, { backgroundColor: C.divider }]} />
            <View style={styles.centerRow}>
              {/* Reveal progress */}
              <View style={styles.timerSection}>
                <View style={[styles.timerTrack, { backgroundColor: C.surface }]}>
                  <View style={[
                    styles.timerFill,
                    { backgroundColor: showingColors ? CM_PRIMARY : C.timerGreen, width: `${(showingColors ? revealProgress : 1) * 100}%` },
                  ]} />
                </View>
                <Text style={[styles.timerLabel, { color: showingColors ? CM_PRIMARY : C.timerGreen }]}>
                  {showingColors ? `${Math.ceil(revealLeft / 1000)}s` : `${currentIndex + 1}/${config.totalQuestions}`}
                </Text>
              </View>

              {/* Question indicator (after reveal) */}
              {!showingColors && (
                <View style={[styles.questionBadge, { backgroundColor: CM_PRIMARY }]}>
                  <Text style={styles.questionBadgeText}>#{round.questionPosition + 1}</Text>
                </View>
              )}

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

          {/* Player 1 — bottom */}
          <View style={styles.halfWrap}>
            <PlayerHalf
              player={player1}
              round={round}
              showingColors={showingColors}
              isResolved={isResolved}
              isRotated={false}
              gridInfo={gridInfo}
              onChoiceTap={(hex) => handleChoiceTap('bottom', hex)}
              questionPosition={round.questionPosition}
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  halfWrap: { flex: 1, overflow: 'hidden' },

  countdownOverlay: {
    ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  countdownText: { fontSize: 120, fontWeight: '900' },

  center: { height: SIZES.centerBarHeight, justifyContent: 'center', gap: 4 },
  centerLine: { height: 1 },
  centerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 6 },

  timerSection: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  timerTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 3 },
  timerLabel: { fontSize: 11, fontWeight: '800', minWidth: 28 },

  questionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  questionBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },

  quitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  quitIcon: { fontSize: 10, fontWeight: '800' },
  quitLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },

  // Player half
  half: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 8,
    justifyContent: 'flex-start',
  },
  rotated: { transform: [{ rotate: '180deg' }] },

  playerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  nameBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 16 },
  nameText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  scoreText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  feedbackLabel: { fontSize: 13, fontWeight: '900', flex: 1 },

  gridArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridRow: { flexDirection: 'row' },
  tile: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  posLabel: {
    position: 'absolute', bottom: 3, right: 4,
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 8,
    paddingHorizontal: 4, paddingVertical: 1,
  },
  posLabelText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  tileMark: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },

  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 },
  choiceBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 6,
    position: 'relative',
  },
  swatch: { width: 28, height: 28, borderRadius: 6 },
  choiceLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', flex: 1 },
  choiceMark: {
    position: 'absolute', top: -8, right: -8,
    width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  choiceMarkWrong: { backgroundColor: '#EF4444' },
  choiceMarkCorrect: { backgroundColor: '#22C55E' },
  choiceMarkText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', lineHeight: 16 },

  correctMark: { fontSize: 26, textAlign: 'center', marginTop: 8 },
});
