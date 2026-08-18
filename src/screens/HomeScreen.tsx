import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Image, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity,
  useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../store/languageStore';
import { useProfileStore } from '../store/profileStore';
import { LangCode, TRANSLATIONS } from '../i18n/translations';
import { makeResponsive } from '../utils/responsive';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> };

const LANG_ORDER: LangCode[] = ['en', 'vi', 'zh'];
const APP_VERSION = Constants.expoConfig?.version;
// Android's versionCode is what Google Play Console uses to identify each
// uploaded build — shown alongside the marketing version for easy lookup.
const APP_VERSION_CODE = Constants.expoConfig?.android?.versionCode;

export default function HomeScreen({ navigation }: Props) {
  const { C, G, isDark, toggle } = useTheme();
  const { lang, t, setLanguage } = useLanguageStore();
  const { displayName, avatarUrl } = useProfileStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const { scale: s, mscale: ms, isTablet, isLargeTablet, hPad, contentWidth } = useMemo(
    () => makeResponsive(width),
    [width],
  );

  // Language dropdown
  const [langOpen, setLangOpen] = useState(false);
  const langBtnRef = useRef<View>(null);
  const [dropdownPos, setDropdownPos] = useState({ x: 0, y: 0, w: 0 });

  const openLangDropdown = () => {
    tap();
    langBtnRef.current?.measureInWindow((x, y, btnW, btnH) => {
      setDropdownPos({ x, y: y + btnH + 6, w: Math.max(btnW, s(180)) });
      setLangOpen(true);
    });
  };

  // Two-column card layout on tablets
  const cardGap = isTablet ? s(12) : 0;
  const twoColWidth = (contentWidth - cardGap) / 2;
  const cardWidth = (isLast = false): number | '100%' =>
    isTablet ? (isLast ? '100%' : twoColWidth) : '100%';

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

  const cardRowStyle = { paddingHorizontal: s(14), paddingVertical: s(9), gap: s(12) };
  const cardLeftStyle = { gap: s(3) };
  const cardDividerStyle = { height: s(42) };
  const cardRightStyle = { gap: s(5) };
  const modeBtnStyle = { borderRadius: s(12), paddingVertical: s(6) };
  const modeBtnTextStyle = { fontSize: ms(12) };
  const cardEmojiStyle = { fontSize: ms(26) };
  const cardNameStyle = { fontSize: ms(12) };
  const cardActiveBase = { borderRadius: s(16), marginBottom: s(8) };

  const iconBtnStyle = {
    backgroundColor: C.surface,
    borderColor: C.border,
    width: s(36),
    height: s(36),
    borderRadius: s(18),
  };

  return (
    <LinearGradient
      colors={G.home}
      style={[
        styles.container,
        { paddingHorizontal: hPad, paddingTop: insets.top + s(16), paddingBottom: insets.bottom },
      ]}
    >
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blob1, { backgroundColor: C.p1Primary, width: s(280), height: s(280) }]} />
      <View style={[styles.blob, styles.blob2, { backgroundColor: C.p2Primary, width: s(200), height: s(200) }]} />

      {/* Content wrapper — caps width on large tablets */}
      <View style={[styles.contentWrapper, isLargeTablet && { maxWidth: 720, alignSelf: 'center', width: '100%' }]}>

        {/* ── Top bar ── */}
        <View style={[styles.topBar, { marginBottom: s(16) }]}>

          {/* Language dropdown trigger */}
          <TouchableOpacity
            ref={langBtnRef}
            style={[styles.langDropdownBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={openLangDropdown}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: s(14) }}>{TRANSLATIONS[lang].langFlag}</Text>
            <Text style={[styles.langDropdownCode, { color: C.text, fontSize: ms(12) }]}>
              {lang.toUpperCase()}
            </Text>
            <Text style={[styles.langChevron, { color: C.textMuted, fontSize: s(10) }]}>▾</Text>
          </TouchableOpacity>

          {/* Right icons */}
          <View style={styles.topBarRight}>
            {/* Leaderboard — tạm ẩn: tính năng chưa hoạt động tốt (không xoá) */}
            {/* <TouchableOpacity
              style={[styles.topIconBtn, iconBtnStyle]}
              onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Leaderboard'); }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: s(17) }}>🏆</Text>
            </TouchableOpacity> */}

            {/* Feedback */}
            <TouchableOpacity
              style={[styles.topIconBtn, iconBtnStyle]}
              onPress={() => { tap(); navigation.navigate('Feedback'); }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: s(17) }}>💬</Text>
            </TouchableOpacity>

            {/* Profile */}
            <TouchableOpacity
              style={[styles.profileBtn, { borderColor: C.p1Primary, backgroundColor: C.surface, width: s(36), height: s(36), borderRadius: s(18) }]}
              onPress={() => { tap(); navigation.navigate('Profile'); }}
              activeOpacity={0.75}
            >
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
                : <Text style={[styles.profileIcon, { color: C.text, fontSize: ms(16) }]}>
                    {displayName ? displayName.trim()[0].toUpperCase() : '👤'}
                  </Text>}
            </TouchableOpacity>

            {/* Theme toggle */}
            <TouchableOpacity
              style={[styles.topIconBtn, iconBtnStyle]}
              onPress={() => { tap(); toggle(); }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: s(17) }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Scrollable content ── */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Title */}
          <Animated.View style={[styles.titleBlock, { marginBottom: s(16), opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
            <Text style={{ fontSize: ms(44), marginBottom: 4 }}>⚡</Text>
            <Text style={[styles.title, { color: C.text, fontSize: ms(34) }]}>Dual Minds</Text>
          </Animated.View>

          {/* Subject cards */}
          <Animated.View style={{ opacity: cardsOpacity, transform: [{ translateY: cardsY }] }}>
            <View style={isTablet ? { flexDirection: 'row', flexWrap: 'wrap', gap: cardGap } : undefined}>

              {/* Memory Games */}
              <LinearGradient colors={['#6366F1', '#818CF8']} style={[styles.cardActive, cardActiveBase, { shadowColor: '#6366F1', width: cardWidth() }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.cardRow, cardRowStyle]}>
                  <View style={[styles.cardLeft, cardLeftStyle]}>
                    <Text style={cardEmojiStyle}>🧠</Text>
                    <Text style={[styles.cardName, cardNameStyle]}>{t.subjectMemory}</Text>
                  </View>
                  <View style={[styles.cardDivider, cardDividerStyle]} />
                  <View style={[styles.cardRight, cardRightStyle]}>
                    <TouchableOpacity style={[styles.modeBtn, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('MemoryBattleSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>⚔️ {t.battle}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modeBtn, styles.modeBtnSolo, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('MemorySetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>🎯 {t.solo}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

              {/* Color Sense */}
              <LinearGradient colors={['#7C3AED', '#A855F7']} style={[styles.cardActive, cardActiveBase, { shadowColor: '#7C3AED', width: cardWidth() }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.cardRow, cardRowStyle]}>
                  <View style={[styles.cardLeft, cardLeftStyle]}>
                    <Text style={cardEmojiStyle}>🎨</Text>
                    <Text style={[styles.cardName, cardNameStyle]}>{t.subjectColor}</Text>
                  </View>
                  <View style={[styles.cardDivider, cardDividerStyle]} />
                  <View style={[styles.cardRight, cardRightStyle]}>
                    <TouchableOpacity style={[styles.modeBtn, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('ColorBattleSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>⚔️ {t.battle}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modeBtn, styles.modeBtnSolo, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('ColorSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>🎯 {t.solo}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

              {/* English Vocabulary */}
              <LinearGradient colors={['#059669', '#10B981']} style={[styles.cardActive, cardActiveBase, { shadowColor: '#059669', width: cardWidth() }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.cardRow, cardRowStyle]}>
                  <View style={[styles.cardLeft, cardLeftStyle]}>
                    <Text style={cardEmojiStyle}>📖</Text>
                    <Text style={[styles.cardName, cardNameStyle]}>{t.subjectVocab}</Text>
                  </View>
                  <View style={[styles.cardDivider, cardDividerStyle]} />
                  <View style={[styles.cardRight, cardRightStyle]}>
                    <TouchableOpacity style={[styles.modeBtn, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('VocabSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>⚔️ {t.battle}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modeBtn, styles.modeBtnSolo, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('VocabSoloSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>🎯 {t.solo}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

              {/* Mathematics */}
              <LinearGradient colors={G.p1Button} style={[styles.cardActive, cardActiveBase, { shadowColor: C.p1Primary, width: cardWidth() }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.cardRow, cardRowStyle]}>
                  <View style={[styles.cardLeft, cardLeftStyle]}>
                    <Text style={cardEmojiStyle}>🔢</Text>
                    <Text style={[styles.cardName, cardNameStyle]}>{t.subjectMath}</Text>
                  </View>
                  <View style={[styles.cardDivider, cardDividerStyle]} />
                  <View style={[styles.cardRight, cardRightStyle]}>
                    <TouchableOpacity style={[styles.modeBtn, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('Setup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>⚔️ {t.battle}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modeBtn, styles.modeBtnSolo, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('SoloSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>🎯 {t.solo}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

              {/* Flag Quiz — spans full width on tablet */}
              <LinearGradient colors={['#0F766E', '#14B8A6']} style={[styles.cardActive, cardActiveBase, { shadowColor: '#0F766E', width: cardWidth(true) }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={[styles.cardRow, cardRowStyle]}>
                  <View style={[styles.cardLeft, cardLeftStyle]}>
                    <Text style={cardEmojiStyle}>🏳️</Text>
                    <Text style={[styles.cardName, cardNameStyle]}>{t.subjectFlag}</Text>
                  </View>
                  <View style={[styles.cardDivider, cardDividerStyle]} />
                  <View style={[styles.cardRight, cardRightStyle]}>
                    <TouchableOpacity style={[styles.modeBtn, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('FlagBattleSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>⚔️ {t.battle}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modeBtn, styles.modeBtnSolo, modeBtnStyle]} onPress={() => { tap(Haptics.ImpactFeedbackStyle.Medium); navigation.navigate('FlagSoloSetup'); }} activeOpacity={0.8}>
                      <Text style={[styles.modeBtnText, modeBtnTextStyle]}>🎯 {t.solo}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>

            </View>
          </Animated.View>
        </ScrollView>

        {APP_VERSION && (
          <Text style={[styles.version, { color: C.textMuted, fontSize: ms(11) }]}>
            v{APP_VERSION}{APP_VERSION_CODE ? ` (${APP_VERSION_CODE})` : ''}
          </Text>
        )}
      </View>

      {/* ── Language dropdown Modal ── */}
      <Modal
        transparent
        visible={langOpen}
        animationType="fade"
        onRequestClose={() => setLangOpen(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setLangOpen(false)}>
          <View
            style={[
              styles.dropdown,
              {
                top: dropdownPos.y,
                left: dropdownPos.x,
                minWidth: dropdownPos.w,
                backgroundColor: isDark ? '#1E1E2E' : '#FFFFFF',
                borderColor: C.border,
              },
            ]}
          >
            {LANG_ORDER.map((code, i) => (
              <TouchableOpacity
                key={code}
                style={[
                  styles.dropdownItem,
                  { paddingHorizontal: s(14), paddingVertical: s(12) },
                  i < LANG_ORDER.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                  lang === code && { backgroundColor: isDark ? 'rgba(67,97,238,0.18)' : 'rgba(67,97,238,0.08)' },
                ]}
                onPress={() => { tap(); setLanguage(code); setLangOpen(false); }}
                activeOpacity={0.75}
              >
                <Text style={{ fontSize: ms(18) }}>{TRANSLATIONS[code].langFlag}</Text>
                <Text
                  style={[styles.dropdownItemText, { fontSize: ms(15), color: lang === code ? C.p1Primary : C.text }]}
                  numberOfLines={1}
                >
                  {TRANSLATIONS[code].langName ?? code.toUpperCase()}
                </Text>
                {lang === code && <Text style={[styles.dropdownCheck, { fontSize: ms(14), color: C.p1Primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentWrapper: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 28 },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.07 },
  blob1: { top: -80, right: -80 },
  blob2: { bottom: 120, left: -70 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  langDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  langDropdownCode: { fontWeight: '700', letterSpacing: 0.5 },
  langChevron: { fontWeight: '700' },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topIconBtn: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileBtn: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileAvatar: { width: '100%', height: '100%' },
  profileIcon: { fontWeight: '800' },

  // Footer
  version: { textAlign: 'center', fontWeight: '600', paddingTop: 6, opacity: 0.6 },

  // Title
  titleBlock: { alignItems: 'center' },
  title: { fontWeight: '900', letterSpacing: -1 },

  // Cards
  cardActive: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardLeft: { flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  cardDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  cardRight: { flexDirection: 'column', width: '50%' },
  modeBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  modeBtnSolo: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.18)' },
  modeBtnColor: { backgroundColor: 'rgba(249,115,22,0.28)', borderColor: 'rgba(249,115,22,0.55)' },
  modeBtnText: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.8 },
  cardName: { color: '#FFFFFF', fontWeight: '800', textAlign: 'center' },

  // Language dropdown Modal
  modalOverlay: { flex: 1 },
  dropdown: {
    position: 'absolute',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownItemText: { flex: 1, fontSize: 14, fontWeight: '700' },
  dropdownCheck: { fontSize: 14, fontWeight: '900' },
});
