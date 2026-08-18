import { create } from 'zustand';
import { markTourSeen } from '../utils/tourSeen';

export interface TourTargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourStore {
  targets: Record<string, TourTargetRect>;
  activeTour: string | null;
  steps: string[];
  stepIndex: number;
  registerTarget: (fullId: string, rect: TourTargetRect) => void;
  shiftTargets: (tourId: string, deltaY: number) => void;
  startTour: (tourId: string, steps: string[]) => void;
  updateSteps: (steps: string[]) => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  end: () => void;
}

export const useTourStore = create<TourStore>((set, get) => ({
  targets: {},
  activeTour: null,
  steps: [],
  stepIndex: 0,

  registerTarget: (fullId, rect) =>
    set((state) => ({ targets: { ...state.targets, [fullId]: rect } })),

  // Scrolling moves every on-screen target's window Y by the same amount, but
  // only the target actually being scrolled to gets a fresh onLayout/measure.
  // Shift the rest so their cached rects don't go stale. `startBtn` lives in
  // each Setup screen's fixed footer, outside the ScrollView, so its window
  // position never changes with scroll — exclude it or it drifts wrong.
  shiftTargets: (tourId, deltaY) =>
    set((state) => {
      if (deltaY === 0) return {};
      const prefix = `${tourId}:`;
      const next: Record<string, TourTargetRect> = {};
      for (const [key, rect] of Object.entries(state.targets)) {
        const shouldShift = key.startsWith(prefix) && !key.endsWith(':startBtn');
        next[key] = shouldShift ? { ...rect, y: rect.y - deltaY } : rect;
      }
      return { targets: next };
    }),

  // Tour guide feature temporarily disabled — not ready to release yet.
  // This is the single kill-switch: every screen still calls startTour() on
  // first visit / via the tour button, but it's now a no-op so activeTour
  // never becomes truthy, which makes TourOverlay (`if (!activeTour) return
  // null;`) and useTourTarget's re-measure effect inert everywhere for free.
  // Uncomment the line below (and TourButton.tsx's real render) to re-enable.
  // startTour: (tourId, steps) => set({ activeTour: tourId, steps, stepIndex: 0 }),
  startTour: () => {},

  // Re-resolves the step list of the tour currently running (e.g. Memory Setup
  // switching Flash <-> Color mid-tour) without losing which step the user is on.
  updateSteps: (steps) =>
    set((state) => ({
      steps,
      stepIndex: steps.length === 0 ? 0 : Math.min(state.stepIndex, steps.length - 1),
    })),

  next: () => {
    const { activeTour, steps, stepIndex } = get();
    if (!activeTour) return;
    if (stepIndex >= steps.length - 1) {
      markTourSeen(activeTour);
      set({ activeTour: null, steps: [], stepIndex: 0 });
    } else {
      set({ stepIndex: stepIndex + 1 });
    }
  },

  prev: () => set((state) => ({ stepIndex: Math.max(0, state.stepIndex - 1) })),

  skip: () => {
    const { activeTour } = get();
    if (activeTour) markTourSeen(activeTour);
    set({ activeTour: null, steps: [], stepIndex: 0 });
  },

  end: () => set({ activeTour: null, steps: [], stepIndex: 0 }),
}));
