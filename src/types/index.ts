export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed';
export type GamePhase = 'idle' | 'active' | 'resolved' | 'finished';
export type PlayerPosition = 'bottom' | 'top';
export type AnswerButtonState = 'idle' | 'correct' | 'wrong' | 'disabled';

export interface Question {
  id: string;
  text: string;
  choices: string[];
  correctIndex: number;
  difficulty: DifficultyLevel;
  operation: MathOperation;
}

export interface PlayerState {
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

export interface GameConfig {
  totalQuestions: number;
  timeLimitMs: number;
  difficulty: DifficultyLevel;
  operation: MathOperation;
  player1Name: string;
  player2Name: string;
}

export interface SoloConfig {
  playerName: string;
  difficulty: DifficultyLevel;
  operation: MathOperation;
  totalQuestions: number;
  timeLimitMs: number; // 0 = unlimited
}

export type SoloPhase = 'idle' | 'active' | 'resolved' | 'finished';

export type RootStackParamList = {
  Home: undefined;
  Setup: undefined;
  Countdown: undefined;
  Game: undefined;
  Result: undefined;
  SoloSetup: undefined;
  SoloGame: undefined;
  SoloResult: undefined;
  VocabSetup: undefined;
  VocabCountdown: undefined;
  VocabGame: undefined;
  VocabResult: undefined;
  Feedback: undefined;
};

// ─── Vocabulary Battle ───────────────────────────────────────────────────────

export type VocabDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export type VocabCategory =
  | 'animals' | 'fruits' | 'colors' | 'school'
  | 'actions' | 'family' | 'body'   | 'food'
  | 'places'  | 'transport' | 'weather' | 'verbs'
  | 'adjectives';

export type VocabDirection = 'en_to_vi' | 'vi_to_en';

export interface VocabWord {
  id: string;
  en: string;
  vi: string;
  category: VocabCategory;
  difficulty: 1 | 2 | 3 | 4;
  emoji?: string;
}

export interface VocabQuestion {
  id: string;
  text: string;
  emoji?: string;
  choices: string[];
  correctIndex: number;
  direction: VocabDirection;
  wordId: string;
  category: VocabCategory;
  difficulty: 1 | 2 | 3 | 4;
}

export interface VocabGameConfig {
  totalQuestions: number;
  timeLimitMs: number;
  difficulty: VocabDifficulty;
  player1Name: string;
  player2Name: string;
}
