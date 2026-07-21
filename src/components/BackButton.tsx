import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * The single, shared back button used across every screen.
 * Boxed "‹ Back" text (localized via t.back) on a surface background with border.
 */
export default function BackButton({ onPress, style }: Props) {
  const { t } = useLanguageStore();
  const { C } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.backBtn, { backgroundColor: C.surface, borderColor: C.border }, style]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <Text style={[styles.backText, { color: C.text }]}>{t.back}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  backText: { fontSize: 14, fontWeight: '600' },
});
