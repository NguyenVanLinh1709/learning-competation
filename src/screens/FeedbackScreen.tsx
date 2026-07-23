import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../store/languageStore';
import BackButton from '../components/BackButton';

const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/1507051395604414677/1C1aMKWM6KTz4PCZyE7fFLRcItC4VQDG328oYNhOalHpuxPZ-IX08Ma6Q1Fqah6v2Aw4';

type FeedbackType = 'feedback' | 'bug';
type SendState = 'idle' | 'sending' | 'success' | 'error';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Feedback'> };

export default function FeedbackScreen({ navigation }: Props) {
  const { C, G, isDark } = useTheme();
  const { t } = useLanguageStore();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sendState, setSendState] = useState<SendState>('idle');

  const typeConfig: Record<FeedbackType, { emoji: string; color: string; label: string }> = {
    feedback: { emoji: '💡', color: '#4361EE', label: t.feedbackTypeGeneral },
    bug: { emoji: '🐛', color: '#EF4444', label: t.feedbackTypeBug },
  };

  async function pickFromGallery() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function pickFromCamera() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  function handleAttachImage() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(t.feedbackImagePickTitle, undefined, [
      { text: t.feedbackImageCamera, onPress: pickFromCamera },
      { text: t.feedbackImageGallery, onPress: pickFromGallery },
      { text: t.feedbackImageCancel, style: 'cancel' },
    ]);
  }

  async function handleSend() {
    if (!message.trim() || sendState === 'sending') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSendState('sending');

    const { emoji, label } = typeConfig[type];
    const embedColor = type === 'bug' ? 14495300 : 4415982;

    try {
      let res: Response;

      if (imageUri) {
        // Multipart: attach the image and reference it in the embed
        const filename = imageUri.split('/').pop() ?? 'image.jpg';
        const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mimeType = ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

        const embed = {
          title: `${emoji} ${label}`,
          description: message.trim(),
          color: embedColor,
          image: { url: `attachment://${filename}` },
          footer: { text: 'Dual Minds App' },
          timestamp: new Date().toISOString(),
        };

        const form = new FormData();
        form.append('payload_json', JSON.stringify({ embeds: [embed] }));
        form.append('files[0]', { uri: imageUri, name: filename, type: mimeType } as unknown as Blob);

        res = await fetch(DISCORD_WEBHOOK, { method: 'POST', body: form });
      } else {
        // Plain JSON — no attachment
        const payload = {
          embeds: [{
            title: `${emoji} ${label}`,
            description: message.trim(),
            color: embedColor,
            footer: { text: 'Dual Minds App' },
            timestamp: new Date().toISOString(),
          }],
        };
        res = await fetch(DISCORD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok || res.status === 204) {
        setSendState('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setSendState('error');
      }
    } catch {
      setSendState('error');
    }
  }

  function handleReset() {
    setMessage('');
    setImageUri(null);
    setSendState('idle');
  }

  const canSend = message.trim().length > 0 && sendState === 'idle';

  return (
    <LinearGradient colors={G.home} style={styles.container}>
      {/* Back button */}
      <View style={[styles.topBar, { paddingTop: insets.top + 16 }]}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Text style={[styles.title, { color: C.text }]}>{t.feedbackTitle}</Text>
          <Text style={[styles.subtitle, { color: C.textMuted }]}>{t.feedbackSubtitle}</Text>

          {/* Type selector */}
          <View style={styles.typeRow}>
            {(['feedback', 'bug'] as FeedbackType[]).map((k) => {
              const cfg = typeConfig[k];
              const active = type === k;
              return (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.typeBtn,
                    { backgroundColor: C.surface, borderColor: C.border },
                    active && { backgroundColor: cfg.color + '22', borderColor: cfg.color },
                  ]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType(k); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.typeEmoji}>{cfg.emoji}</Text>
                  <Text style={[styles.typeLabel, { color: active ? cfg.color : C.textMuted }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Text input + image attachment — hidden after success */}
          {sendState !== 'success' && (
            <>
              <View style={[styles.inputWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
                <TextInput
                  style={[styles.input, { color: C.text }]}
                  placeholder={t.feedbackPlaceholder}
                  placeholderTextColor={C.textMuted}
                  multiline
                  value={message}
                  onChangeText={setMessage}
                  maxLength={1000}
                  editable={sendState === 'idle'}
                />
                <Text style={[styles.charCount, { color: C.textMuted }]}>{message.length}/1000</Text>
              </View>

              {/* Image preview */}
              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setImageUri(null); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.attachBtn, { backgroundColor: C.surface, borderColor: C.border }]}
                  onPress={handleAttachImage}
                  disabled={sendState === 'sending'}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.attachBtnText, { color: C.textMuted }]}>{t.feedbackAddImage}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Success state */}
          {sendState === 'success' && (
            <View style={[
              styles.successBox,
              { backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)', borderColor: '#22C55E' },
            ]}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={[styles.successTitle, { color: C.text }]}>{t.feedbackSent}</Text>
              <Text style={[styles.successMsg, { color: C.textMuted }]}>{t.feedbackSentDesc}</Text>
            </View>
          )}

          {/* Error message */}
          {sendState === 'error' && (
            <Text style={styles.errorText}>{t.feedbackError}</Text>
          )}

          {/* Send / action buttons */}
          {sendState !== 'success' ? (
            <TouchableOpacity
              style={[styles.sendBtn, { opacity: canSend ? 1 : 0.5 }]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={type === 'bug' ? ['#EF4444', '#B91C1C'] : G.p1Button}
                style={styles.sendGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {sendState === 'sending'
                  ? <ActivityIndicator color="#FFF" />
                  : <Text style={styles.sendText}>{t.feedbackSend}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <View style={styles.successActions}>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: C.border }]}
                onPress={handleReset}
                activeOpacity={0.8}
              >
                <Text style={[styles.outlineBtnText, { color: C.text }]}>{t.feedbackSendAnother}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: C.border }]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.8}
              >
                <Text style={[styles.outlineBtnText, { color: C.text }]}>{t.backHome}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingBottom: 8 },
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  backText: { fontSize: 14, fontWeight: '600' },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 13, marginBottom: 24, lineHeight: 18 },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  typeEmoji: { fontSize: 18 },
  typeLabel: { fontSize: 13, fontWeight: '700' },

  inputWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    minHeight: 140,
  },
  input: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 6 },

  attachBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  attachBtnText: { fontSize: 13, fontWeight: '600' },

  previewWrap: {
    marginBottom: 12,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 14,
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  errorText: { color: '#EF4444', fontSize: 13, marginBottom: 8, textAlign: 'center' },

  sendBtn: { marginTop: 4, borderRadius: 16, overflow: 'hidden' },
  sendGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },

  successBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 28,
    alignItems: 'center',
    marginBottom: 16,
  },
  successEmoji: { fontSize: 48, marginBottom: 10 },
  successTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  successMsg: { fontSize: 13, textAlign: 'center', lineHeight: 18 },

  successActions: { flexDirection: 'row', gap: 10 },
  outlineBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  outlineBtnText: { fontSize: 13, fontWeight: '700' },
});
