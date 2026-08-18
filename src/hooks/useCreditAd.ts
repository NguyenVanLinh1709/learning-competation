import { useEffect } from 'react';
import { useRewardedAd } from 'react-native-google-mobile-ads';
import { REWARDED_AD_UNIT_ID, REWARDED_REQUEST_OPTIONS } from '../constants/ads';

// Thin wrapper around the library's own useRewardedAd hook: preloads on mount
// and again after every close, so a fresh ad is ready the next time the user
// wants one (forced out-of-credits flow or the proactive "bank credits" button).
export function useCreditAd() {
  const { isLoaded, isClosed, isEarnedReward, error, load, show } = useRewardedAd(
    REWARDED_AD_UNIT_ID,
    REWARDED_REQUEST_OPTIONS,
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isClosed) load();
  }, [isClosed, load]);

  return { isLoaded, isClosed, isEarnedReward, error, show, load };
}
