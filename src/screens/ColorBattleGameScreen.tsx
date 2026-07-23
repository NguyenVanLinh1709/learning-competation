import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorBattleStore } from '../store/colorBattleStore';
import type { ColorBattlePlayerState } from '../store/colorBattleStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import { TimerBar } from '../components/TimerBar';
import type { PlayerPosition, RootStackParamList } from '../types';
import { SIZES } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ColorBattleGame'> };

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;
const RESOLVE_DELAY_MS = 1500;
const TILE_GAP = 8;

// ─── Tile grid for one player ────────────────────────────────────────────────

function ColorTileGrid({
  tiles,
  oddIndex,
  player,
  phase,
  isRotated,
  tileSize,
  onTap,
}: {
  tiles: string[];
  oddIndex: number;
  player: ColorBattlePlayerState;
  phase: string;
  isRotated: boolean;
  tileSize: number;
  onTap: (idx: number) => void;
}) {
  const isResolved = phase === 'resolved' || phase === 'finished';
  // A player who answered wrong sees their own mistake immediately, while the
  // round stays active waiting for the opponent / timer. The correct tile stays
  // hidden until the round resolves so the still-playing opponent isn't shown it.
  const showWrongEarly = player.hasAnswered && player.lastAnswerCorrect === false && !isResolved;

  const getTileBorder = (idx: number) => {
    if (isResolved) {
      if (idx === oddIndex) return '#16A34A';
      if (idx === player.selectedIndex && idx !== oddIndex) return '#DC2626';
      return 'transparent';
    }
    if (showWrongEarly && idx === player.selectedIndex) return '#DC2626';
    return 'transparent';
  };

  const getTileOpacity = (idx: number) => {
    if (!isResolved) return 1;
    if (idx === oddIndex || idx === player.selectedIndex) return 1;
    return 0.3;
  };

  const grid = (
    <View style={[styles.tilesGrid, { gap: TILE_GAP }]}>
      {tiles.map((color, idx) => (
        <TouchableOpacity
          key={idx}
          activeOpacity={isResolved ? 1 : 0.85}
          onPress={() => onTap(idx)}
          disabled={isResolved || player.hasAnswered}
          style={[
            styles.tile,
            {
              width: tileSize,
              height: tileSize,
              backgroundColor: color,
              borderColor: getTileBorder(idx),
              opacity: getTileOpacity(idx),
            },
          ]}
        >
          {isResolved && idx === oddIndex && (
            <View style={styles.overlay}>
              <Text style={styles.overlayIcon}>✓</Text>
            </View>
          )}
          {(isResolved || showWrongEarly) && idx === player.selectedIndex && idx !== oddIndex && (
            <View style={[styles.overlay, styles.overlayWrong]}>
              <Text style={styles.overlayIcon}>✗</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.playerArea, isRotated && styles.rotated]}>
      <View style={styles.playerHeader}>
        <View style={[styles.nameBadge, { backgroundColor: isRotated ? '#F72585' : '#7C3AED' }]}>
          <Text style={styles.nameText} numberOfLines={1}>{player.name}</Text>
        </View>
        <Text style={styles.scoreText}>⭐ {player.score}</Text>
      </View>
      {grid}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ColorBattleGameScreen({ navigation }: Props) {
  const {
    config, questions, currentIndex,
    player1, player2, phase,
    initGame, submitAnswer, resolveQuestion, nextQuestion, resetGame,
  } = useColorBattleStore();

  const { t } = useLanguageStore();
  const { C } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const tileSize = Math.floor((width - 32 - TILE_GAP * 3) / 4);

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
    // timeLimitMs === 0 means unlimited — no countdown, question never times out.
    if (config.timeLimitMs <= 0) return;
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
    if (phase === 'finished') navigation.replace('ColorBattleResult');
  }, [phase]);

  const handleAnswer = useCallback(
    (position: PlayerPosition, tileIndex: number) => {
      if (phase !== 'active') return;
      const responseMs = Date.now() - questionStartRef.current;
      const result = submitAnswer(position, tileIndex, responseMs);

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
          navigation.reset({ index: 1, routes: [{ name: 'Home' }, { name: 'ColorBattleSetup' }] });
        },
      },
    ]);
  }, [t, resetGame, navigation]);

  if (!config || questions.length === 0) {
    // Show countdown while loading
    const label = COUNTDOWN_STEPS[countdownStep];
    return (
      <View style={[styles.root, { backgroundColor: C.screenBg }]}>
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: C.text }]}>{label}</Text>
        </View>
      </View>
    );
  }

  const question = questions[currentIndex];

  return (
    <View style={[styles.root, { backgroundColor: C.screenBg }]}>
      {/* Countdown overlay */}
      {!countdownDone && (
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: C.text }]}>
            {COUNTDOWN_STEPS[countdownStep]}
          </Text>
        </View>
      )}

      {countdownDone && (
        <>
          {/* Player 2 (top, rotated) */}
          <View style={[styles.half, { paddingTop: insets.top }]}>
            <ColorTileGrid
              tiles={question.tiles}
              oddIndex={question.oddIndex}
              player={player2}
              phase={phase}
              isRotated
              tileSize={tileSize}
              onTap={(idx) => handleAnswer('top', idx)}
            />
          </View>

          {/* Center bar */}
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

          {/* Player 1 (bottom) */}
          <View style={[styles.half, { paddingBottom: insets.bottom }]}>
            <ColorTileGrid
              tiles={question.tiles}
              oddIndex={question.oddIndex}
              player={player1}
              phase={phase}
              isRotated={false}
              tileSize={tileSize}
              onTap={(idx) => handleAnswer('bottom', idx)}
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  countdownText: { fontSize: 120, fontWeight: '900' },

  playerArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 10,
  },
  rotated: { transform: [{ rotate: '180deg' }] },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: '70%',
  },
  nameText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  scoreText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },

  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tile: {
    borderRadius: 12,
    borderWidth: 3,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22,163,74,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayWrong: { backgroundColor: 'rgba(220,38,38,0.4)' },
  overlayIcon: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
});
