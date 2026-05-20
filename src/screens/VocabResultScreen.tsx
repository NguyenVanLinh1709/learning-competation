import React, { useEffect, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useVocabStore } from '../store/vocabStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { PlayerState, RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'VocabResult'> };

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy 🌱', medium: 'Medium 🔥', hard: 'Hard 💀', expert: 'Expert 🧠',
};

function avgTime(times: number[]): string {
  if (times.length === 0) return '—';
  return `${(times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1)}s`;
}

function accuracy(p: PlayerState): string {
  const total = p.correctCount + p.wrongCount;
  if (total === 0) return '—';
  return `${Math.round((p.correctCount / total) * 100)}%`;
}

function StatRow({ label, value, highlight, textColor, mutedColor }: {
  label: string; value: string; highlight?: boolean; textColor: string; mutedColor: string;
}) {
  return (
    <View style={stat.row}>
      <Text style={[stat.label, { color: mutedColor }]}>{label}</Text>
      <Text style={[stat.value, { color: highlight ? '#10B981' : textColor }]}>{value}</Text>
    </View>
  );
}

function PlayerCard({ player, isWinner, gradient, labels, textColor, mutedColor, borderColor }: {
  player: PlayerState; isWinner: boolean;
  gradient: readonly [string, string];
  labels: { points: string; correct: string; wrong: string; avgTime: string; accuracy: string };
  textColor: string; mutedColor: string; borderColor: string;
}) {
  return (
    <LinearGradient
      colors={isWinner ? gradient : (['#1A1A2E', '#1A1A2E'] as const)}
      style={[card.card, { borderColor }, isWinner && card.winnerCard]}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
    >
      {isWinner && <Text style={card.crown}>👑</Text>}
      <Text style={card.name} numberOfLines={1}>{player.name}</Text>
      <Text style={card.score}>{player.score}</Text>
      <Text style={[card.scoreLabel, { color: 'rgba(255,255,255,0.5)' }]}>{labels.points}</Text>
      <View style={card.divider} />
      <StatRow label={labels.correct} value={String(player.correctCount)} highlight={player.correctCount > 0} textColor="#FFF" mutedColor="rgba(255,255,255,0.6)" />
      <StatRow label={labels.wrong}   value={String(player.wrongCount)}   textColor="#FFF" mutedColor="rgba(255,255,255,0.6)" />
      <StatRow label={labels.accuracy} value={accuracy(player)} highlight textColor="#FFF" mutedColor="rgba(255,255,255,0.6)" />
      <StatRow label={labels.avgTime} value={avgTime(player.responseTimes)} textColor="#FFF" mutedColor="rgba(255,255,255,0.6)" />
    </LinearGradient>
  );
}

export default function VocabResultScreen({ navigation }: Props) {
  const { player1, player2, config, resetGame, initGame } = useVocabStore();
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

  const labels = {
    points: t.points,
    correct: t.correctStat,
    wrong: t.wrongStat,
    avgTime: t.avgTimeStat,
    accuracy: '🎯 Accuracy',
  };

  const handleRematch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    initGame();
    navigation.replace('VocabCountdown');
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
            📖 Vocab · {config ? DIFFICULTY_LABELS[config.difficulty] : ''} · {config?.totalQuestions} Qs
          </Text>
        </Animated.View>

        <Animated.View style={[styles.cards, { opacity: cardsOpacity, transform: [{ translateY: cardsY }] }]}>
          <PlayerCard player={player2} isWinner={!isDraw && !p1Wins} gradient={G.p2Button} labels={labels} textColor={C.text} mutedColor={C.textMuted} borderColor={C.border} />
          <PlayerCard player={player1} isWinner={!isDraw && p1Wins}  gradient={G.p1Button} labels={labels} textColor={C.text} mutedColor={C.textMuted} borderColor={C.border} />
        </Animated.View>

        <Animated.View style={{ opacity: cardsOpacity }}>
          <TouchableOpacity style={styles.rematchBtn} onPress={handleRematch} activeOpacity={0.85}>
            <LinearGradient colors={['#059669', '#10B981']} style={styles.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
    shadowColor: '#059669', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnGrad: { paddingVertical: 18, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
  homeBtn: { alignItems: 'center', paddingVertical: 14 },
  homeBtnText: { fontSize: 15, fontWeight: '600' },
});

const card = StyleSheet.create({
  card: { borderRadius: 20, padding: 18, borderWidth: 1 },
  winnerCard: { borderColor: 'rgba(255,255,255,0.3)', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  crown: { fontSize: 28, textAlign: 'center', marginBottom: 4 },
  name: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  score: { color: '#FFFFFF', fontSize: 52, fontWeight: '900', textAlign: 'center', lineHeight: 58 },
  scoreLabel: { fontSize: 11, textAlign: 'center', letterSpacing: 2, marginBottom: 12 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },
});

const stat = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '700' },
});
