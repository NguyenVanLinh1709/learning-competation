export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type MathOperation =
  | 'addition' | 'subtraction' | 'multiplication' | 'division' | 'mixed'
  | 'conversion' | 'fraction' | 'sequence' | 'count';
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
  countIcons?: string[]; // icon array for 'count' operation
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
  VocabSoloSetup: undefined;
  VocabSoloGame: undefined;
  VocabSoloResult: undefined;
  ColorSetup: undefined;
  ColorGame: undefined;
  ColorResult: undefined;
  ColorBattleSetup: undefined;
  ColorBattleGame: undefined;
  ColorBattleResult: undefined;
  MemorySetup: undefined;
  MemoryGame: undefined;
  MemoryResult: undefined;
  MemoryBattleSetup: undefined;
  MemoryBattleGame: undefined;
  MemoryBattleResult: undefined;
  FlagBattleSetup: undefined;
  FlagBattleGame: undefined;
  FlagBattleResult: undefined;
  FlagSoloSetup: undefined;
  FlagSoloGame: undefined;
  FlagSoloResult: undefined;
  Feedback: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

// Which game a leaderboard score came from.
export type GameMode = 'math' | 'vocab' | 'color' | 'memory';

// A single score row as stored in / read from Supabase (`leaderboard` table).
export interface LeaderboardEntry {
  id: string;
  /** Stable per-device identity — one ranked row per user per mode. */
  user_id: string;
  player_name: string;
  score: number;
  total: number;
  mode: GameMode;
  difficulty: string | null;
  accuracy: number; // 0–100
  avg_time_ms: number | null;
  /** Public URL of the player's uploaded avatar, or null. */
  avatar_url: string | null;
  /** ISO 3166-1 alpha-2 country code, or null. */
  country: string | null;
  created_at: string;
}

// What a Result screen submits (the DB fills id + created_at).
export type NewLeaderboardEntry = Omit<LeaderboardEntry, 'id' | 'created_at'>;

// ─── Flag Battle ─────────────────────────────────────────────────────────────

export interface FlagQuestion {
  id: string;
  countryName: string;
  choices: string[]; // 4 flag emojis
  correctIndex: number;
}

export interface FlagBattleConfig {
  player1Name: string;
  player2Name: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  timeLimitMs: number;
}

export interface FlagSoloConfig {
  playerName: string;
  difficulty: DifficultyLevel;
  totalQuestions: number;
  timeLimitMs: number; // 0 = unlimited
}

// ─── Vocabulary Battle ───────────────────────────────────────────────────────

export type VocabDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type VocabMode = 'vocab' | 'odd_one_out';

export type VocabCategory =
  | 'animals' | 'fruits' | 'colors' | 'school'
  | 'actions' | 'family' | 'body'   | 'food'
  | 'places'  | 'transport' | 'weather' | 'verbs'
  | 'adjectives' | 'sports' | 'jobs' | 'clothing'
  | 'furniture' | 'technology' | 'nature' | 'space'
  | 'music' | 'emotions' | 'countries' | 'vegetables';

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
  type?: 'translation' | 'odd_one_out';
}

export interface VocabGameConfig {
  totalQuestions: number;
  timeLimitMs: number;
  difficulty: VocabDifficulty;
  player1Name: string;
  player2Name: string;
  vocabMode?: VocabMode;
}

export interface VocabSoloConfig {
  playerName: string;
  difficulty: VocabDifficulty;
  totalQuestions: number;
  timeLimitMs: number; // 0 = unlimited
  vocabMode?: VocabMode;
}
