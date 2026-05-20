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

export type RootStackParamList = {
  Home: undefined;
  Setup: undefined;
  Countdown: undefined;
  Game: undefined;
  Result: undefined;
};
