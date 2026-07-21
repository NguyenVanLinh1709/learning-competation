import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  remainingMs: number;
  totalMs: number;
  questionNumber: number;
  totalQuestions: number;
}

export function TimerBar({ remainingMs, totalMs, questionNumber, totalQuestions }: Props) {
  const { C } = useTheme();
  const isUnlimited = totalMs <= 0;
  const progress = isUnlimited ? 1 : Math.max(0, remainingMs / totalMs);
  const seconds = Math.ceil(remainingMs / 1000);
  const widthAnim = useRef(new Animated.Value(progress)).current;

  const timerColor =
    isUnlimited ? C.timerGreen
    : progress > 0.5 ? C.timerGreen
    : progress > 0.25 ? C.timerYellow
    : C.timerRed;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 80,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      <Text style={[styles.counter, { color: C.textMuted }]}>
        {questionNumber} / {totalQuestions}
      </Text>

      <View style={[styles.barTrack, { backgroundColor: C.surface }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: timerColor,
              width: widthAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      <Text style={[styles.seconds, { color: timerColor }]}>{isUnlimited ? '∞' : `${seconds}s`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
  },
  counter: { fontSize: 11, fontWeight: '700', letterSpacing: 1, minWidth: 40 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  seconds: { fontSize: 13, fontWeight: '800', minWidth: 28, textAlign: 'right' },
});
