export type ColorDifficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master' | 'insane';

export interface ColorPerceptionQuestion {
  id: string;
  tiles: string[];    // 8 hex color strings
  oddIndex: number;   // 0–7, which tile is different
  difficulty: ColorDifficulty;
}

type RGB = [number, number, number];

// Saturated mid-tone base colors for variety
const BASE_COLORS: RGB[] = [
  [210, 90, 90],
  [90, 195, 120],
  [90, 110, 215],
  [215, 185, 65],
  [165, 80, 210],
  [65, 195, 200],
  [215, 125, 65],
  [65, 165, 165],
  [195, 100, 150],
  [115, 200, 85],
  [85, 140, 210],
  [210, 145, 90],
];

// Delta range per difficulty (how many RGB units different the odd tile is)
const DELTA_RANGE: Record<ColorDifficulty, [number, number]> = {
  easy:   [60, 80],
  medium: [28, 42],
  hard:   [10, 18],
  expert: [7, 9],
  master: [5, 6],
  insane: [3, 4],
};

function clamp(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function generateOddColor(base: RGB, difficulty: ColorDifficulty): RGB {
  const [minDelta, maxDelta] = DELTA_RANGE[difficulty];
  const delta = rand(minDelta, maxDelta);
  const channel = rand(0, 2);
  const result: RGB = [base[0], base[1], base[2]];
  const direction = result[channel] + delta <= 240 ? 1 : -1;
  result[channel] = clamp(result[channel] + direction * delta);
  return result;
}

export function generateColorPerceptionQuestions(
  count: number,
  difficulty: ColorDifficulty,
): ColorPerceptionQuestion[] {
  const questions: ColorPerceptionQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const base = BASE_COLORS[i % BASE_COLORS.length];
    // Small jitter so the same hue doesn't repeat identically
    const jitter: RGB = [
      clamp(base[0] + rand(-20, 20)),
      clamp(base[1] + rand(-20, 20)),
      clamp(base[2] + rand(-20, 20)),
    ];
    const oddRgb = generateOddColor(jitter, difficulty);
    const oddIndex = rand(0, 7);

    const baseHex = rgbToHex(jitter[0], jitter[1], jitter[2]);
    const oddHex = rgbToHex(oddRgb[0], oddRgb[1], oddRgb[2]);

    questions.push({
      id: `cp-${i}-${Date.now() + i}`,
      tiles: Array.from({ length: 8 }, (_, idx) => (idx === oddIndex ? oddHex : baseHex)),
      oddIndex,
      difficulty,
    });
  }

  return questions;
}
