import { create } from 'zustand';
import { generateMemoryRounds, MEMORY_SETTINGS } from '../utils/memoryGenerator';
import type { MemoryRound, MemoryDifficulty } from '../utils/memoryGenerator';
import type { SoloPhase } from '../types';

export interface MemoryConfig {
  playerName: string;
  difficulty: MemoryDifficulty;
  totalQuestions: number;
  timeLimitMs: number; // input time per round (0 = unlimited)
}

interface MemoryStore {
  config: MemoryConfig | null;
  rounds: MemoryRound[];
  currentIndex: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  responseTimes: number[];
  phase: SoloPhase;
  inputIndex: number;            // how many correct taps so far this round
  lastAnswerCorrect: boolean | null;
  wrongTile: number | null;      // the tile the player got wrong (for feedback)

  gridSize: () => number;
  setConfig: (config: MemoryConfig) => void;
  initGame: () => void;
  submitTap: (tile: number, responseTimeMs: number) => 'progress' | 'correct' | 'wrong';
  failByTimeout: () => void;
  resolveQuestion: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

export const useMemoryStore = create<MemoryStore>((set, get) => ({
  config: null,
  rounds: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  responseTimes: [],
  phase: 'idle',
  inputIndex: 0,
  lastAnswerCorrect: null,
  wrongTile: null,

  gridSize: () => {
    const { config } = get();
    return config ? MEMORY_SETTINGS[config.difficulty].gridSize : 4;
  },

  setConfig: (config) => set({ config }),

  initGame: () => {
    const { config } = get();
    if (!config) return;
    const rounds = generateMemoryRounds(config.totalQuestions, config.difficulty);
    set({
      rounds,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      responseTimes: [],
      phase: 'active',
      inputIndex: 0,
      lastAnswerCorrect: null,
      wrongTile: null,
    });
  },

  submitTap: (tile, responseTimeMs) => {
    const { rounds, currentIndex, phase, inputIndex } = get();
    if (phase !== 'active') return 'wrong';
    const sequence = rounds[currentIndex].sequence;
    const expected = sequence[inputIndex];

    if (tile !== expected) {
      set({
        lastAnswerCorrect: false,
        wrongTile: tile,
        wrongCount: get().wrongCount + 1,
      });
      return 'wrong';
    }

    const nextInput = inputIndex + 1;
    if (nextInput >= sequence.length) {
      set({
        inputIndex: nextInput,
        lastAnswerCorrect: true,
        score: get().score + 1,
        correctCount: get().correctCount + 1,
        responseTimes: [...get().responseTimes, responseTimeMs],
      });
      return 'correct';
    }

    set({ inputIndex: nextInput });
    return 'progress';
  },

  failByTimeout: () => {
    const { phase } = get();
    if (phase !== 'active') return;
    set({ lastAnswerCorrect: false, wrongCount: get().wrongCount + 1 });
  },

  resolveQuestion: () => set({ phase: 'resolved' }),

  nextQuestion: () => {
    const { currentIndex, config, rounds } = get();
    const next = currentIndex + 1;
    if (next >= (config?.totalQuestions ?? rounds.length)) {
      set({ phase: 'finished' });
      return;
    }
    set({ currentIndex: next, phase: 'active', inputIndex: 0, lastAnswerCorrect: null, wrongTile: null });
  },

  resetGame: () =>
    set({
      config: null,
      rounds: [],
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      responseTimes: [],
      phase: 'idle',
      inputIndex: 0,
      lastAnswerCorrect: null,
      wrongTile: null,
    }),
}));
