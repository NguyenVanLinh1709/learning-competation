import { Question, DifficultyLevel, MathOperation } from '../types';

interface DifficultyParams {
  addSubMax: number;
  mulMax: number;
}

const PARAMS: Record<DifficultyLevel, DifficultyParams> = {
  easy:   { addSubMax: 10, mulMax: 5 },
  medium: { addSubMax: 20, mulMax: 9 },
  hard:   { addSubMax: 99, mulMax: 12 },
};

const OPS_FOR_MIXED: Record<DifficultyLevel, MathOperation[]> = {
  easy:   ['addition', 'subtraction'],
  medium: ['addition', 'subtraction', 'multiplication'],
  hard:   ['addition', 'subtraction', 'multiplication', 'division'],
};

let _idCounter = 0;
const uid = () => `q_${++_idCounter}_${Date.now()}`;

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

interface ExprResult {
  text: string;
  answer: number;
  /**
   * Canonical dedup key.
   * Commutative ops (add, mul) use sorted operands so
   * "3 × 4" and "4 × 3" share the same key and won't both appear.
   */
  key: string;
}

function buildExpression(op: MathOperation, p: DifficultyParams): ExprResult {
  switch (op) {
    case 'addition': {
      const a = rand(1, p.addSubMax);
      const b = rand(1, p.addSubMax);
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      return { text: `${a} + ${b} = ?`, answer: a + b, key: `add_${lo}_${hi}` };
    }
    case 'subtraction': {
      const a = rand(1, p.addSubMax);
      const b = rand(1, a);             // b ≤ a → result always ≥ 0
      return { text: `${a} − ${b} = ?`, answer: a - b, key: `sub_${a}_${b}` };
    }
    case 'multiplication': {
      const a = rand(2, p.mulMax);
      const b = rand(2, p.mulMax);
      const [lo, hi] = a <= b ? [a, b] : [b, a];
      return { text: `${a} × ${b} = ?`, answer: a * b, key: `mul_${lo}_${hi}` };
    }
    case 'division': {
      const divisor  = rand(2, p.mulMax);
      const quotient = rand(2, p.mulMax);
      const dividend = divisor * quotient;
      return { text: `${dividend} ÷ ${divisor} = ?`, answer: quotient, key: `div_${dividend}_${divisor}` };
    }
    default:
      return buildExpression('addition', p);
  }
}

function generateChoices(correct: number): string[] {
  const deltas = [1, 2, 3, 4, 5, 6, 8, 10, 11];
  const wrongs = new Set<number>();

  while (wrongs.size < 3) {
    const delta = deltas[rand(0, deltas.length - 1)];
    const candidate = Math.random() > 0.5 ? correct + delta : Math.max(0, correct - delta);
    if (candidate !== correct && candidate >= 0) wrongs.add(candidate);
  }

  const all = [correct, ...Array.from(wrongs)];
  for (let i = all.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all.map(String);
}

export function generateQuestions(
  count: number,
  difficulty: DifficultyLevel,
  operation: MathOperation,
): Question[] {
  const params = PARAMS[difficulty];
  const seenKeys = new Set<string>();
  const questions: Question[] = [];

  // Max retries before giving up on uniqueness for this slot
  // (guards against exhausting a small space like easy+addition with many questions)
  const MAX_RETRIES = 60;

  for (let i = 0; i < count; i++) {
    let op = operation;
    if (operation === 'mixed') {
      const pool = OPS_FOR_MIXED[difficulty];
      op = pool[rand(0, pool.length - 1)];
    }

    let expr: ExprResult | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      // On a mixed match, allow op to change each retry so we don't
      // get stuck trying to find a unique question for one exhausted operation.
      if (operation === 'mixed' && attempt > 0) {
        const pool = OPS_FOR_MIXED[difficulty];
        op = pool[rand(0, pool.length - 1)];
      }

      const candidate = buildExpression(op, params);

      if (!seenKeys.has(candidate.key)) {
        expr = candidate;
        seenKeys.add(candidate.key);
        break;
      }
    }

    // Fallback: space truly exhausted — use whatever came last (very rare)
    if (!expr) expr = buildExpression(op, params);

    const choices = generateChoices(expr.answer);
    questions.push({
      id: uid(),
      text: expr.text,
      choices,
      correctIndex: choices.indexOf(String(expr.answer)),
      difficulty,
      operation: op,
    });
  }

  return questions;
}
