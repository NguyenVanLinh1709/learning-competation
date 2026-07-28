export interface MemoryRound {
  id: string;
  sequence: number[];   // tile indices to light up, in order
}

// User-facing bounds for the two Memory Flash sliders (grid dimension is N×N).
export const MEMORY_GRID_DIM_MIN = 2;
export const MEMORY_GRID_DIM_MAX = 7;
export const MEMORY_STEPS_MIN = 2;
export const MEMORY_STEPS_MAX = 15;

const FLASH_MS_MAX = 700; // shown at the easiest setting (2x2 grid, 2 steps)
const FLASH_MS_MIN = 160; // shown at the hardest setting (7x7 grid, 15 steps)

// How long each tile stays lit while the sequence plays — derived from the
// user's chosen grid dimension and step count so the ramp scales smoothly
// across the whole slider range instead of a handful of fixed tiers.
export function memoryFlashMs(gridDim: number, steps: number): number {
  const gridT = (gridDim - MEMORY_GRID_DIM_MIN) / (MEMORY_GRID_DIM_MAX - MEMORY_GRID_DIM_MIN);
  const stepsT = (steps - MEMORY_STEPS_MIN) / (MEMORY_STEPS_MAX - MEMORY_STEPS_MIN);
  const t = (gridT + stepsT) / 2;
  return Math.round(FLASH_MS_MAX - t * (FLASH_MS_MAX - FLASH_MS_MIN));
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Every round uses exactly the user-chosen step count as its sequence length.
export function generateMemoryRounds(
  count: number,
  gridSize: number,
  steps: number,
): MemoryRound[] {
  const rounds: MemoryRound[] = [];

  for (let i = 0; i < count; i++) {
    const sequence: number[] = [];
    for (let j = 0; j < steps; j++) {
      let tile = rand(0, gridSize - 1);
      // Avoid an immediate repeat — a tile flashing twice in a row is confusing.
      if (j > 0 && tile === sequence[j - 1]) tile = (tile + 1) % gridSize;
      sequence.push(tile);
    }
    rounds.push({ id: `mem-${i}-${Date.now() + i}`, sequence });
  }

  return rounds;
}
