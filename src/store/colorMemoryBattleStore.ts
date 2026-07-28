import { create } from 'zustand';
import { COLOR_MEMORY_PALETTE } from './colorMemoryStore';
import type { ColorMemoryRound } from './colorMemoryStore';
import type { GamePhase, PlayerPosition } from '../types';

export interface ColorMemoryBattleConfig {
  player1Name: string;
  player2Name: string;
  gridDim: number; // grid is gridDim x gridDim tiles (2..11)
  totalQuestions: number;
  timeLimitMs: number; // how long colors are shown to memorize, per question
}

export interface ColorMemoryBattlePlayerState {
  name: string;
  position: PlayerPosition;
  score: number;
  correctCount: number;
  wrongCount: number;
  responseTimes: number[];
  hasAnswered: boolean;
  lastAnswerCorrect: boolean | null;
  selectedHex: string | null;
}

interface ColorMemoryBattleStore {
  config: ColorMemoryBattleConfig | null;
  rounds: ColorMemoryRound[];
  currentIndex: number;
  player1: ColorMemoryBattlePlayerState;
  player2: ColorMemoryBattlePlayerState;
  phase: GamePhase;
  showingColors: boolean;

  setConfig: (config: ColorMemoryBattleConfig) => void;
  initGame: () => void;
  hideColors: () => void;
  submitAnswer: (position: PlayerPosition, hex: string, responseTimeMs: number) => 'correct' | 'wrong' | 'both-answered';
  resolveQuestion: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

const defaultPlayer = (name: string, position: PlayerPosition): ColorMemoryBattlePlayerState => ({
  name,
  position,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  responseTimes: [],
  hasAnswered: false,
  lastAnswerCorrect: null,
  selectedHex: null,
});

const emptyPlayer = (position: PlayerPosition) => defaultPlayer('', position);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// colorCount can exceed the palette size (up to 121 for an 11x11 grid), so
// tiles are sampled with replacement — colors may repeat across the grid.
function generateRounds(count: number, colorCount: number): ColorMemoryRound[] {
  return Array.from({ length: count }, (_, i) => {
    const colors = Array.from(
      { length: colorCount },
      () => COLOR_MEMORY_PALETTE[Math.floor(Math.random() * COLOR_MEMORY_PALETTE.length)].hex,
    );
    const questionPosition = Math.floor(Math.random() * colorCount);
    const correctHex = colors[questionPosition];
    const others = shuffle(COLOR_MEMORY_PALETTE.filter(c => c.hex !== correctHex));
    const choices = shuffle([correctHex, ...others.slice(0, 3).map(c => c.hex)]);
    return { id: `cmb-${i}-${Date.now() + i}`, colors, questionPosition, correctHex, choices };
  });
}

export const useColorMemoryBattleStore = create<ColorMemoryBattleStore>((set, get) => ({
  config: null,
  rounds: [],
  currentIndex: 0,
  player1: emptyPlayer('bottom'),
  player2: emptyPlayer('top'),
  phase: 'idle',
  showingColors: false,

  setConfig: (config) => set({ config }),

  initGame: () => {
    const { config } = get();
    if (!config) return;
    const rounds = generateRounds(config.totalQuestions, config.gridDim * config.gridDim);
    set({
      rounds,
      currentIndex: 0,
      player1: defaultPlayer(config.player1Name, 'bottom'),
      player2: defaultPlayer(config.player2Name, 'top'),
      phase: 'active',
      showingColors: true,
    });
  },

  hideColors: () => {
    if (get().phase !== 'active') return;
    set({ showingColors: false });
  },

  submitAnswer: (position, hex, responseTimeMs) => {
    const { phase, showingColors, player1, player2 } = get();
    if (phase !== 'active' || showingColors) return 'wrong';

    const isP1 = position === 'bottom';
    const player = isP1 ? player1 : player2;
    if (player.hasAnswered) return 'wrong';

    const round = get().rounds[get().currentIndex];
    const correct = hex === round.correctHex;
    const write = (updated: Partial<ColorMemoryBattlePlayerState>) =>
      set(isP1 ? { player1: { ...player1, ...updated } } : { player2: { ...player2, ...updated } });

    const otherPlayer = isP1 ? player2 : player1;

    if (correct) {
      write({
        hasAnswered: true,
        selectedHex: hex,
        lastAnswerCorrect: true,
        score: player.score + 1,
        correctCount: player.correctCount + 1,
        responseTimes: [...player.responseTimes, responseTimeMs],
      });
      return 'correct';
    }

    write({
      hasAnswered: true,
      selectedHex: hex,
      lastAnswerCorrect: false,
      wrongCount: player.wrongCount + 1,
    });
    return otherPlayer.hasAnswered ? 'both-answered' : 'wrong';
  },

  resolveQuestion: () => set({ phase: 'resolved' }),

  nextQuestion: () => {
    const { currentIndex, config, rounds } = get();
    const next = currentIndex + 1;
    if (next >= (config?.totalQuestions ?? rounds.length)) {
      set({ phase: 'finished' });
      return;
    }
    const reset = { hasAnswered: false, lastAnswerCorrect: null, selectedHex: null };
    set({
      currentIndex: next,
      phase: 'active',
      showingColors: true,
      player1: { ...get().player1, ...reset },
      player2: { ...get().player2, ...reset },
    });
  },

  resetGame: () => set({
    config: null,
    rounds: [],
    currentIndex: 0,
    player1: emptyPlayer('bottom'),
    player2: emptyPlayer('top'),
    phase: 'idle',
    showingColors: false,
  }),
}));
