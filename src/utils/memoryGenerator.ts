export type MemoryDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface MemoryRound {
  id: string;
  sequence: number[];   // tile indices to light up, in order
  difficulty: MemoryDifficulty;
}

// gridSize = number of tiles; baseLen = starting sequence length;
// flashMs = how long each tile stays lit while showing the sequence.
export const MEMORY_SETTINGS: Record<MemoryDifficulty, { gridSize: number; baseLen: number; flashMs: number }> = {
  easy:   { gridSize: 4, baseLen: 2, flashMs: 650 },
  medium: { gridSize: 4, baseLen: 3, flashMs: 520 },
  hard:   { gridSize: 9, baseLen: 3, flashMs: 430 },
  expert: { gridSize: 9, baseLen: 4, flashMs: 340 },
};

const MAX_LEN = 7;

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// The sequence grows every other round so the difficulty ramps up smoothly.
function lengthForRound(roundIndex: number, baseLen: number): number {
  return Math.min(baseLen + Math.floor(roundIndex / 2), MAX_LEN);
}

export function generateMemoryRounds(
  count: number,
  difficulty: MemoryDifficulty,
): MemoryRound[] {
  const { gridSize, baseLen } = MEMORY_SETTINGS[difficulty];
  const rounds: MemoryRound[] = [];

  for (let i = 0; i < count; i++) {
    const len = lengthForRound(i, baseLen);
    const sequence: number[] = [];
    for (let j = 0; j < len; j++) {
      let tile = rand(0, gridSize - 1);
      // Avoid an immediate repeat — a tile flashing twice in a row is confusing.
      if (j > 0 && tile === sequence[j - 1]) tile = (tile + 1) % gridSize;
      sequence.push(tile);
    }
    rounds.push({ id: `mem-${i}-${Date.now() + i}`, sequence, difficulty });
  }

  return rounds;
}
