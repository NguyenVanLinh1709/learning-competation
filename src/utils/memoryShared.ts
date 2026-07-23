// UI constants shared by the solo and battle Memory Flash screens.
export {
  memoryFlashMs,
  MEMORY_GRID_DIM_MIN,
  MEMORY_GRID_DIM_MAX,
  MEMORY_STEPS_MIN,
  MEMORY_STEPS_MAX,
} from './memoryGenerator';

// Distinct, vivid tile colors (Simon-style), generated on demand so any grid
// dimension from 2x2 up to 11x11 (121 tiles) gets visually distinct colors —
// golden-angle hue rotation keeps adjacent indices from looking alike.
export function tileColor(index: number): string {
  const hue = Math.round((index * 137.508) % 360);
  return `hsl(${hue}, 72%, 52%)`;
}
