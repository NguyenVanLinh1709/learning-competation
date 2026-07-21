import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  body: string;
  accentColor?: string;
};

export default function HowToPlayModal({ visible, onClose, title, body, accentColor }: Props) {
  const { C, isDark } = useTheme();
  const accent = accentColor ?? C.p1Primary;
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.card, { backgroundColor: cardBg, borderColor: C.border }]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: C.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.close, { color: C.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.body, { color: C.textMuted }]}>{body}</Text>

          <TouchableOpacity
            style={[styles.gotItBtn, { backgroundColor: accent }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.gotItText}>OK</Text>
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
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '900', flex: 1 },
  close: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 23 },
  gotItBtn: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  gotItText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
