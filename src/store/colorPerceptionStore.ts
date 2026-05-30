import { create } from 'zustand';
import { generateColorPerceptionQuestions } from '../utils/colorPerceptionGenerator';
import type { ColorPerceptionQuestion, ColorDifficulty } from '../utils/colorPerceptionGenerator';
import type { SoloPhase } from '../types';

export interface ColorPerceptionConfig {
  playerName: string;
  difficulty: ColorDifficulty;
  totalQuestions: number;
  timeLimitMs: number; // 0 = unlimited
}

interface ColorPerceptionStore {
  config: ColorPerceptionConfig | null;
  questions: ColorPerceptionQuestion[];
  currentIndex: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  responseTimes: number[];
  phase: SoloPhase;
  selectedIndex: number | null;
  lastAnswerCorrect: boolean | null;

  setConfig: (config: ColorPerceptionConfig) => void;
  initGame: () => void;
  submitAnswer: (tileIndex: number, responseTimeMs: number) => 'correct' | 'wrong';
  resolveQuestion: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

export const useColorPerceptionStore = create<ColorPerceptionStore>((set, get) => ({
  config: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  responseTimes: [],
  phase: 'idle',
  selectedIndex: null,
  lastAnswerCorrect: null,

  setConfig: (config) => set({ config }),

  initGame: () => {
    const { config } = get();
    if (!config) return;
    const questions = generateColorPerceptionQuestions(config.totalQuestions, config.difficulty);
    set({
      questions,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      responseTimes: [],
      phase: 'active',
      selectedIndex: null,
      lastAnswerCorrect: null,
    });
  },

  submitAnswer: (tileIndex, responseTimeMs) => {
    const { currentIndex, questions, phase } = get();
    if (phase !== 'active') return 'wrong';
    const question = questions[currentIndex];
    const isCorrect = tileIndex === question.oddIndex;
    set({
      selectedIndex: tileIndex,
      lastAnswerCorrect: isCorrect,
      score: isCorrect ? get().score + 1 : get().score,
      correctCount: isCorrect ? get().correctCount + 1 : get().correctCount,
      wrongCount: !isCorrect ? get().wrongCount + 1 : get().wrongCount,
      responseTimes: isCorrect ? [...get().responseTimes, responseTimeMs] : get().responseTimes,
    });
    return isCorrect ? 'correct' : 'wrong';
  },

  resolveQuestion: () => set({ phase: 'resolved' }),

  nextQuestion: () => {
    const { currentIndex, config, questions } = get();
    const next = currentIndex + 1;
    if (next >= (config?.totalQuestions ?? questions.length)) {
      set({ phase: 'finished' });
      return;
    }
    set({ currentIndex: next, phase: 'active', selectedIndex: null, lastAnswerCorrect: null });
  },

  resetGame: () =>
    set({
      config: null,
      questions: [],
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      responseTimes: [],
      phase: 'idle',
      selectedIndex: null,
      lastAnswerCorrect: null,
    }),
}));
