import { create } from 'zustand';
import { GameConfig, GamePhase, PlayerPosition, PlayerState, Question } from '../types';
import { generateQuestions } from '../utils/questionGenerator';

interface GameStore {
  config: GameConfig | null;
  questions: Question[];
  currentIndex: number;
  player1: PlayerState;   // bottom (normal)
  player2: PlayerState;   // top (rotated 180°)
  phase: GamePhase;

  setConfig: (config: GameConfig) => void;
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
    name,
    position,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    responseTimes: [],
    hasAnswered: false,
    selectedIndex: null,
    lastAnswerCorrect: null,
  };
}

function resetPlayerRound(p: PlayerState): PlayerState {
  return { ...p, hasAnswered: false, selectedIndex: null, lastAnswerCorrect: null };
}

export const useGameStore = create<GameStore>((set, get) => ({
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
    const questions = generateQuestions(config.totalQuestions, config.difficulty, config.operation);
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
    const { currentIndex, questions } = state;
    const question = questions[currentIndex];
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

    set({ [key]: updated } as Partial<GameStore>);

    if (isCorrect) return 'correct';

    const otherPlayer = state[otherKey];
    if (otherPlayer.hasAnswered) return 'both-wrong';
    return 'wrong';
  },

  resolveQuestion: () => {
    const state = get();
    // Anyone who never answered this round (timed out, or the opponent
    // won the race first) is marked wrong so stats reflect every question.
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
      config: null,
      questions: [],
      currentIndex: 0,
      player1: makePlayer('Player 1', 'bottom'),
      player2: makePlayer('Player 2', 'top'),
      phase: 'idle',
    }),
}));
