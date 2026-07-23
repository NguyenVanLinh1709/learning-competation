import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemoryBattleStore } from '../store/memoryBattleStore';
import type { MemoryBattlePlayerState } from '../store/memoryBattleStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import { TimerBar } from '../components/TimerBar';
import { MEMORY_SETTINGS, TILE_COLORS, memoryGridCols } from '../utils/memoryShared';
import type { PlayerPosition, RootStackParamList } from '../types';
import { SIZES } from '../constants/theme';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'MemoryBattleGame'> };

const COUNTDOWN_STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 800;
const RESOLVE_DELAY_MS = 1600;
const SHOW_START_DELAY = 550;

// ─── One player's tile grid ──────────────────────────────────────────────────

function MemoryGrid({
  gridSize,
  cols,
  tileSize,
  flashTile,
  tapFlash,
  player,
  showing,
  isResolved,
  isRotated,
  onTap,
  label,
}: {
  gridSize: number;
  cols: number;
  tileSize: number;
  flashTile: number | null;
  tapFlash: number | null;
  player: MemoryBattlePlayerState;
  showing: boolean;
  isResolved: boolean;
  isRotated: boolean;
  onTap: (tile: number) => void;
  label: string;
}) {
  const disabled = showing || player.hasAnswered || isResolved;

  return (
    <View style={[styles.playerArea, isRotated && styles.rotated]}>
      <View style={styles.playerHeader}>
        <View style={[styles.nameBadge, { backgroundColor: isRotated ? '#F72585' : '#6366F1' }]}>
          <Text style={styles.nameText} numberOfLines={1}>{player.name}</Text>
        </View>
        <Text style={styles.statusText}>{label}</Text>
        <Text style={styles.scoreText}>⭐ {player.score}</Text>
      </View>

      <View style={styles.gridWrap}>
        <View style={[styles.grid, { width: cols * tileSize + (cols - 1) * 10, gap: 10 }]}>
          {Array.from({ length: gridSize }, (_, idx) => {
            const lit = flashTile === idx || tapFlash === idx;
            const isWrong = isResolved && player.wrongTile === idx;
            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.9}
                onPress={() => onTap(idx)}
                disabled={disabled}
                style={[
                  styles.tile,
                  {
                    width: tileSize,
                    height: tileSize,
                    backgroundColor: TILE_COLORS[idx],
                    opacity: lit ? 1 : 0.26,
                    borderColor: isWrong ? '#DC2626' : lit ? '#FFFFFF' : 'transparent',
                  },
                ]}
              >
                {isWrong && <Text style={styles.tileMark}>✗</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function MemoryBattleGameScreen({ navigation }: Props) {
  const {
    config, rounds, currentIndex,
    player1, player2, phase,
    initGame, submitTap, resolveQuestion, nextQuestion, resetGame,
  } = useMemoryBattleStore();

  const { t } = useLanguageStore();
  const { C } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const difficulty = config?.difficulty ?? 'easy';
  const { gridSize, flashMs } = MEMORY_SETTINGS[difficulty];
  const cols = memoryGridCols(gridSize);
  const rawTile = Math.floor((width - 32 - (cols - 1) * 10) / cols);
  const tileSizeCap = gridSize <= 4 ? 96 : gridSize <= 9 ? 78 : gridSize <= 16 ? 58 : 46;
  const tileSize = Math.min(rawTile, tileSizeCap);

  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);

  const [flashTile, setFlashTile] = useState<number | null>(null);
  const [tapP1, setTapP1] = useState<number | null>(null);
  const [tapP2, setTapP2] = useState<number | null>(null);
  const [inputOpen, setInputOpen] = useState(false);

  const [remainingMs, setRemainingMs] = useState(config?.timeLimitMs ?? 15000);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const onTimeUpRef = useRef<() => void>(() => {});
  onTimeUpRef.current = () => { setInputOpen(false); resolveQuestion(); };

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

  // Countdown intro
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

  // Show the sequence on both grids, then open input.
  useEffect(() => {
    if (phase !== 'active' || !countdownDone || rounds.length === 0) return;
    const sequence = rounds[currentIndex].sequence;
    let cancelled = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    setInputOpen(false);
    setFlashTile(null);
    setTapP1(null);
    setTapP2(null);

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

  useEffect(() => {
    if (phase !== 'resolved') return;
    const id = setTimeout(nextQuestion, RESOLVE_DELAY_MS);
    return () => clearTimeout(id);
  }, [phase, currentIndex]);

  useEffect(() => {
    if (phase === 'finished') navigation.replace('MemoryBattleResult');
  }, [phase]);

  const handleTap = useCallback(
    (position: PlayerPosition, tile: number) => {
      if (!inputOpen || phase !== 'active') return;
      const setTap = position === 'bottom' ? setTapP1 : setTapP2;
      setTap(tile);
      setTimeout(() => setTap((cur) => (cur === tile ? null : cur)), 180);

      const responseMs = Date.now() - questionStartRef.current;
      const result = submitTap(position, tile, responseMs);

      if (result === 'progress') {
        Haptics.selectionAsync();
      } else if (result === 'correct') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        clearTimer();
        setInputOpen(false);
        resolveQuestion();
      } else if (result === 'both-wrong') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        clearTimer();
        setInputOpen(false);
        resolveQuestion();
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
    [inputOpen, phase, submitTap, resolveQuestion, clearTimer],
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

  if (!config || rounds.length === 0) {
    const label = COUNTDOWN_STEPS[countdownStep];
    return (
      <View style={[styles.root, { backgroundColor: C.screenBg }]}>
        <View style={styles.countdownOverlay}>
          <Text style={[styles.countdownText, { color: C.text }]}>{label}</Text>
        </View>
      </View>
    );
  }

  const round = rounds[currentIndex];
  const isResolved = phase === 'resolved' || phase === 'finished';
  const showing = !inputOpen && !isResolved;

  const statusFor = (p: MemoryBattlePlayerState): string => {
    if (showing) return `👀 ${round.sequence.length}`;
    if (isResolved) return p.lastAnswerCorrect ? '✅' : p.hasAnswered ? '❌' : '⏱';
    if (p.hasAnswered) return p.lastAnswerCorrect ? '✅' : '❌';
    return `${p.inputIndex}/${round.sequence.length}`;
  };

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
          {/* Player 2 (top, rotated) */}
          <View style={[styles.half, { paddingTop: insets.top }]}>
            <MemoryGrid
              gridSize={gridSize}
              cols={cols}
              tileSize={tileSize}
              flashTile={flashTile}
              tapFlash={tapP2}
              player={player2}
              showing={showing}
              isResolved={isResolved}
              isRotated
              onTap={(tile) => handleTap('top', tile)}
              label={statusFor(player2)}
            />
          </View>

          {/* Center bar */}
          <View style={[styles.center, { backgroundColor: C.screenBg }]}>
            <View style={[styles.centerLine, { backgroundColor: C.divider }]} />
            <View style={styles.centerRow}>
              <View style={{ flex: 1 }}>
                <TimerBar
                  remainingMs={showing ? config.timeLimitMs : remainingMs}
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
            <MemoryGrid
              gridSize={gridSize}
              cols={cols}
              tileSize={tileSize}
              flashTile={flashTile}
              tapFlash={tapP1}
              player={player1}
              showing={showing}
              isResolved={isResolved}
              isRotated={false}
              onTap={(tile) => handleTap('bottom', tile)}
              label={statusFor(player1)}
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
    maxWidth: '50%',
  },
  nameText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  statusText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  scoreText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },

  gridWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  tile: {
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileMark: { fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
});
