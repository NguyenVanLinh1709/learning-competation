import React from 'react';
import { StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';

type Props = {
  p1Name: string;
  p2Name: string;
  setP1Name: (v: string) => void;
  setP2Name: (v: string) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Compact two-player name entry used across every battle setup screen.
 * Two clearly-outlined editable fields (Player 2 — top, Player 1 — bottom):
 * a colored position badge, the name input, and a pencil hint so it reads
 * unmistakably as a text field.
 */
export default function PlayerNames({ p1Name, p2Name, setP1Name, setP2Name, style }: Props) {
  const { t } = useLanguageStore();
  const { C } = useTheme();

  const Field = ({
    color,
    label,
    value,
    onChange,
    last,
    returnKeyType,
  }: {
    color: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    last?: boolean;
    returnKeyType: 'next' | 'done';
  }) => (
    <View
      style={[
        styles.field,
        { borderColor: color, backgroundColor: C.surface },
        !last && styles.fieldGap,
      ]}
    >
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      <TextInput
        style={[styles.input, { color: C.text }]}
        placeholder={t.enterName}
        placeholderTextColor={C.textMuted}
        value={value}
        onChangeText={onChange}
        maxLength={16}
        returnKeyType={returnKeyType}
      />
      <Text style={[styles.pencil, { color: C.textMuted }]}>✏️</Text>
    </View>
  );

  return (
    <View style={[styles.wrap, style]}>
      <Field
        color={C.p2Primary}
        label={t.posTop}
        value={p2Name}
        onChange={setP2Name}
        returnKeyType="next"
      />
      <Field
        color={C.p1Primary}
        label={t.posBottom}
        value={p1Name}
        onChange={setP1Name}
        last
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 22 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  fieldGap: { marginBottom: 12 },
  badge: {
    width: 62,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  input: { flex: 1, fontSize: 16, fontWeight: '700', paddingVertical: 0 },
  pencil: { fontSize: 13, opacity: 0.7 },
});
