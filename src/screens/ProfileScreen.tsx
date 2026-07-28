import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Modal, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useProfileStore } from '../store/profileStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import BackButton from '../components/BackButton';
import { uploadAvatar } from '../lib/avatar';
import { COUNTRIES, countryName, flagForCountry } from '../data/countries';
import { makeResponsive } from '../utils/responsive';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'> };

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

export default function ProfileScreen({ navigation }: Props) {
  const { userId, displayName, country, avatarUrl, setDisplayName, setCountry, setAvatarUrl } = useProfileStore();
  const { t } = useLanguageStore();
  const { C, G, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isTablet } = makeResponsive(width);

  const [name, setName] = useState(displayName);
  const [pickedCountry, setPickedCountry] = useState(country);
  // A newly picked local image (preview uri + base64 for upload), before saving.
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [localBase64, setLocalBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  const tap = (s: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => Haptics.impactAsync(s);

  const previewUri = localUri ?? (avatarUrl || null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [search]);

  const pickAvatar = async () => {
    tap();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setLocalUri(result.assets[0].uri);
      setLocalBase64(result.assets[0].base64 ?? null);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSaving(true);
    // Upload the new avatar first (if one was picked); keep the old URL on failure.
    let url = avatarUrl;
    if (localBase64 && userId) {
      const uploaded = await uploadAvatar(userId, localBase64);
      if (uploaded) url = uploaded;
    }
    setDisplayName(name.trim());
    setCountry(pickedCountry);
    setAvatarUrl(url);
    setSaving(false);
    navigation.goBack();
  };

  return (
    <LinearGradient colors={G.home} style={[styles.outer, { paddingTop: insets.top + 16, paddingBottom: insets.bottom }]}>
      <View style={[styles.contentWrapper, isTablet && { maxWidth: 480, alignSelf: 'center', width: '100%' }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: C.text }]}>👤 {t.profileTitle}</Text>
        </View>
        <View style={{ width: 70 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={[styles.subtitle, { color: C.textMuted }]}>{t.profileSubtitle}</Text>

        {/* Avatar */}
        <View style={styles.avatarBlock}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colorForName(name || 'Player') }]}>
                <Text style={styles.avatarInitials}>{initials(name || 'Player')}</Text>
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: C.p1Primary, borderColor: C.screenBg }]}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: C.textMuted }]}>{t.profileAvatarHint}</Text>
        </View>

        {/* Name */}
        <Text style={[styles.label, { color: C.textMuted }]}>{t.profileNameLabel}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t.profileNamePlaceholder}
          placeholderTextColor={C.textMuted}
          maxLength={20}
          style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
        />

        {/* Country */}
        <Text style={[styles.label, { color: C.textMuted }]}>{t.profileCountryLabel}</Text>
        <TouchableOpacity
          onPress={() => { tap(); setPickerOpen(true); }}
          activeOpacity={0.8}
          style={[styles.input, styles.countryRow, { backgroundColor: C.surface, borderColor: C.border }]}
        >
          <Text style={[styles.countryText, { color: pickedCountry ? C.text : C.textMuted }]}>
            {pickedCountry ? `${flagForCountry(pickedCountry)}  ${countryName(pickedCountry)}` : t.profileSelectCountry}
          </Text>
          <Text style={[styles.chevron, { color: C.textMuted }]}>›</Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Save */}
        <TouchableOpacity onPress={handleSave} activeOpacity={0.85} disabled={saving} style={styles.saveBtn}>
          <LinearGradient colors={G.p1Button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveGrad}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveText}>{t.profileSave}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </KeyboardAvoidingView>
      </View>

      {/* Country picker modal */}
      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: C.screenBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: C.text }]}>{t.profileSelectCountry}</Text>
              <TouchableOpacity onPress={() => { tap(); setPickerOpen(false); }} activeOpacity={0.75}>
                <Text style={[styles.modalClose, { color: C.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t.profileSearchCountry}
              placeholderTextColor={C.textMuted}
              style={[styles.searchInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
            />
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.code}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <TouchableOpacity
                  onPress={() => { tap(); setPickedCountry(''); setPickerOpen(false); setSearch(''); }}
                  style={[styles.countryItem, { borderBottomColor: C.border }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.countryItemText, { color: C.textMuted }]}>🚫  {t.profileNoCountry}</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => {
                const active = item.code === pickedCountry;
                return (
                  <TouchableOpacity
                    onPress={() => { tap(); setPickedCountry(item.code); setPickerOpen(false); setSearch(''); }}
                    style={[styles.countryItem, { borderBottomColor: C.border }, active && { backgroundColor: isDark ? 'rgba(67,97,238,0.18)' : 'rgba(67,97,238,0.1)' }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.countryItemText, { color: C.text }]}>{flagForCountry(item.code)}  {item.name}</Text>
                    {active && <Text style={{ color: C.p1Primary, fontWeight: '800' }}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const AVATAR_SIZE = 112;

const styles = StyleSheet.create({
  outer: { flex: 1, paddingTop: Platform.OS === 'ios' ? 60 : 44, paddingHorizontal: 16 },
  contentWrapper: { flex: 1 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 22, fontWeight: '700' },
  titleWrap: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '800' },

  body: { flex: 1, paddingHorizontal: 4, paddingBottom: 24 },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 16 },

  avatarBlock: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 40, fontWeight: '900' },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 36, height: 36, borderRadius: 18, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  cameraIcon: { fontSize: 15 },
  avatarHint: { fontSize: 12, marginTop: 10 },

  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 4 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 16 },
  countryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countryText: { fontSize: 16 },
  chevron: { fontSize: 22, fontWeight: '800' },

  saveBtn: { borderRadius: 16, overflow: 'hidden', shadowColor: '#4361EE', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  saveGrad: { paddingVertical: 17, alignItems: 'center' },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { height: '75%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingTop: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalClose: { fontSize: 20, fontWeight: '700', padding: 4 },
  searchInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, marginBottom: 8 },
  countryItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderRadius: 8 },
  countryItemText: { fontSize: 16 },
});
