import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'mb_tour_seen_';

export async function isTourSeen(tourId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + tourId);
    return raw === '1';
  } catch {
    return false;
  }
}

// Fire-and-forget, mirrors saveLastSetup in lastSetup.ts.
export function markTourSeen(tourId: string): void {
  AsyncStorage.setItem(KEY_PREFIX + tourId, '1').catch(() => {});
}
