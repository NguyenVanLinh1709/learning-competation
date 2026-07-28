import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'mb_last_setup_';

// Fire-and-forget write of a Setup screen's last-used config, keyed per
// game mode so reopening that Setup screen can pre-fill it.
export function saveLastSetup<T extends object>(key: string, value: T): void {
  AsyncStorage.setItem(KEY_PREFIX + key, JSON.stringify(value)).catch(() => {});
}

export async function loadLastSetup<T extends object>(key: string): Promise<Partial<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}
