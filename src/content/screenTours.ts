export type MemoryTourMode = 'flash' | 'color';
type StepList = string[];

// Keyed by the same tourId used as each Setup screen's LAST_SETUP_KEY. Most
// entries are a static step order; memory_battle/memory_solo are a function of
// the screen's local `mode` state since Flash and Color show different controls.
export const screenTours: Record<string, StepList | ((mode: MemoryTourMode) => StepList)> = {
  math_battle: ['playerNames', 'difficulty', 'operation', 'questions', 'timeLimit', 'startBtn'],
  math_solo: ['difficulty', 'operation', 'questions', 'timeLimit', 'startBtn'],

  vocab_battle: ['playerNames', 'vocabMode', 'difficulty', 'questions', 'timeLimit', 'startBtn'],
  vocab_solo: ['vocabMode', 'difficulty', 'questions', 'timeLimit', 'startBtn'],

  color_battle: ['playerNames', 'difficulty', 'questions', 'timeLimit', 'startBtn'],
  color_solo: ['difficulty', 'questions', 'timeLimit', 'startBtn'],

  memory_battle: (mode) => [
    'playerNames',
    'memoryMode',
    ...(mode === 'color' ? ['memoryGrid'] : ['memoryGrid', 'memorySteps']),
    'questions',
    mode === 'color' ? 'memoryReveal' : 'timeLimit',
    'startBtn',
  ],
  memory_solo: (mode) => [
    'memoryMode',
    ...(mode === 'color' ? ['memoryGrid'] : ['memoryGrid', 'memorySteps']),
    'questions',
    mode === 'color' ? 'memoryReveal' : 'timeLimit',
    'startBtn',
  ],

  flag_battle: ['playerNames', 'difficulty', 'questions', 'timeLimit', 'startBtn'],
  flag_solo: ['difficulty', 'questions', 'timeLimit', 'startBtn'],
};
