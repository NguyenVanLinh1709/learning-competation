import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { GameMode, LeaderboardEntry, NewLeaderboardEntry } from '../types';

type ModeFilter = GameMode | 'all';

interface LeaderboardStore {
  entries: LeaderboardEntry[];
  loading: boolean;
  /** null = no error; 'unconfigured' = credentials not set; otherwise an error message. */
  error: string | null;
  filter: ModeFilter;

  setFilter: (filter: ModeFilter) => void;
  fetchTop: (filter?: ModeFilter) => Promise<void>;
  submitScore: (entry: NewLeaderboardEntry) => Promise<boolean>;
}

const TOP_LIMIT = 50;

// Ranking order used both when reading the board and when deciding whether a new
// run beats a user's stored best: higher score, then better accuracy, then faster.
function isBetter(
  a: Pick<LeaderboardEntry, 'score' | 'accuracy' | 'avg_time_ms'>,
  b: Pick<LeaderboardEntry, 'score' | 'accuracy' | 'avg_time_ms'>,
): boolean {
  if (a.score !== b.score) return a.score > b.score;
  if (a.accuracy !== b.accuracy) return a.accuracy > b.accuracy;
  return (a.avg_time_ms ?? Infinity) < (b.avg_time_ms ?? Infinity);
}

export const useLeaderboardStore = create<LeaderboardStore>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  filter: 'all',

  setFilter: (filter) => {
    set({ filter });
    get().fetchTop(filter);
  },

  fetchTop: async (filter) => {
    const activeFilter = filter ?? get().filter;
    if (!isSupabaseConfigured) {
      set({ error: 'unconfigured', loading: false, entries: [] });
      return;
    }
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .order('avg_time_ms', { ascending: true, nullsFirst: false })
        .limit(TOP_LIMIT);
      if (activeFilter !== 'all') query = query.eq('mode', activeFilter);

      const { data, error } = await query;
      if (error) throw error;
      set({ entries: (data ?? []) as LeaderboardEntry[], loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to load leaderboard', loading: false });
    }
  },

  submitScore: async (entry) => {
    if (!isSupabaseConfigured) return false;
    try {
      // One ranked row per (user_id, mode): keep the user's best run only.
      const { data: existing, error: readErr } = await supabase
        .from('leaderboard')
        .select('score, accuracy, avg_time_ms')
        .eq('user_id', entry.user_id)
        .eq('mode', entry.mode)
        .maybeSingle();
      if (readErr) throw readErr;

      // Already have a better-or-equal run stored — leave it untouched.
      if (existing && !isBetter(entry, existing as LeaderboardEntry)) return false;

      const { error } = await supabase
        .from('leaderboard')
        .upsert(entry, { onConflict: 'user_id,mode' });
      if (error) throw error;
      return true;
    } catch {
      // Submitting a score should never block the Result screen — fail silently.
      return false;
    }
  },
}));
