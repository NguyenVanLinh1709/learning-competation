import type { RequestOptions } from 'react-native-google-mobile-ads';
import { TestIds } from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// ─── Play-credit tuning ─────────────────────────────────────────────────────
export const FREE_CREDITS = 3;
export const MAX_BONUS_CREDITS = 10;
export const BONUS_TTL_MS = 24 * 60 * 60 * 1000;
export const CREDITS_PER_AD = 1;

// ─── AdMob ───────────────────────────────────────────────────────────────────
// TODO: replace with your real Rewarded *ad unit* IDs (format
// "ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY") from the AdMob dashboard before a
// release build. Do NOT confuse these with the App ID (format
// "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY", note the "~") configured in
// app.json's react-native-google-mobile-ads plugin.
const PROD_REWARDED_AD_UNIT_ID =
  Platform.select({
    ios: '<IOS_REWARDED_AD_UNIT_ID>',
    android: 'ca-app-pub-6462619456449544/7658584424',
  }) ?? '<REWARDED_AD_UNIT_ID>';

export const REWARDED_AD_UNIT_ID = __DEV__ ? TestIds.REWARDED : PROD_REWARDED_AD_UNIT_ID;

// Non-personalized ads only for MVP simplicity — this avoids needing the iOS
// App Tracking Transparency prompt (ATT is only required when tracking/IDFA
// is actually used for ad personalization).
export const REWARDED_REQUEST_OPTIONS: RequestOptions = {
  requestNonPersonalizedAdsOnly: true,
};
