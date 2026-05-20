import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGameStore } from '../store/gameStore';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';
import type { RootStackParamList } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Countdown'> };

const STEPS = ['3', '2', '1', 'GO!'];
const STEP_MS = 900;

export default function CountdownScreen({ navigation }: Props) {
  const { config, initGame } = useGameStore();
  const { t } = useLanguageStore();
  const { C, G } = useTheme();

  const [stepIndex, setStepIndex] = useState(0);
  const scale = useRef(new Animated.Value(0.3)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const animate = () => {
    scale.setValue(0.3);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    animate();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, [stepIndex]);

  useEffect(() => {
    let current = 0;
    const tick = () => {
      current++;
      if (current < STEPS.length) {
        setStepIndex(current);
        setTimeout(tick, STEP_MS);
      } else {
        initGame();
        setTimeout(() => navigation.replace('Game'), 500);
      }
    };
    const id = setTimeout(tick, STEP_MS);
    return () => clearTimeout(id);
  }, []);

  const isGo = stepIndex === STEPS.length - 1;

  return (
    <LinearGradient colors={G.home} style={styles.container}>
      <Text style={[styles.versus, { color: C.textMuted }]}>
        {config ? `${config.player1Name}  ⚔️  ${config.player2Name}` : '⚔️'}
      </Text>

      <Animated.Text
        style={[
          styles.countText,
          isGo && styles.goText,
          { color: isGo ? C.timerGreen : C.text, transform: [{ scale }], opacity },
        ]}
      >
        {STEPS[stepIndex]}
      </Animated.Text>

      <Text style={[styles.hint, { color: C.textMuted }]}>{t.getReady}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  versus: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    position: 'absolute',
    top: 80,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  countText: {
    fontSize: 130,
    fontWeight: '900',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
    textShadowColor: 'rgba(67,97,238,0.4)',
  },
  goText: { fontSize: 90 },
  hint: { fontSize: 14, letterSpacing: 2, position: 'absolute', bottom: 80 },
});
