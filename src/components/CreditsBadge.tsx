import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCreditsStore } from '../store/creditsStore';
import { useCreditAd } from '../hooks/useCreditAd';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import { BONUS_TTL_MS, CREDITS_PER_AD, MAX_BONUS_CREDITS } from '../constants/ads';
import type { GameFamily } from '../types';

type Props = { family: GameFamily };

// Small pill shown on every Setup screen: current play-credit balance, plus a
// button to proactively bank more (by watching a rewarded ad) ahead of
// running out. Capped at MAX_BONUS_CREDITS and shows a rough expiry hint.
export default function CreditsBadge({ family }: Props) {
  const { t } = useLanguageStore();
  const { C } = useTheme();
  const balance = useCreditsStore((s) => s.getBalance(family));
  const fc = useCreditsStore((s) => s.getFamilyCredits(family));
  const addCredit = useCreditsStore((s) => s.addCredit);
  const { isLoaded, isClosed, isEarnedReward, show } = useCreditAd();
  const [watching, setWatching] = useState(false);

  useEffect(() => {
    if (watching && isEarnedReward) {
      addCredit(family);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWatching(false);
    }
  }, [isEarnedReward, watching, family, addCredit]);

  useEffect(() => {
    if (watching && isClosed && !isEarnedReward) setWatching(false);
  }, [isClosed, isEarnedReward, watching]);

  const bankFull = fc.bonus >= MAX_BONUS_CREDITS;
  const hoursLeft = fc.bonusBankedAt
    ? Math.max(1, Math.ceil((BONUS_TTL_MS - (Date.now() - fc.bonusBankedAt)) / (60 * 60 * 1000)))
    : null;
  const canWatch = isLoaded && !bankFull && !watching;

  return (
    <View style={styles.row}>
      <View style={[styles.pill, { backgroundColor: C.surface, borderColor: C.border }]}>
        <Text style={[styles.pillText, { color: C.text }]}>🎮 {t.creditsRemaining(balance)}</Text>
        {fc.bonus > 0 && hoursLeft !== null && (
          <Text style={[styles.hint, { color: C.textMuted }]}>{t.creditsExpireHint(hoursLeft)}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.adBtn, { borderColor: C.p1Primary }, !canWatch && styles.adBtnDisabled]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setWatching(true);
          show();
        }}
        disabled={!canWatch}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        {watching ? (
          <ActivityIndicator size="small" color={C.p1Primary} />
        ) : (
          <Text style={[styles.adBtnText, { color: bankFull ? C.textMuted : C.p1Primary }]} numberOfLines={1}>
            {bankFull ? t.creditsBankFull : `📺 +${CREDITS_PER_AD}`}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  pill: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  pillText: { fontSize: 13, fontWeight: '800' },
  hint: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  adBtn: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    minWidth: 64, alignItems: 'center', justifyContent: 'center',
  },
  adBtnDisabled: { opacity: 0.4 },
  adBtnText: { fontSize: 13, fontWeight: '800' },
});
