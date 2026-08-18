import React from 'react';

type Props = {
  onPress: () => void;
};

// Tour guide feature temporarily disabled — not ready to release yet.
// Renders nothing so the 🧭 button disappears from every screen's header in
// one place. Uncomment the block below (and tourStore.ts's real startTour)
// to bring the whole tour-guide feature back.
export default function TourButton(_props: Props) {
  return null;
}

/*
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

export default function TourButton({ onPress }: Props) {
  const { C } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: C.surface, borderColor: C.border }]}
      onPress={handlePress}
      activeOpacity={0.75}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.icon}>🧭</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 15 },
});
*/
