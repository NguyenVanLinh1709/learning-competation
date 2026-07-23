import { create } from 'zustand';
import { generateMemoryRounds } from '../utils/memoryGenerator';
import type { MemoryRound } from '../utils/memoryGenerator';
import type { GamePhase, PlayerPosition } from '../types';

export interface MemoryBattleConfig {
  player1Name: string;
  player2Name: string;
  gridDim: number;      // grid is gridDim x gridDim tiles (2..11)
  steps: number;         // longest sequence length reached (2..21)
  totalQuestions: number;
  timeLimitMs: number;
}

export interface MemoryBattlePlayerState {
  name: string;
  position: PlayerPosition;
  score: number;
  correctCount: number;
  wrongCount: number;
  responseTimes: number[];
  hasAnswered: boolean;          // completed the sequence or locked out by a wrong tap
  inputIndex: number;            // how many correct taps so far this round
  lastAnswerCorrect: boolean | null;
  wrongTile: number | null;
}

interface MemoryBattleStore {
  config: MemoryBattleConfig | null;
  rounds: MemoryRound[];
  currentIndex: number;
  player1: MemoryBattlePlayerState;
  player2: MemoryBattlePlayerState;
  phase: GamePhase;

  gridSize: () => number;
  setConfig: (config: MemoryBattleConfig) => void;
  initGame: () => void;
  submitTap: (position: PlayerPosition, tile: number, responseTimeMs: number) => 'progress' | 'correct' | 'wrong' | 'both-wrong';
  resolveQuestion: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

const defaultPlayer = (name: string, position: PlayerPosition): MemoryBattlePlayerState => ({
  name,
  position,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  responseTimes: [],
  hasAnswered: false,
  inputIndex: 0,
  lastAnswerCorrect: null,
  wrongTile: null,
});

const emptyPlayer = (position: PlayerPosition) => defaultPlayer('', position);

export const useMemoryBattleStore = create<MemoryBattleStore>((set, get) => ({
  config: null,
  rounds: [],
  currentIndex: 0,
  player1: emptyPlayer('bottom'),
  player2: emptyPlayer('top'),
  phase: 'idle',

  gridSize: () => {
    const { config } = get();
    return config ? config.gridDim * config.gridDim : 4;
  },

  setConfig: (config) => set({ config }),

  initGame: () => {
    const { config } = get();
    if (!config) return;
    const rounds = generateMemoryRounds(config.totalQuestions, config.gridDim * config.gridDim, config.steps);
    set({
      rounds,
      currentIndex: 0,
      player1: defaultPlayer(config.player1Name, 'bottom'),
      player2: defaultPlayer(config.player2Name, 'top'),
      phase: 'active',
    });
  },

  submitTap: (position, tile, responseTimeMs) => {
    const { rounds, currentIndex, phase, player1, player2 } = get();
    if (phase !== 'active') return 'wrong';

    const isP1 = position === 'bottom';
    const player = isP1 ? player1 : player2;
    if (player.hasAnswered) return 'wrong';

    const sequence = rounds[currentIndex].sequence;
    const expected = sequence[player.inputIndex];
    const otherPlayer = isP1 ? player2 : player1;
    const write = (updated: Partial<MemoryBattlePlayerState>) =>
      set(isP1 ? { player1: { ...player1, ...updated } } : { player2: { ...player2, ...updated } });

    if (tile !== expected) {
      write({
        hasAnswered: true,
        lastAnswerCorrect: false,
        wrongTile: tile,
        wrongCount: player.wrongCount + 1,
      });
      return otherPlayer.hasAnswered ? 'both-wrong' : 'wrong';
    }

    const nextInput = player.inputIndex + 1;
    if (nextInput >= sequence.length) {
      write({
        inputIndex: nextInput,
        hasAnswered: true,
        lastAnswerCorrect: true,
        score: player.score + 1,
        correctCount: player.correctCount + 1,
        responseTimes: [...player.responseTimes, responseTimeMs],
      });
      return 'correct';
    }

    write({ inputIndex: nextInput });
    return 'progress';
  },

  resolveQuestion: () => set({ phase: 'resolved' }),

  nextQuestion: () => {
    const { currentIndex, config, rounds } = get();
    const next = currentIndex + 1;
    if (next >= (config?.totalQuestions ?? rounds.length)) {
      set({ phase: 'finished' });
      return;
    }
    const reset = { hasAnswered: false, inputIndex: 0, lastAnswerCorrect: null, wrongTile: null };
    set({
      currentIndex: next,
      phase: 'active',
      player1: { ...get().player1, ...reset },
      player2: { ...get().player2, ...reset },
    });
  },

  resetGame: () =>
    set({
      config: null,
      rounds: [],
      currentIndex: 0,
      player1: emptyPlayer('bottom'),
      player2: emptyPlayer('top'),
      phase: 'idle',
    }),
}));
