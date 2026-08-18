import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../store/languageStore';
import { useCreditsStore } from '../store/creditsStore';
import { useCreditAd } from '../hooks/useCreditAd';
import type { GameFamily } from '../types';

type Props = {
  visible: boolean;
  family: GameFamily;
  onCancel: () => void;
  /** Called once a rewarded credit has been earned and consumed — caller should proceed (navigate). */
  onGranted: () => void;
};

type AttemptState = 'idle' | 'watching' | 'error';

// Shown instead of navigating when the player has no play credits left for a
// family. Mirrors ConfirmModal's card/overlay styling but adds the
// load/watch/error states a rewarded ad needs.
export default function OutOfCreditsModal({ visible, family, onCancel, onGranted }: Props) {
  const { C, isDark } = useTheme();
  const { t } = useLanguageStore();
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';
  const addCredit = useCreditsStore((s) => s.addCredit);
  const consumeCredit = useCreditsStore((s) => s.consumeCredit);
  const { isLoaded, isClosed, isEarnedReward, error, show, load } = useCreditAd();
  const [attempt, setAttempt] = useState<AttemptState>('idle');

  // Reset local attempt state each time the modal re-opens.
  useEffect(() => {
    if (visible) setAttempt('idle');
  }, [visible]);

  useEffect(() => {
    if (attempt === 'watching' && isEarnedReward) {
      addCredit(family);
      consumeCredit(family);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAttempt('idle');
      onGranted();
    }
  }, [isEarnedReward, attempt, family, addCredit, consumeCredit, onGranted]);

  useEffect(() => {
    // Ad dismissed without earning a reward (user backed out early) — let them try again.
    if (attempt === 'watching' && isClosed && !isEarnedReward) setAttempt('idle');
  }, [isClosed, isEarnedReward, attempt]);

  useEffect(() => {
    // Covers both a failed preload (attempt still 'idle') and a failure while showing.
    if (error && attempt !== 'error') setAttempt('error');
  }, [error, attempt]);

  const handleWatch = () => {
    if (!isLoaded) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAttempt('watching');
    show();
  };

  const handleRetry = () => {
    setAttempt('idle');
    load();
  };

  // True while there's nothing useful to tap yet: still fetching the ad, or the
  // fullscreen ad is currently up. `attempt === 'error'` is deliberately excluded
  // so the Retry action stays enabled.
  const busy = attempt === 'watching' || (attempt === 'idle' && !isLoaded);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.card, { backgroundColor: cardBg, borderColor: C.border }]}
        >
          <Text style={styles.emoji}>🎬</Text>
          <Text style={[styles.title, { color: C.text }]}>{t.outOfCreditsTitle}</Text>
          <Text style={[styles.message, { color: C.textMuted }]}>
            {attempt === 'error' ? t.watchAdFailed : t.outOfCreditsMessage}
          </Text>

          <TouchableOpacity
            style={[styles.watchBtn, { borderColor: C.p1Primary }, busy && styles.watchBtnDisabled]}
            onPress={attempt === 'error' ? handleRetry : handleWatch}
            disabled={busy}
          >
            {busy ? (
              <View style={styles.busyRow}>
                <ActivityIndicator size="small" color={C.p1Primary} />
                <Text style={[styles.watchBtnText, { color: C.p1Primary }]}>{t.watchAdLoading}</Text>
              </View>
            ) : (
              <Text style={[styles.watchBtnText, { color: C.p1Primary }]}>
                {attempt === 'error' ? `🔁 ${t.retryAction}` : `📺 ${t.watchAdButton}`}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: C.textMuted }]}>{t.cancelAction}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 22, alignItems: 'center' },
  emoji: { fontSize: 36, marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 21, marginBottom: 20, textAlign: 'center' },
  watchBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    minHeight: 48,
  },
  watchBtnDisabled: { opacity: 0.6 },
  watchBtnText: { fontSize: 15, fontWeight: '800' },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelBtn: { padding: 4 },
  cancelText: { fontSize: 14, fontWeight: '700' },
});
