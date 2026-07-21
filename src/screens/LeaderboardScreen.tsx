import React, { useEffect } from 'react';
import {
  ActivityIndicator, FlatList, Image, Platform, RefreshControl,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLeaderboardStore } from '../store/leaderboardStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import { flagForCountry } from '../data/countries';
import type { GameMode, LeaderboardEntry, RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Leaderboard'> };

type ModeFilter = GameMode | 'all';

const MODE_EMOJI: Record<GameMode, string> = { math: '🔢', vocab: '📖', color: '🎨', memory: '🧠' };

// Stable, friendly avatar colors derived from the player's name.
const AVATAR_COLORS = ['#4361EE', '#F72585', '#22C55E', '#FB923C', '#7C3AED', '#06B6D4', '#EC4899'];
function colorForName(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Gold / silver / bronze accents for the podium pedestals.
const PEDESTAL: Record<1 | 2 | 3, readonly [string, string]> = {
  1: ['#FDE68A', '#F59E0B'],
  2: ['#E5E7EB', '#9CA3AF'],
  3: ['#FCD9B6', '#C2773F'],
};
const MEDAL: Record<1 | 2 | 3, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardScreen({ navigation }: Props) {
  const { entries, loading, error, filter, setFilter, fetchTop } = useLeaderboardStore();
  const { t } = useLanguageStore();
  const { C, G, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchTop();
  }, []);

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  const accuracyColor = (a: number) => (a >= 80 ? C.timerGreen : a >= 60 ? C.timerYellow : C.timerRed);

  const filters: { key: ModeFilter; label: string; icon: string }[] = [
    { key: 'all', label: t.lbAll, icon: '🏆' },
    { key: 'math', label: t.subjectMath, icon: MODE_EMOJI.math },
    { key: 'vocab', label: t.subjectVocab, icon: MODE_EMOJI.vocab },
    { key: 'color', label: t.subjectColor, icon: MODE_EMOJI.color },
    { key: 'memory', label: t.subjectMemory, icon: MODE_EMOJI.memory },
  ];

  const top3 = entries.slice(0, 3);
  const rest = entries.length >= 3 ? entries.slice(3) : [];
  const showPodium = entries.length >= 3;

  // ---- Podium pedestal (one of the top 3) ----
  const Pedestal = ({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) => {
    const big = place === 1;
    const avatarSize = big ? 72 : 56;
    const pedestalH = place === 1 ? 96 : place === 2 ? 70 : 52;
    return (
      <View style={[styles.pedestalCol, big && styles.pedestalColCenter]}>
        {big && <Text style={styles.crown}>👑</Text>}
        <View style={[styles.avatarWrap, { width: avatarSize, height: avatarSize }]}>
          {entry.avatar_url ? (
            <Image
              source={{ uri: entry.avatar_url }}
              style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colorForName(entry.player_name) },
              ]}
            >
              <Text style={[styles.avatarText, { fontSize: big ? 26 : 20 }]}>{initials(entry.player_name)}</Text>
            </View>
          )}
          <Text style={[styles.avatarMedal, big && styles.avatarMedalBig]}>{MEDAL[place]}</Text>
        </View>

        <Text style={[styles.podiumName, { color: C.text }]} numberOfLines={1}>
          {flagForCountry(entry.country) ? `${flagForCountry(entry.country)} ` : ''}{entry.player_name}
        </Text>
        <Text style={[styles.podiumScore, { color: C.text }]}>
          {entry.score}<Text style={[styles.podiumScoreOf, { color: C.textMuted }]}> /{entry.total}</Text>
        </Text>
        <Text style={[styles.podiumMeta, { color: accuracyColor(entry.accuracy) }]}>
          {MODE_EMOJI[entry.mode]} {entry.accuracy}%
        </Text>

        <LinearGradient
          colors={PEDESTAL[place]}
          style={[styles.pedestal, { height: pedestalH }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Text style={styles.pedestalNum}>{place}</Text>
        </LinearGradient>
      </View>
    );
  };

  const Podium = () => (
    <View style={styles.podium}>
      {top3[1] && <Pedestal entry={top3[1]} place={2} />}
      {top3[0] && <Pedestal entry={top3[0]} place={1} />}
      {top3[2] && <Pedestal entry={top3[2]} place={3} />}
    </View>
  );

  // ---- A normal list row (rank 4+, or all rows when fewer than 3 entries) ----
  const renderRow = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const rank = showPodium ? index + 4 : index + 1;
    const isTop3 = !showPodium && rank <= 3;
    return (
      <View
        style={[
          styles.row,
          { backgroundColor: C.surface, borderColor: isTop3 ? PEDESTAL[rank as 1 | 2 | 3][1] : C.border },
        ]}
      >
        <View style={styles.rankCol}>
          {isTop3 ? (
            <Text style={styles.rowMedal}>{MEDAL[rank as 1 | 2 | 3]}</Text>
          ) : (
            <Text style={[styles.rank, { color: C.textMuted }]}>{rank}</Text>
          )}
        </View>

        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.rowAvatar} />
        ) : (
          <View style={[styles.rowAvatar, styles.rowAvatarFallback, { backgroundColor: colorForName(item.player_name) }]}>
            <Text style={styles.rowAvatarText}>{initials(item.player_name)}</Text>
          </View>
        )}

        <View style={styles.rowMain}>
          <Text style={[styles.name, { color: C.text }]} numberOfLines={1}>
            {flagForCountry(item.country) ? `${flagForCountry(item.country)} ` : ''}{item.player_name}
          </Text>
          <View style={styles.pillRow}>
            <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.pillText, { color: C.textMuted }]}>{MODE_EMOJI[item.mode]} {item.difficulty ?? '—'}</Text>
            </View>
            <Text style={[styles.accuracy, { color: accuracyColor(item.accuracy) }]}>{item.accuracy}%</Text>
          </View>
        </View>

        <View style={styles.scoreBox}>
          <Text style={[styles.score, { color: C.text }]}>{item.score}</Text>
          <Text style={[styles.scoreOf, { color: C.textMuted }]}>/{item.total}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    const message =
      error === 'unconfigured' ? t.lbUnconfigured
      : error ? `${t.lbError}\n${error}`
      : t.lbEmpty;
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyEmoji}>{error === 'unconfigured' ? '🔌' : '🏁'}</Text>
        <Text style={[styles.emptyText, { color: C.textMuted }]}>{message}</Text>
      </View>
    );
  };

  return (
    <LinearGradient colors={G.home} style={[styles.outer, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: C.text }]}>🏆 {t.leaderboardTitle}</Text>
          {entries.length > 0 && (
            <Text style={[styles.subtitle, { color: C.textMuted }]}>{entries.length} {entries.length === 1 ? t.lbPlayer : t.lbPlayers}</Text>
          )}
        </View>
        <View style={{ width: 70 }} />
      </View>

      {/* Filter tabs */}
      <View style={styles.tabs}>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => { tap(); setFilter(f.key); }}
              activeOpacity={0.8}
              style={styles.tabTouch}
            >
              {active ? (
                <LinearGradient
                  colors={G.p1Button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tab}
                >
                  <Text style={[styles.tabText, { color: '#fff' }]} numberOfLines={1}>{f.icon} {f.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.tab, { backgroundColor: C.surface }]}>
                  <Text style={[styles.tabText, { color: C.textMuted }]} numberOfLines={1}>{f.icon} {f.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={showPodium ? rest : entries}
        keyExtractor={(item) => item.id}
        renderItem={renderRow}
        ListHeaderComponent={showPodium ? <Podium /> : null}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => fetchTop()} tintColor={C.text} />
        }
      />

      {loading && entries.length === 0 && (
        <ActivityIndicator style={styles.loader} color={C.p1Primary} size="large" />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 4 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 22, fontWeight: '700' },
  titleWrap: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },
  subtitle: { fontSize: 12, marginTop: 2, fontWeight: '600' },

  tabs: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tabTouch: { flex: 1 },
  tab: { paddingVertical: 9, paddingHorizontal: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 12, fontWeight: '700' },

  listContent: { paddingTop: 8, paddingBottom: 28, gap: 8, flexGrow: 1 },

  // Podium
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 18, marginTop: 4 },
  pedestalCol: { flex: 1, alignItems: 'center' },
  pedestalColCenter: { marginBottom: 0 },
  crown: { fontSize: 24, marginBottom: 2 },
  avatarWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  avatarText: { color: '#fff', fontWeight: '800' },
  avatarMedal: { position: 'absolute', bottom: -8, fontSize: 18 },
  avatarMedalBig: { fontSize: 22, bottom: -10 },
  podiumName: { fontSize: 13, fontWeight: '700', maxWidth: '100%', marginTop: 4 },
  podiumScore: { fontSize: 18, fontWeight: '800', marginTop: 1 },
  podiumScoreOf: { fontSize: 11, fontWeight: '600' },
  podiumMeta: { fontSize: 11, fontWeight: '700', marginTop: 1, marginBottom: 8 },
  pedestal: { width: '92%', borderTopLeftRadius: 12, borderTopRightRadius: 12, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8 },
  pedestalNum: { fontSize: 22, fontWeight: '900', color: 'rgba(0,0,0,0.35)' },

  // List rows
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12,
  },
  rankCol: { width: 26, alignItems: 'center' },
  rank: { fontSize: 15, fontWeight: '800' },
  rowMedal: { fontSize: 18 },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden' },
  rowAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  rowMain: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700' },
  pillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '600' },
  accuracy: { fontSize: 12, fontWeight: '700' },
  scoreBox: { flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  score: { fontSize: 20, fontWeight: '800' },
  scoreOf: { fontSize: 12 },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  loader: { position: 'absolute', top: '45%', alignSelf: 'center' },
});
