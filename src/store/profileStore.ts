import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for the persisted solo "account": a stable per-device id, the editable
// display name, country code, and uploaded avatar URL. The id is what the
// leaderboard dedupes on so that one device = one ranked entry per game mode,
// regardless of the name/avatar shown.
const ID_KEY = 'mb_user_id';
const NAME_KEY = 'mb_user_name';
const COUNTRY_KEY = 'mb_user_country';
const AVATAR_KEY = 'mb_user_avatar';

function generateUserId(): string {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

interface ProfileStore {
  /** Stable device identity; null until init() resolves. */
  userId: string | null;
  /** Editable display name shown on the leaderboard. */
  displayName: string;
  /** ISO 3166-1 alpha-2 country code ('' if unset). */
  country: string;
  /** Public URL of the uploaded avatar ('' if unset). */
  avatarUrl: string;
  /** True once the persisted values have been loaded. */
  ready: boolean;

  init: () => Promise<void>;
  setDisplayName: (name: string) => void;
  setCountry: (code: string) => void;
  setAvatarUrl: (url: string) => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  userId: null,
  displayName: '',
  country: '',
  avatarUrl: '',
  ready: false,

  init: async () => {
    if (get().ready) return;
    try {
      let id = await AsyncStorage.getItem(ID_KEY);
      if (!id) {
        id = generateUserId();
        await AsyncStorage.setItem(ID_KEY, id);
      }
      const [name, country, avatarUrl] = await Promise.all([
        AsyncStorage.getItem(NAME_KEY),
        AsyncStorage.getItem(COUNTRY_KEY),
        AsyncStorage.getItem(AVATAR_KEY),
      ]);
      set({
        userId: id,
        displayName: name ?? '',
        country: country ?? '',
        avatarUrl: avatarUrl ?? '',
        ready: true,
      });
    } catch {
      // If storage is unavailable, fall back to an ephemeral id so play still works.
      set({ userId: get().userId ?? generateUserId(), ready: true });
    }
  },

  setDisplayName: (name) => {
    const trimmed = name.trim();
    set({ displayName: trimmed });
    AsyncStorage.setItem(NAME_KEY, trimmed).catch(() => {});
  },

  setCountry: (code) => {
    set({ country: code });
    AsyncStorage.setItem(COUNTRY_KEY, code).catch(() => {});
  },

  setAvatarUrl: (url) => {
    set({ avatarUrl: url });
    AsyncStorage.setItem(AVATAR_KEY, url).catch(() => {});
  },
}));
