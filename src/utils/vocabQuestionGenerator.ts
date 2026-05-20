import type { VocabDifficulty, VocabDirection, VocabQuestion, VocabWord } from '../types';
import { VOCAB_WORDS, DIFFICULTY_TO_MAX_LEVEL } from '../data/vocabularyData';

let _idCounter = 0;
const uid = () => `vq_${++_idCounter}_${Date.now()}`;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  word: VocabWord,
  pool: VocabWord[],
  direction: VocabDirection,
): string[] {
  const correct = direction === 'en_to_vi' ? word.vi : word.en;
  const used = new Set<string>([correct]);
  const result: string[] = [];

  const sameCategory = shuffle(pool.filter(w => w.category === word.category && w.id !== word.id));
  const otherCategory = shuffle(pool.filter(w => w.category !== word.category));

  for (const w of [...sameCategory, ...otherCategory]) {
    if (result.length >= 3) break;
    const answer = direction === 'en_to_vi' ? w.vi : w.en;
    if (!used.has(answer)) {
      used.add(answer);
      result.push(answer);
    }
  }

  return result;
}

export function generateVocabQuestions(
  count: number,
  difficulty: VocabDifficulty,
): VocabQuestion[] {
  const maxLevel = DIFFICULTY_TO_MAX_LEVEL[difficulty];
  const pool = VOCAB_WORDS.filter(w => w.difficulty <= maxLevel);
  const usedIds = new Set<string>();
  const questions: VocabQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const direction: VocabDirection = i % 2 === 0 ? 'en_to_vi' : 'vi_to_en';

    let available = pool.filter(w => !usedIds.has(w.id));
    if (available.length === 0) {
      usedIds.clear();
      available = [...pool];
    }

    const word = available[Math.floor(Math.random() * available.length)];
    usedIds.add(word.id);

    const correctAnswer = direction === 'en_to_vi' ? word.vi : word.en;
    const wrongAnswers = pickDistractors(word, pool, direction);
    const choices = shuffle([correctAnswer, ...wrongAnswers]);
    const correctIndex = choices.indexOf(correctAnswer);

    questions.push({
      id: uid(),
      text: direction === 'en_to_vi' ? word.en : word.vi,
      emoji: word.emoji,
      choices,
      correctIndex,
      direction,
      wordId: word.id,
      category: word.category,
      difficulty: word.difficulty,
    });
  }

  return questions;
}
