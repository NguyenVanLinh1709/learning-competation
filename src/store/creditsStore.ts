import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BONUS_TTL_MS, CREDITS_PER_AD, FREE_CREDITS, MAX_BONUS_CREDITS } from '../constants/ads';
import type { GameFamily } from '../types';

const STORAGE_KEY = 'mb_credits_v1';
const FAMILIES: GameFamily[] = ['math', 'vocab', 'color', 'memory', 'flag'];

export interface FamilyCredits {
  /** One-time starter credits — never expires, never re-granted. */
  freeRemaining: number;
  /** Ad-earned credits, capped at MAX_BONUS_CREDITS, decays after BONUS_TTL_MS unused. */
  bonus: number;
  /** epoch ms — set when `bonus` goes from 0 to >0; drives the 24h decay. */
  bonusBankedAt: number | null;
}

type CreditsMap = Record<GameFamily, FamilyCredits>;

function freshFamilyCredits(): FamilyCredits {
  return { freeRemaining: FREE_CREDITS, bonus: 0, bonusBankedAt: null };
}

function freshCreditsMap(): CreditsMap {
  return Object.fromEntries(FAMILIES.map((f) => [f, freshFamilyCredits()])) as CreditsMap;
}

// Applies the 24h bonus-expiry rule lazily — no background timers needed.
function decayed(fc: FamilyCredits): FamilyCredits {
  if (fc.bonus > 0 && fc.bonusBankedAt !== null && Date.now() - fc.bonusBankedAt >= BONUS_TTL_MS) {
    return { ...fc, bonus: 0, bonusBankedAt: null };
  }
  return fc;
}

function persist(credits: CreditsMap) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(credits)).catch(() => {});
}

interface CreditsStore {
  ready: boolean;
  credits: CreditsMap;

  init: () => Promise<void>;
  /** Decayed, up-to-date credits for a family (for detailed UI display). */
  getFamilyCredits: (family: GameFamily) => FamilyCredits;
  /** Total playable credits for a family (free + still-valid bonus). */
  getBalance: (family: GameFamily) => number;
  canPlay: (family: GameFamily) => boolean;
  /** Spends 1 credit (bonus first, then free). Returns whether it succeeded. */
  consumeCredit: (family: GameFamily) => boolean;
  /** Banks ad-earned credits, capped at MAX_BONUS_CREDITS. */
  addCredit: (family: GameFamily, amount?: number) => void;
}

export const useCreditsStore = create<CreditsStore>((set, get) => ({
  ready: false,
  credits: freshCreditsMap(),

  init: async () => {
    if (get().ready) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Partial<CreditsMap>) : {};
      const merged = Object.fromEntries(
        FAMILIES.map((f) => [f, saved[f] ?? freshFamilyCredits()]),
      ) as CreditsMap;
      set({ credits: merged, ready: true });
      persist(merged);
    } catch {
      // Storage unavailable — fall back to in-memory defaults so play still works.
      set({ ready: true });
    }
  },

  getFamilyCredits: (family) => decayed(get().credits[family]),

  getBalance: (family) => {
    const fc = decayed(get().credits[family]);
    return fc.freeRemaining + fc.bonus;
  },

  canPlay: (family) => get().getBalance(family) > 0,

  consumeCredit: (family) => {
    const credits = { ...get().credits };
    const fc = decayed(credits[family]);
    if (fc.freeRemaining + fc.bonus <= 0) {
      credits[family] = fc;
      set({ credits });
      persist(credits);
      return false;
    }
    credits[family] =
      fc.bonus > 0 ? { ...fc, bonus: fc.bonus - 1 } : { ...fc, freeRemaining: fc.freeRemaining - 1 };
    set({ credits });
    persist(credits);
    return true;
  },

  addCredit: (family, amount = CREDITS_PER_AD) => {
    const credits = { ...get().credits };
    const fc = decayed(credits[family]);
    const wasEmpty = fc.bonus === 0;
    credits[family] = {
      ...fc,
      bonus: Math.min(MAX_BONUS_CREDITS, fc.bonus + amount),
      bonusBankedAt: wasEmpty ? Date.now() : fc.bonusBankedAt,
    };
    set({ credits });
    persist(credits);
  },
}));
