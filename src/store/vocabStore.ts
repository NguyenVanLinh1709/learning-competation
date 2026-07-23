import { create } from 'zustand';
import type { GamePhase, PlayerPosition, PlayerState, VocabGameConfig, VocabQuestion } from '../types';
import { generateVocabQuestions, generateOddOneOutQuestions } from '../utils/vocabQuestionGenerator';

interface VocabStore {
  config: VocabGameConfig | null;
  questions: VocabQuestion[];
  currentIndex: number;
  player1: PlayerState;
  player2: PlayerState;
  phase: GamePhase;

  setConfig: (config: VocabGameConfig) => void;
  initGame: () => void;
  submitAnswer: (
    position: PlayerPosition,
    choiceIndex: number,
    responseTimeMs: number,
  ) => 'correct' | 'wrong' | 'both-wrong';
  resolveQuestion: () => void;
  nextQuestion: () => void;
  resetGame: () => void;
}

function makePlayer(name: string, position: PlayerPosition): PlayerState {
  return {
    name, position, score: 0,
    correctCount: 0, wrongCount: 0,
    responseTimes: [], hasAnswered: false,
    selectedIndex: null, lastAnswerCorrect: null,
  };
}

function resetPlayerRound(p: PlayerState): PlayerState {
  return { ...p, hasAnswered: false, selectedIndex: null, lastAnswerCorrect: null };
}

export const useVocabStore = create<VocabStore>((set, get) => ({
  config: null,
  questions: [],
  currentIndex: 0,
  player1: makePlayer('Player 1', 'bottom'),
  player2: makePlayer('Player 2', 'top'),
  phase: 'idle',

  setConfig: (config) => set({ config }),

  initGame: () => {
    const { config } = get();
    if (!config) return;
    const questions = config.vocabMode === 'odd_one_out'
      ? generateOddOneOutQuestions(config.totalQuestions, config.difficulty)
      : generateVocabQuestions(config.totalQuestions, config.difficulty);
    set({
      questions,
      currentIndex: 0,
      player1: makePlayer(config.player1Name, 'bottom'),
      player2: makePlayer(config.player2Name, 'top'),
      phase: 'active',
    });
  },

  submitAnswer: (position, choiceIndex, responseTimeMs) => {
    const state = get();
    if (state.phase !== 'active') return 'wrong';
    const question = state.questions[state.currentIndex];
    const isCorrect = choiceIndex === question.correctIndex;

    const key = position === 'bottom' ? 'player1' : 'player2';
    const otherKey = position === 'bottom' ? 'player2' : 'player1';
    const player = state[key];

    if (player.hasAnswered) return 'wrong';

    const updated: PlayerState = {
      ...player,
      hasAnswered: true,
      selectedIndex: choiceIndex,
      lastAnswerCorrect: isCorrect,
      score: isCorrect ? player.score + 1 : player.score,
      correctCount: isCorrect ? player.correctCount + 1 : player.correctCount,
      wrongCount: !isCorrect ? player.wrongCount + 1 : player.wrongCount,
      responseTimes: isCorrect ? [...player.responseTimes, responseTimeMs] : player.responseTimes,
    };

    set({ [key]: updated } as Partial<VocabStore>);

    if (isCorrect) return 'correct';
    if (state[otherKey].hasAnswered) return 'both-wrong';
    return 'wrong';
  },

  resolveQuestion: () => {
    const state = get();
    const markUnanswered = (p: PlayerState): PlayerState =>
      p.hasAnswered ? p : { ...p, hasAnswered: true, wrongCount: p.wrongCount + 1 };
    set({
      phase: 'resolved',
      player1: markUnanswered(state.player1),
      player2: markUnanswered(state.player2),
    });
  },

  nextQuestion: () => {
    const { currentIndex, config, questions } = get();
    const next = currentIndex + 1;
    if (next >= (config?.totalQuestions ?? questions.length)) {
      set({ phase: 'finished' });
      return;
    }
    set((s) => ({
      currentIndex: next,
      phase: 'active',
      player1: resetPlayerRound(s.player1),
      player2: resetPlayerRound(s.player2),
    }));
  },

  resetGame: () =>
    set({
      config: null, questions: [], currentIndex: 0,
      player1: makePlayer('Player 1', 'bottom'),
      player2: makePlayer('Player 2', 'top'),
      phase: 'idle',
    }),
}));
