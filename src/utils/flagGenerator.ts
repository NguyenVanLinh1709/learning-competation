import { FLAG_DATA } from '../data/flagData';
import type { FlagQuestion } from '../types';
import type { DifficultyLevel } from '../types';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateFlagQuestions(count: number, difficulty: DifficultyLevel): FlagQuestion[] {
  const levelMap: Record<DifficultyLevel, Array<1 | 2 | 3>> = {
    easy:   [1],
    medium: [1, 2],
    hard:   [1, 2, 3],
  };
  const levels = levelMap[difficulty];

  const pool = FLAG_DATA.filter(f => levels.includes(f.difficulty));
  const selected = shuffle(pool).slice(0, count);

  return selected.map((entry, i) => {
    const wrongPool = shuffle(FLAG_DATA.filter(f => f.flag !== entry.flag));
    const wrongChoices = wrongPool.slice(0, 3);

    const correctIndex = Math.floor(Math.random() * 4);
    const choices: string[] = [];
    let wrongIdx = 0;
    for (let j = 0; j < 4; j++) {
      choices.push(j === correctIndex ? entry.flag : wrongChoices[wrongIdx++].flag);
    }

    return {
      id: `flag-${i}`,
      countryName: entry.name,
      choices,
      correctIndex,
    };
  });
}
