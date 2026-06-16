import { create } from 'zustand';
import { generateFlagQuestions } from '../utils/flagGenerator';
import type { FlagQuestion, FlagBattleConfig, GamePhase, PlayerPosition } from '../types';

export interface FlagBattlePlayerState {
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

interface FlagBattleStore {
  config: FlagBattleConfig | null;
  questions: FlagQuestion[];
  currentIndex: number;
  player1: FlagBattlePlayerState;
  player2: FlagBattlePlayerState;
  phase: GamePhase;

  setConfig: (config: FlagBattleConfig) => void;
  initGame: () => void;
  submitAnswer: (position: PlayerPosition, choiceIndex: number, responseTimeMs: number) => 'correct' | 'wrong' | 'both-wrong';
  resolveQuestion: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

const defaultPlayer = (name: string, position: PlayerPosition): FlagBattlePlayerState => ({
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

export const useFlagBattleStore = create<FlagBattleStore>((set, get) => ({
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
    const questions = generateFlagQuestions(config.totalQuestions, config.difficulty);
    set({
      questions,
      currentIndex: 0,
      player1: defaultPlayer(config.player1Name, 'bottom'),
      player2: defaultPlayer(config.player2Name, 'top'),
      phase: 'active',
    });
  },

  submitAnswer: (position, choiceIndex, responseTimeMs) => {
    const { currentIndex, questions, phase, player1, player2 } = get();
    if (phase !== 'active') return 'wrong';

    const question = questions[currentIndex];
    const isCorrect = choiceIndex === question.correctIndex;
    const isP1 = position === 'bottom';
    const player = isP1 ? player1 : player2;
    if (player.hasAnswered) return 'wrong';

    const updated: Partial<FlagBattlePlayerState> = {
      hasAnswered: true,
      selectedIndex: choiceIndex,
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
