import React, { useEffect, useRef } from 'react';
import {
  Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../store/languageStore';
import { useProfileStore } from '../store/profileStore';
import { LangCode, TRANSLATIONS } from '../i18n/translations';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

const LANG_ORDER: LangCode[] = ['en', 'vi', 'zh'];

export default function HomeScreen({ navigation }: Props) {
  const { C, G, isDark, toggle } = useTheme();
  const { lang, t, setLanguage } = useLanguageStore();
  const { displayName, avatarUrl } = useProfileStore();

  const titleY = useRef(new Animated.Value(-40)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(40)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(titleY, { toValue: 0, friction: 7, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      Animated.parallel([
        Animated.spring(cardsY, { toValue: 0, friction: 7, useNativeDriver: true }),
        Animated.timing(cardsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const tap = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) =>
    Haptics.impactAsync(style);

  return (
    <LinearGradient colors={G.home} style={styles.container}>
      {/* Decorative blobs — subtler in light mode */}
      <View style={[styles.blob, styles.blob1, { backgroundColor: C.p1Primary }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: C.p2Primary }]} />

      {/* Top bar: language + theme toggle */}
      <View style={styles.topBar}>
        <View style={styles.langRow}>
          {LANG_ORDER.map((code) => (
            <TouchableOpacity
              key={code}
              style={[
                styles.langBtn,
                { backgroundColor: C.surface, borderColor: 'transparent' },
                lang === code && { borderColor: C.p1Primary, backgroundColor: isDark ? 'rgba(67,97,238,0.2)' : 'rgba(67,97,238,0.1)' },
              ]}
              onPress={() => { tap(); setLanguage(code); }}
              activeOpacity={0.75}
            >
              <Text style={styles.langFlag}>{TRANSLATIONS[code].langFlag}</Text>
              <Text style={[styles.langCode, { color: lang === code ? C.text : C.textMuted }]}>
                {code.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.topBarRight}>
          {/* Profile */}
          <TouchableOpacity
            style={[styles.profileBtn, { borderColor: C.p1Primary, backgroundColor: C.surface }]}
            onPress={() => { tap(); navigation.navigate('Profile'); }}
            activeOpacity={0.75}
          >
            {avatarUrl
              ? <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
              : <Text style={[styles.profileIcon, { color: C.text }]}>{displayName ? displayName.trim()[0].toUpperCase() : '👤'}</Text>}
          </TouchableOpacity>

          {/* Light / dark toggle */}
          <TouchableOpacity
            style={[styles.themeBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => { tap(); toggle(); }}
            activeOpacity={0.75}
          >
            <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <Animated.View
        style={[styles.titleBlock, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}
      >
        <Text style={styles.logo}>⚡</Text>
        <Text style={[styles.title, { color: C.text }]}>Learning Battle</Text>
        <Text style={[styles.tagline, { color: C.textMuted }]}>{t.appTagline}</Text>
      </Animated.View>

      {/* Subject cards */}
      <Animated.View
        style={[styles.cardList, { opacity: cardsOpacity, transform: [{ translateY: cardsY }] }]}
      >
        <Text style={[styles.sectionLabel, { color: C.textMuted }]}>{t.selectSubject}</Text>

        {/* Mathematics — active */}
        <LinearGradient
          colors={G.p1Button}
          style={[styles.cardActive, { shadowColor: C.p1Primary }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardInner}>
            <Text style={styles.cardEmoji}>🔢</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardName}>{t.subjectMath}</Text>
              <Text style={styles.cardDesc}>{t.subjectMathDesc}</Text>
            </View>
          </View>
          <View style={styles.modeBtnRow}>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Setup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>⚔️ {t.battle}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, styles.modeBtnSolo]}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('SoloSetup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>🎯 {t.solo}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* English Vocabulary — active */}
        <LinearGradient
          colors={['#059669', '#10B981']}
          style={[styles.cardActive, { shadowColor: '#059669' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardInner}>
            <Text style={styles.cardEmoji}>📖</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardName}>{t.subjectVocab}</Text>
              <Text style={styles.cardDesc}>{t.subjectVocabDesc}</Text>
            </View>
          </View>
          <View style={styles.modeBtnRow}>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('VocabSetup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>⚔️ {t.battle}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, styles.modeBtnSolo]}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('VocabSoloSetup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>🎯 {t.solo}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Color Sense — active, solo only */}
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          style={[styles.cardActive, { shadowColor: '#7C3AED' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardInner}>
            <Text style={styles.cardEmoji}>🎨</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardName}>{t.subjectColor}</Text>
              <Text style={styles.cardDesc}>{t.subjectColorDesc}</Text>
            </View>
          </View>
          <View style={styles.modeBtnRow}>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('ColorBattleSetup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>⚔️ {t.battle}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, styles.modeBtnSolo]}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('ColorSetup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>🎯 {t.solo}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Memory Flash — active, no reading needed (pre-alphabet kids) */}
        <LinearGradient
          colors={['#6366F1', '#818CF8']}
          style={[styles.cardActive, { shadowColor: '#6366F1' }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardInner}>
            <Text style={styles.cardEmoji}>🧠</Text>
            <View style={styles.cardText}>
              <Text style={styles.cardName}>{t.subjectMemory}</Text>
              <Text style={styles.cardDesc}>{t.subjectMemoryDesc}</Text>
            </View>
          </View>
          <View style={styles.modeBtnRow}>
            <TouchableOpacity
              style={styles.modeBtn}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('MemoryBattleSetup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>⚔️ {t.battle}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, styles.modeBtnSolo]}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('MemorySetup'); }}
              activeOpacity={0.8}
            >
              <Text style={styles.modeBtnText}>🎯 {t.solo}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Prominent leaderboard call-to-action */}
      <Animated.View style={{ opacity: cardsOpacity, transform: [{ translateY: cardsY }] }}>
        <TouchableOpacity
          style={styles.leaderboardBtn}
          onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Leaderboard'); }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FDE68A', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.leaderboardGrad}
          >
            <Text style={styles.leaderboardIcon}>🏆</Text>
            <Text style={styles.leaderboardText}>{t.leaderboardBtn}</Text>
            <Text style={styles.leaderboardChevron}>›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.footerRow}>
        <Text style={[styles.footer, { color: C.textMuted }]}>{t.homeFooter}</Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity
            onPress={() => { tap(); navigation.navigate('Feedback'); }}
            activeOpacity={0.75}
          >
            <Text style={[styles.feedbackLink, { color: C.textMuted }]}>{t.feedbackBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.07 },
  blob1: { width: 280, height: 280, top: -80, right: -80 },
  blob2: { width: 200, height: 200, bottom: 120, left: -70 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  langRow: { flexDirection: 'row', gap: 6 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  langFlag: { fontSize: 14 },
  langCode: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatar: { width: '100%', height: '100%' },
  profileIcon: { fontSize: 16, fontWeight: '800' },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeIcon: { fontSize: 18 },

  // Title
  titleBlock: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 52, marginBottom: 6 },
  title: { fontSize: 40, fontWeight: '900', letterSpacing: -1 },
  tagline: { fontSize: 10, letterSpacing: 2, marginTop: 6, fontWeight: '700', textAlign: 'center' },

  // Cards
  cardList: { flex: 1 },
  sectionLabel: { fontSize: 11, letterSpacing: 3, fontWeight: '700', marginBottom: 12 },
  cardActive: {
    borderRadius: 18,
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  cardInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 12 },
  modeBtnRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  modeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  modeBtnSolo: { backgroundColor: 'rgba(255,255,255,0.12)' },
  modeBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  cardEmoji: { fontSize: 30, width: 40, textAlign: 'center' },
  cardText: { flex: 1 },
  cardName: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  cardDesc: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2 },
  // Leaderboard call-to-action
  leaderboardBtn: {
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  leaderboardGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  leaderboardIcon: { fontSize: 24 },
  leaderboardText: { flex: 1, color: '#78350F', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  leaderboardChevron: { color: '#78350F', fontSize: 26, fontWeight: '900', marginTop: -2 },

  footerRow: { alignItems: 'center', gap: 8 },
  footerLinks: { flexDirection: 'row', gap: 18 },
  footer: { fontSize: 11, textAlign: 'center', letterSpacing: 0.5 },
  feedbackLink: { fontSize: 11, letterSpacing: 0.5, textDecorationLine: 'underline' },
});
