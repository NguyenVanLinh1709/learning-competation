export interface StepContent {
  titleKey: string;
  bodyKey: string;
  // Override when this step's content key differs from the fullId used to look
  // up its measured target (Memory's color-mode "reveal time" row reuses the
  // `timeLimit` target but shows different tooltip copy — see screenTours.ts).
  targetKey?: string;
}

export const STEP_LIBRARY: Record<string, StepContent> = {
  playerNames: { titleKey: 'tourPlayerNamesTitle', bodyKey: 'tourPlayerNamesBody' },
  difficulty: { titleKey: 'tourDifficultyTitle', bodyKey: 'tourDifficultyBody' },
  operation: { titleKey: 'tourOperationTitle', bodyKey: 'tourOperationBody' },
  vocabMode: { titleKey: 'tourVocabModeTitle', bodyKey: 'tourVocabModeBody' },
  memoryMode: { titleKey: 'tourMemoryModeTitle', bodyKey: 'tourMemoryModeBody' },
  memoryGrid: { titleKey: 'tourMemoryGridTitle', bodyKey: 'tourMemoryGridBody' },
  memorySteps: { titleKey: 'tourMemoryStepsTitle', bodyKey: 'tourMemoryStepsBody' },
  memoryReveal: { titleKey: 'tourMemoryRevealTitle', bodyKey: 'tourMemoryRevealBody', targetKey: 'timeLimit' },
  questions: { titleKey: 'tourQuestionsTitle', bodyKey: 'tourQuestionsBody' },
  timeLimit: { titleKey: 'tourTimeLimitTitle', bodyKey: 'tourTimeLimitBody' },
  startBtn: { titleKey: 'tourStartTitle', bodyKey: 'tourStartBody' },
};
