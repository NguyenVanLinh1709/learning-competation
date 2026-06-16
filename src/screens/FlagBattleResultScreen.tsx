import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFlagBattleStore } from '../store/flagBattleStore';
import type { FlagBattlePlayerState } from '../store/flagBattleStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'FlagBattleResult'> };

const FLAG_GRADIENT_P1: readonly [string, string] = ['#0F766E', '#14B8A6'];
const FLAG_GRADIENT_P2: readonly [string, string] = ['#0E7490', '#06B6D4'];

function avgTime(times: number[]): string {
  if (times.length === 0) return '—';
  return `${(times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1)}s`;
}

function StatRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={statStyles.row}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, highlight && { color: '#22C55E' }]}>{value}</Text>
    </View>
  );
}

function PlayerCard({
  player,
  isWinner,
  gradient,
  t,
}: {
  player: FlagBattlePlayerState;
  isWinner: boolean;
  gradient: readonly [string, string];
  t: { points: string; correct: string; wrong: string; avgTime: string };
}) {
  return (
    <LinearGradient
      colors={isWinner ? gradient : (['#1A1A2E', '#1A1A2E'] as const)}
      style={[cardStyles.card, isWinner && cardStyles.winnerCard]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {isWinner && <Text style={cardStyles.crown}>👑</Text>}
      <Text style={cardStyles.name} numberOfLines={1}>{player.name}</Text>
      <Text style={cardStyles.score}>{player.score}</Text>
      <Text style={cardStyles.scoreLabel}>{t.points}</Text>
      <View style={cardStyles.divider} />
      <StatRow label={t.correct} value={String(player.correctCount)} highlight={player.correctCount > 0} />
      <StatRow label={t.wrong}   value={String(player.wrongCount)} />
      <StatRow label={t.avgTime} value={avgTime(player.responseTimes)} />
    </LinearGradient>
  );
}

export default function FlagBattleResultScreen({ navigation }: Props) {
  const { player1, player2, config, resetGame, initGame } = useFlagBattleStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const isDraw = player1.score === player2.score;
  const p1Wins = player1.score > player2.score;
  const winnerText = isDraw ? t.draw : p1Wins ? t.wins(player1.name) : t.wins(player2.name);

  const bannerScale = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(60)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(isDraw ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    Animated.spring(bannerScale, { toValue: 1, friction: 5, useNativeDriver: true }).start(() => {
      Animated.parallel([
        Animated.spring(cardsY, { toValue: 0, friction: 7, useNativeDriver: true }),
        Animated.timing(cardsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const statLabels = { points: t.points, correct: t.correctStat, wrong: t.wrongStat, avgTime: t.avgTimeStat };

  const handleRematch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    initGame();
    navigation.replace('FlagBattleGame');
  };

  const handleHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetGame();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  return (
    <LinearGradient colors={G.home} style={styles.outer}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Animated.View style={[styles.banner, { transform: [{ scale: bannerScale }] }]}>
          <Text style={styles.trophy}>{isDraw ? '🤝' : '🏆'}</Text>
          <Text style={[styles.winnerText, { color: isDraw ? C.timerYellow : C.text }]}>{winnerText}</Text>
          <Text style={[styles.subText, { color: C.textMuted }]}>
            {config?.totalQuestions}q · {config?.difficulty} · 🏳️
          </Text>
        </Animated.View>

        <Animated.View style={[styles.cards, { opacity: cardsOpacity, transform: [{ translateY: cardsY }] }]}>
          <PlayerCard player={player2} isWinner={!isDraw && !p1Wins} gradient={FLAG_GRADIENT_P2} t={statLabels} />
          <PlayerCard player={player1} isWinner={!isDraw && p1Wins}  gradient={FLAG_GRADIENT_P1} t={statLabels} />
        </Animated.View>

        <Animated.View style={{ opacity: cardsOpacity }}>
          <TouchableOpacity style={styles.rematchBtn} onPress={handleRematch} activeOpacity={0.85}>
            <LinearGradient
              colors={['#0F766E', '#0E7490']}
              style={styles.btnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.btnText}>{t.rematch}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={handleHome} activeOpacity={0.8}>
            <Text style={[styles.homeBtnText, { color: C.textMuted }]}>{t.backHome}</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1 },
  scroll: { padding: 20, paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingBottom: 40, gap: 20 },
  banner: { alignItems: 'center', marginBottom: 4 },
  trophy: { fontSize: 64, marginBottom: 8 },
  winnerText: { fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subText: { fontSize: 12, marginTop: 6, letterSpacing: 0.5 },
  cards: { gap: 12 },
  rematchBtn: {
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#0F766E', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnGrad: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  homeBtn: { alignItems: 'center', paddingVertical: 14 },
  homeBtnText: { fontSize: 15, fontWeight: '600' },
});

const cardStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  winnerCard: {
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#14B8A6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  crown: { fontSize: 28, textAlign: 'center', marginBottom: 4 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  score: { color: '#FFFFFF', fontSize: 52, fontWeight: '900', textAlign: 'center', lineHeight: 58 },
  scoreLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', letterSpacing: 2, marginBottom: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
});

const statStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  value: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
