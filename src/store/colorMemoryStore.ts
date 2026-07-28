import { create } from 'zustand';
import type { SoloPhase } from '../types';

// User-facing bounds for the Color Memory grid-size slider (grid is N×N).
export const COLOR_MEMORY_GRID_DIM_MIN = 2;
export const COLOR_MEMORY_GRID_DIM_MAX = 11;

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
  { hex: '#6366F1', name: 'Indigo' },
  { hex: '#D946EF', name: 'Fuchsia' },
  { hex: '#10B981', name: 'Emerald' },
  { hex: '#F43F5E', name: 'Rose' },
  { hex: '#0EA5E9', name: 'Sky' },
  { hex: '#8B5CF6', name: 'Violet' },
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
  gridDim: number; // grid is gridDim x gridDim tiles (2..11)
  totalQuestions: number;
  timeLimitMs: number; // how long colors are shown to memorize, per question
}

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
    const rounds = generateRounds(config.totalQuestions, config.gridDim * config.gridDim);
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
