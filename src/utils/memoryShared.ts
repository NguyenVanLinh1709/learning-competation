// UI constants shared by the solo and battle Memory Flash screens.
export { MEMORY_SETTINGS } from './memoryGenerator';

// Distinct, vivid tile colors (Simon-style). Index 0..24 — the first
// `gridSize` entries are used for a given difficulty.
export const TILE_COLORS = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#A855F7', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
  '#EAB308', // yellow
  '#84CC16', // lime
  '#6366F1', // indigo
  '#D946EF', // fuchsia
  '#10B981', // emerald
  '#F43F5E', // rose
  '#0EA5E9', // sky
  '#8B5CF6', // violet
  '#65A30D', // dark lime
  '#DC2626', // dark red
  '#2563EB', // dark blue
  '#059669', // dark emerald
  '#CA8A04', // dark yellow
  '#9333EA', // dark purple
  '#DB2777', // dark pink
  '#0D9488', // dark teal
];

// Number of grid columns for a given tile count — keeps the grid roughly
// square as harder difficulties add more tiles (2x2, 3x3, 4x4, 5x5).
export function memoryGridCols(gridSize: number): number {
  if (gridSize <= 4) return 2;
  if (gridSize <= 9) return 3;
  if (gridSize <= 16) return 4;
  return 5;
}
