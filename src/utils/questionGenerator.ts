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
  answer: number | string;
  /**
   * Canonical dedup key.
   * Commutative ops (add, mul) use sorted operands so
   * "3 × 4" and "4 × 3" share the same key and won't both appear.
   */
  key: string;
  /**
   * Pre-built answer choices. Provided by question types whose distractors
   * need custom logic (unit conversions, time-of-day, sequences). When
   * omitted, generateQuestions derives numeric choices via generateChoices().
   */
  choices?: string[];
  correctIndex?: number;
}

function buildExpression(op: MathOperation, p: DifficultyParams, difficulty: DifficultyLevel): ExprResult {
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
    case 'conversion':
      return buildConversion(difficulty);
    case 'fraction':
      return buildFraction(difficulty);
    case 'sequence':
      return buildSequence(difficulty);
    default:
      return buildExpression('addition', p, difficulty);
  }
}

// ─── Unit & time conversion ──────────────────────────────────────────────────

interface ConvPair { big: string; small: string; factor: number; tier: 1 | 2 | 3 }

// All conversions stay exact (integer answers) by construction.
const CONV_PAIRS: ConvPair[] = [
  { big: 'm',   small: 'cm',  factor: 100,  tier: 1 },
  { big: 'cm',  small: 'mm',  factor: 10,   tier: 1 },
  { big: 'h',   small: 'min', factor: 60,   tier: 1 },
  { big: 'km',  small: 'm',   factor: 1000, tier: 2 },
  { big: 'kg',  small: 'g',   factor: 1000, tier: 2 },
  { big: 'min', small: 's',   factor: 60,   tier: 2 },
  { big: 'L',   small: 'mL',  factor: 1000, tier: 3 },
  { big: 'm',   small: 'mm',  factor: 1000, tier: 3 },
];

const CONV_CFG: Record<DifficultyLevel, { maxTier: 1 | 2 | 3; maxValue: number; bothWays: boolean; time: boolean }> = {
  easy:   { maxTier: 1, maxValue: 9,  bothWays: false, time: false },
  medium: { maxTier: 2, maxValue: 12, bothWays: true,  time: true  },
  hard:   { maxTier: 3, maxValue: 20, bothWays: true,  time: true  },
};

function clockLabel(h: number): string {
  if (h === 0) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function buildTimeQuestion(): ExprResult {
  const h = rand(0, 23);
  const correct = clockLabel(h);
  const wrongs = new Set<string>();
  // flipped meridian (same displayed hour) + neighbouring hours
  const flipped = correct.includes('AM') ? correct.replace('AM', 'PM') : correct.replace('PM', 'AM');
  wrongs.add(flipped);
  for (const dh of [1, -1, 2, 11]) {
    if (wrongs.size >= 3) break;
    wrongs.add(clockLabel((h + dh + 24) % 24));
  }
  wrongs.delete(correct);
  const hh = String(h).padStart(2, '0');
  return finalizeStringChoices(`${hh}:00 = ?`, correct, [...wrongs].slice(0, 3), `time_${h}`);
}

function buildConversion(difficulty: DifficultyLevel): ExprResult {
  const cfg = CONV_CFG[difficulty];
  if (cfg.time && Math.random() < 0.3) return buildTimeQuestion();

  const pool = CONV_PAIRS.filter((c) => c.tier <= cfg.maxTier);
  const pair = pool[rand(0, pool.length - 1)];
  const bigToSmall = !cfg.bothWays || Math.random() < 0.6;

  let text: string;
  let answer: number;
  let key: string;
  if (bigToSmall) {
    const v = rand(1, cfg.maxValue);
    answer = v * pair.factor;
    text = `${v} ${pair.big} = ? ${pair.small}`;
    key = `conv_b_${pair.big}_${pair.small}_${v}`;
  } else {
    answer = rand(1, cfg.maxValue);
    const v = answer * pair.factor;
    text = `${v} ${pair.small} = ? ${pair.big}`;
    key = `conv_s_${pair.big}_${pair.small}_${answer}`;
  }

  const wrongs = scaledDistractors(answer).map(String);
  return finalizeStringChoices(text, String(answer), wrongs, key);
}

// ─── Fraction & percentage of a number ───────────────────────────────────────

const FRAC_CFG: Record<DifficultyLevel, { denoms: number[]; maxK: number; percents: number[]; bases: number[] }> = {
  easy:   { denoms: [2, 4],          maxK: 5,  percents: [10, 25, 50],         bases: [20, 40] },
  medium: { denoms: [2, 3, 4, 5],    maxK: 8,  percents: [10, 20, 50, 75],     bases: [20, 40, 60, 80] },
  hard:   { denoms: [3, 4, 5, 6, 8], maxK: 12, percents: [5, 15, 40, 60, 75],  bases: [20, 40, 60, 80, 100, 120] },
};

function buildFraction(difficulty: DifficultyLevel): ExprResult {
  const cfg = FRAC_CFG[difficulty];
  if (Math.random() < 0.5) {
    // 1/d × N, N chosen as a multiple of d so the answer is a whole number
    const d = cfg.denoms[rand(0, cfg.denoms.length - 1)];
    const k = rand(1, cfg.maxK);
    const n = d * k;
    return { text: `1/${d} × ${n} = ?`, answer: k, key: `frac_${d}_${n}` };
  }
  // P% × N, P a multiple of 5 and N a multiple of 20 → whole-number answer
  const p = cfg.percents[rand(0, cfg.percents.length - 1)];
  const n = cfg.bases[rand(0, cfg.bases.length - 1)];
  return { text: `${p}% × ${n} = ?`, answer: (n * p) / 100, key: `pct_${p}_${n}` };
}

// ─── Number sequences ────────────────────────────────────────────────────────

function buildSequence(difficulty: DifficultyLevel): ExprResult {
  const geometric = difficulty !== 'easy' && Math.random() < (difficulty === 'hard' ? 0.4 : 0.25);

  if (geometric) {
    const r = difficulty === 'hard' && Math.random() < 0.5 ? 3 : 2;
    const a = rand(1, difficulty === 'hard' ? 4 : 3);
    const terms = [a, a * r, a * r ** 2, a * r ** 3];
    const answer = a * r ** 4;
    const wrongs = seqDistractors(answer, answer - terms[3]).map(String);
    return finalizeStringChoices(`${terms.join(', ')}, ?`, String(answer), wrongs, `seqG_${a}_${r}`);
  }

  const a = rand(1, difficulty === 'easy' ? 9 : 12);
  const d = difficulty === 'easy' ? rand(1, 5) : rand(2, difficulty === 'hard' ? 12 : 9);
  const terms = [a, a + d, a + 2 * d, a + 3 * d];
  const answer = a + 4 * d;
  const wrongs = seqDistractors(answer, d).map(String);
  return finalizeStringChoices(`${terms.join(', ')}, ?`, String(answer), wrongs, `seqA_${a}_${d}`);
}

// ─── Distractor helpers ──────────────────────────────────────────────────────

/** Distractors that mimic place-value mistakes (extra/missing zeros, halving). */
function scaledDistractors(correct: number): number[] {
  const factors = [10, 2, 5, 100, 0.5, 0.1];
  const wrongs = new Set<number>();
  for (const f of factors) {
    const c = Math.round(correct * f);
    if (c > 0 && c !== correct) wrongs.add(c);
    if (wrongs.size >= 3) break;
  }
  let off = 1;
  while (wrongs.size < 3) {
    wrongs.add(correct + off);
    if (wrongs.size < 3 && correct - off > 0) wrongs.add(correct - off);
    off++;
  }
  return [...wrongs].slice(0, 3);
}

/** Distractors one or two steps off — the classic "miscounted the pattern" traps. */
function seqDistractors(answer: number, step: number): number[] {
  const s = Math.max(1, Math.abs(step));
  const wrongs = new Set<number>();
  for (const c of [answer - s, answer + s, answer + 2 * s, answer - 2 * s]) {
    if (c >= 0 && c !== answer) wrongs.add(c);
    if (wrongs.size >= 3) break;
  }
  let off = 1;
  while (wrongs.size < 3) {
    wrongs.add(answer + off);
    if (wrongs.size < 3 && answer - off >= 0) wrongs.add(answer - off);
    off++;
  }
  return [...wrongs].slice(0, 3);
}

/** Shuffle a correct + wrongs string set into an ExprResult with a fixed correctIndex. */
function finalizeStringChoices(text: string, correct: string, wrongs: string[], key: string): ExprResult {
  const all = [correct, ...wrongs];
  for (let i = all.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { text, answer: correct, key, choices: all, correctIndex: all.indexOf(correct) };
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

      const candidate = buildExpression(op, params, difficulty);

      if (!seenKeys.has(candidate.key)) {
        expr = candidate;
        seenKeys.add(candidate.key);
        break;
      }
    }

    // Fallback: space truly exhausted — use whatever came last (very rare)
    if (!expr) expr = buildExpression(op, params, difficulty);

    // String-answer types (conversion, sequence) supply their own choices;
    // numeric types fall back to the shared near-value distractor generator.
    const choices = expr.choices ?? generateChoices(expr.answer as number);
    const correctIndex = expr.correctIndex ?? choices.indexOf(String(expr.answer));
    questions.push({
      id: uid(),
      text: expr.text,
      choices,
      correctIndex,
      difficulty,
      operation: op,
    });
  }

  return questions;
}
