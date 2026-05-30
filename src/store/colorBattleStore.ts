import { create } from 'zustand';
import { generateColorPerceptionQuestions } from '../utils/colorPerceptionGenerator';
import type { ColorPerceptionQuestion, ColorDifficulty } from '../utils/colorPerceptionGenerator';
import type { GamePhase, PlayerPosition } from '../types';

export interface ColorBattleConfig {
  player1Name: string;
  player2Name: string;
  difficulty: ColorDifficulty;
  totalQuestions: number;
  timeLimitMs: number;
}

export interface ColorBattlePlayerState {
  name: string;
  position: PlayerPosition;
  score: number;
  correctCount: number;
  wrongCount: number;
  responseTimes: number[];
  hasAnswered: boolean;
  selectedIndex: number | null;
  lastAnswerCorrect: boolean | null;
}

interface ColorBattleStore {
  config: ColorBattleConfig | null;
  questions: ColorPerceptionQuestion[];
  currentIndex: number;
  player1: ColorBattlePlayerState;
  player2: ColorBattlePlayerState;
  phase: GamePhase;

  setConfig: (config: ColorBattleConfig) => void;
  initGame: () => void;
  submitAnswer: (position: PlayerPosition, tileIndex: number, responseTimeMs: number) => 'correct' | 'wrong' | 'both-wrong';
  resolveQuestion: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

const defaultPlayer = (name: string, position: PlayerPosition): ColorBattlePlayerState => ({
  name,
  position,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  responseTimes: [],
  hasAnswered: false,
  selectedIndex: null,
  lastAnswerCorrect: null,
});

const emptyPlayer = (position: PlayerPosition) => defaultPlayer('', position);

export const useColorBattleStore = create<ColorBattleStore>((set, get) => ({
  config: null,
  questions: [],
  currentIndex: 0,
  player1: emptyPlayer('bottom'),
  player2: emptyPlayer('top'),
  phase: 'idle',

  setConfig: (config) => set({ config }),

  initGame: () => {
    const { config } = get();
    if (!config) return;
    const questions = generateColorPerceptionQuestions(config.totalQuestions, config.difficulty);
    set({
      questions,
      currentIndex: 0,
      player1: defaultPlayer(config.player1Name, 'bottom'),
      player2: defaultPlayer(config.player2Name, 'top'),
      phase: 'active',
    });
  },

  submitAnswer: (position, tileIndex, responseTimeMs) => {
    const { currentIndex, questions, phase, player1, player2 } = get();
    if (phase !== 'active') return 'wrong';

    const question = questions[currentIndex];
    const isCorrect = tileIndex === question.oddIndex;
    const isP1 = position === 'bottom';
    const player = isP1 ? player1 : player2;
    if (player.hasAnswered) return 'wrong';

    const updated: Partial<ColorBattlePlayerState> = {
      hasAnswered: true,
      selectedIndex: tileIndex,
      lastAnswerCorrect: isCorrect,
      score: isCorrect ? player.score + 1 : player.score,
      correctCount: isCorrect ? player.correctCount + 1 : player.correctCount,
      wrongCount: !isCorrect ? player.wrongCount + 1 : player.wrongCount,
      responseTimes: isCorrect ? [...player.responseTimes, responseTimeMs] : player.responseTimes,
    };

    const otherPlayer = isP1 ? player2 : player1;
    const bothAnswered = otherPlayer.hasAnswered;

    set(isP1
      ? { player1: { ...player1, ...updated } }
      : { player2: { ...player2, ...updated } },
    );

    if (isCorrect) return 'correct';
    if (bothAnswered) return 'both-wrong';
    return 'wrong';
  },

  resolveQuestion: () => set({ phase: 'resolved' }),

  nextQuestion: () => {
    const { currentIndex, config, questions } = get();
    const next = currentIndex + 1;
    if (next >= (config?.totalQuestions ?? questions.length)) {
      set({ phase: 'finished' });
      return;
    }
    set({
      currentIndex: next,
      phase: 'active',
      player1: { ...get().player1, hasAnswered: false, selectedIndex: null, lastAnswerCorrect: null },
      player2: { ...get().player2, hasAnswered: false, selectedIndex: null, lastAnswerCorrect: null },
    });
  },

  resetGame: () =>
    set({
      config: null,
      questions: [],
      currentIndex: 0,
      player1: emptyPlayer('bottom'),
      player2: emptyPlayer('top'),
      phase: 'idle',
    }),
}));
