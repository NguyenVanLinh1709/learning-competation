import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useColorPerceptionStore } from '../store/colorPerceptionStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'ColorResult'> };

function avgTime(times: number[]): string {
  if (times.length === 0) return '—';
  return `${(times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1)}s`;
}

function StatRow({ label, value, highlight, textColor, mutedColor }: {
  label: string; value: string; highlight?: boolean; textColor: string; mutedColor: string;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: mutedColor }]}>{label}</Text>
      <Text style={[styles.statValue, { color: highlight ? '#16A34A' : textColor }]}>{value}</Text>
    </View>
  );
}

export default function ColorResultScreen({ navigation }: Props) {
  const { config, score, correctCount, wrongCount, responseTimes, resetGame, initGame } = useColorPerceptionStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const accuracy = config ? Math.round((correctCount / config.totalQuestions) * 100) : 0;
  const trophyEmoji = accuracy >= 80 ? '🏆' : accuracy >= 60 ? '🎯' : '💪';

  const bannerScale = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(60)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const feedback = accuracy >= 80
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Warning;
    Haptics.notificationAsync(feedback);

    Animated.spring(bannerScale, { toValue: 1, friction: 5, useNativeDriver: true }).start(() => {
      Animated.parallel([
        Animated.spring(cardY, { toValue: 0, friction: 7, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const handlePlayAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    initGame();
    navigation.replace('ColorGame');
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetGame();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <View style={styles.scroll}>

        {/* Banner */}
        <Animated.View style={[styles.banner, { transform: [{ scale: bannerScale }] }]}>
          <Text style={styles.trophy}>{trophyEmoji}</Text>
          <Text style={[styles.completeText, { color: C.text }]}>{t.colorSoloComplete}</Text>
          <Text style={[styles.subText, { color: C.textMuted }]}>
            {config?.totalQuestions}q · {config?.difficulty}
          </Text>
        </Animated.View>

        {/* Stats card */}
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: C.surface, borderColor: C.border, opacity: cardOpacity, transform: [{ translateY: cardY }] },
          ]}
        >
          <View style={[styles.nameBadge, { backgroundColor: '#7C3AED' }]}>
            <Text style={styles.nameText} numberOfLines={1}>{config?.playerName}</Text>
          </View>

          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreNumber, { color: C.text }]}>{score}</Text>
            <Text style={[styles.scoreOutOf, { color: C.textMuted }]}>/ {config?.totalQuestions}</Text>
          </View>
          <Text style={[
            styles.accuracyText,
            { color: accuracy >= 80 ? C.timerGreen : accuracy >= 60 ? C.timerYellow : C.timerRed },
          ]}>
            {accuracy}% accuracy
          </Text>

          <View style={[styles.divider, { backgroundColor: C.border }]} />

          <StatRow label={t.correctStat} value={String(correctCount)} highlight={correctCount > 0} textColor={C.text} mutedColor={C.textMuted} />
          <StatRow label={t.wrongStat}   value={String(wrongCount)}   textColor={C.text} mutedColor={C.textMuted} />
          <StatRow label={t.avgTimeStat} value={avgTime(responseTimes)} textColor={C.text} mutedColor={C.textMuted} />
        </Animated.View>

        {/* Actions */}
        <Animated.View style={{ opacity: cardOpacity, gap: 12 }}>
          <TouchableOpacity style={styles.playAgainBtn} onPress={handlePlayAgain} activeOpacity={0.85}>
            <LinearGradient colors={['#7C3AED', '#A855F7']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.btnText}>{t.playAgain}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={handleHome} activeOpacity={0.8}>
            <Text style={[styles.homeBtnText, { color: C.textMuted }]}>{t.backHome}</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  scroll: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingBottom: 40,
    gap: 20,
  },

  banner: { alignItems: 'center', marginBottom: 4 },
  trophy: { fontSize: 64, marginBottom: 8 },
  completeText: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  subText: { fontSize: 12, marginTop: 6, letterSpacing: 0.5 },

  card: { borderRadius: 20, padding: 20, borderWidth: 1, alignItems: 'center', gap: 4 },
  nameBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 8 },
  nameText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  scoreBlock: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  scoreNumber: { fontSize: 64, fontWeight: '900', lineHeight: 70 },
  scoreOutOf: { fontSize: 20, fontWeight: '700', paddingBottom: 10 },
  accuracyText: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  divider: { height: 1, alignSelf: 'stretch', marginVertical: 12 },

  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 4 },
  statLabel: { fontSize: 14 },
  statValue: { fontSize: 14, fontWeight: '700' },

  playAgainBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGrad: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  homeBtn: { alignItems: 'center', paddingVertical: 14 },
  homeBtnText: { fontSize: 15, fontWeight: '600' },
});
