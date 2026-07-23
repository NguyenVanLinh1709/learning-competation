import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  visible, title, message, cancelLabel, confirmLabel, onCancel, onConfirm,
}: Props) {
  const { C, isDark } = useTheme();
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={[styles.card, { backgroundColor: cardBg, borderColor: C.border }]}
        >
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          <Text style={[styles.message, { color: C.textMuted }]}>{message}</Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.actionText, { color: C.textMuted }]}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={[styles.actionText, styles.destructive]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
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
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  title: { fontSize: 18, fontWeight: '900', marginBottom: 10 },
  message: { fontSize: 14, lineHeight: 21, marginBottom: 22 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 28 },
  actionText: { fontSize: 15, fontWeight: '800' },
  destructive: { color: '#DC2626' },
});
