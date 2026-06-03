import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = extra.supabaseUrl as string | undefined;
const supabaseAnonKey = extra.supabaseAnonKey as string | undefined;

/**
 * True only when real credentials have been filled into app.json → expo.extra.
 * The UI uses this to show a friendly "leaderboard not configured" state instead
 * of crashing when the placeholders are still in place.
 */
export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// The leaderboard is anonymous (no login), so we disable session persistence/refresh.
export const supabase = createClient(supabaseUrl ?? 'http://localhost', supabaseAnonKey ?? 'public', {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
