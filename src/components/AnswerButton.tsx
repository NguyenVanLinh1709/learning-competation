import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { AnswerButtonState } from '../types';

interface Props {
  choice: string;
  prefix: string;
  state: AnswerButtonState;
  accentColor: string;
  onPress: () => void;
}

export function AnswerButton({ choice, prefix, state, accentColor, onPress }: Props) {
  const { C } = useTheme();

  const shakeX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'wrong') {
      Animated.sequence([
        Animated.timing(shakeX, { toValue: 9,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -9, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 7,  duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -7, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: 0,  duration: 55, useNativeDriver: true }),
      ]).start();
    }
    if (state === 'correct') {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.08, friction: 4, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1,    friction: 6, useNativeDriver: true }),
      ]).start();
    }
    Animated.timing(opacity, {
      toValue: state === 'disabled' ? 0.35 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [state]);

  const containerBg =
    state === 'correct'  ? C.correctBg
    : state === 'wrong'  ? C.wrongBg
    : state === 'disabled' ? C.disabledBg
    : C.idleBg;

  const containerBorder =
    state === 'correct'  ? C.correctBorder
    : state === 'wrong'  ? C.wrongBorder
    : state === 'disabled' ? 'transparent'
    : C.idleBorder;

  const prefixBg =
    state === 'correct'  ? '#16A34A'
    : state === 'wrong'  ? '#DC2626'
    : state === 'disabled' ? C.surface
    : accentColor;

  // On colored (correct/wrong) backgrounds white text is always readable.
  // On idle/disabled, use the theme text color.
  const textColor =
    state === 'correct' || state === 'wrong' ? '#FFFFFF'
    : state === 'disabled' ? C.disabledText
    : C.idleText;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateX: shakeX }, { scale }], opacity },
      ]}
    >
      <TouchableOpacity
        style={[styles.button, { backgroundColor: containerBg, borderColor: containerBorder }]}
        onPress={state === 'idle' ? onPress : undefined}
        disabled={state !== 'idle'}
        activeOpacity={0.75}
      >
        <View style={[styles.prefixBadge, { backgroundColor: prefixBg }]}>
          <Text style={styles.prefixText}>{prefix}</Text>
        </View>
        <Text style={[styles.choiceText, { color: textColor }]} numberOfLines={1}>
          {choice}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '48%', marginBottom: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 8,
    minHeight: 52,
  },
  prefixBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  prefixText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  choiceText: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
});
