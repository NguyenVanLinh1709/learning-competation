import { create } from 'zustand';
import type { SoloPhase } from '../types';

export type ColorMemoryDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export const COLOR_MEMORY_SETTINGS: Record<ColorMemoryDifficulty, { colorCount: number; showMs: number }> = {
  easy:   { colorCount: 3, showMs: 5000 },
  medium: { colorCount: 4, showMs: 5000 },
  hard:   { colorCount: 6, showMs: 5000 },
  expert: { colorCount: 8, showMs: 5000 },
};

export const COLOR_MEMORY_PALETTE: { hex: string; name: string }[] = [
  { hex: '#EF4444', name: 'Red' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#22C55E', name: 'Green' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#A855F7', name: 'Purple' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#14B8A6', name: 'Teal' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#06B6D4', name: 'Cyan' },
  { hex: '#EAB308', name: 'Yellow' },
  { hex: '#84CC16', name: 'Lime' },
];

export interface ColorMemoryRound {
  id: string;
  colors: string[];         // hex color at each position (0-indexed)
  questionPosition: number; // which position to ask about
  correctHex: string;
  choices: string[];        // 4 hex color options
}

export interface ColorMemoryConfig {
  playerName: string;
  difficulty: ColorMemoryDifficulty;
  totalQuestions: number;
  timeLimitMs: number; // answer time per question after colors hide (0 = unlimited)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateRounds(count: number, difficulty: ColorMemoryDifficulty): ColorMemoryRound[] {
  const { colorCount } = COLOR_MEMORY_SETTINGS[difficulty];
  return Array.from({ length: count }, (_, i) => {
    const selected = shuffle(COLOR_MEMORY_PALETTE).slice(0, colorCount);
    const colors = selected.map(c => c.hex);
    const questionPosition = Math.floor(Math.random() * colorCount);
    const correctHex = colors[questionPosition];
    const others = shuffle(COLOR_MEMORY_PALETTE.filter(c => c.hex !== correctHex));
    const choices = shuffle([correctHex, ...others.slice(0, 3).map(c => c.hex)]);
    return { id: `cm-${i}-${Date.now() + i}`, colors, questionPosition, correctHex, choices };
  });
}

interface ColorMemoryStore {
  config: ColorMemoryConfig | null;
  rounds: ColorMemoryRound[];
  currentIndex: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  responseTimes: number[];
  phase: SoloPhase;
  showingColors: boolean;
  lastAnswerCorrect: boolean | null;
  selectedHex: string | null;

  setConfig: (config: ColorMemoryConfig) => void;
  initGame: () => void;
  hideColors: () => void;
  submitAnswer: (hex: string, responseTimeMs: number) => 'correct' | 'wrong';
  timeoutAnswer: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

export const useColorMemoryStore = create<ColorMemoryStore>((set, get) => ({
  config: null,
  rounds: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  responseTimes: [],
  phase: 'idle',
  showingColors: false,
  lastAnswerCorrect: null,
  selectedHex: null,

  setConfig: (config) => set({ config }),

  initGame: () => {
    const { config } = get();
    if (!config) return;
    const rounds = generateRounds(config.totalQuestions, config.difficulty);
    set({
      rounds,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      responseTimes: [],
      phase: 'active',
      showingColors: true,
      lastAnswerCorrect: null,
      selectedHex: null,
    });
  },

  hideColors: () => {
    if (get().phase !== 'active') return;
    set({ showingColors: false });
  },

  submitAnswer: (hex, responseTimeMs) => {
    const { rounds, currentIndex, phase, showingColors } = get();
    if (phase !== 'active' || showingColors) return 'wrong';
    const round = rounds[currentIndex];
    const correct = hex === round.correctHex;
    if (correct) {
      set({
        selectedHex: hex,
        lastAnswerCorrect: true,
        score: get().score + 1,
        correctCount: get().correctCount + 1,
        responseTimes: [...get().responseTimes, responseTimeMs],
        phase: 'resolved',
      });
      return 'correct';
    }
    set({
      selectedHex: hex,
      lastAnswerCorrect: false,
      wrongCount: get().wrongCount + 1,
      phase: 'resolved',
    });
    return 'wrong';
  },

  timeoutAnswer: () => {
    const { phase, showingColors } = get();
    if (phase !== 'active' || showingColors) return;
    set({
      selectedHex: null,
      lastAnswerCorrect: false,
      wrongCount: get().wrongCount + 1,
      phase: 'resolved',
    });
  },

  nextQuestion: () => {
    const { currentIndex, config, rounds } = get();
    const next = currentIndex + 1;
    if (next >= (config?.totalQuestions ?? rounds.length)) {
      set({ phase: 'finished' });
      return;
    }
    set({
      currentIndex: next,
      phase: 'active',
      showingColors: true,
      lastAnswerCorrect: null,
      selectedHex: null,
    });
  },

  resetGame: () => set({
    config: null,
    rounds: [],
    currentIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    responseTimes: [],
    phase: 'idle',
    showingColors: false,
    lastAnswerCorrect: null,
    selectedHex: null,
  }),
}));
