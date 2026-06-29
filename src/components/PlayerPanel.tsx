import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AnswerButton } from './AnswerButton';
import { useTheme } from '../hooks/useTheme';
import { useLanguageStore } from '../store/languageStore';
import { questionPrompt } from '../utils/questionGenerator';
import type { AnswerButtonState, GamePhase, PlayerState, Question } from '../types';

interface Props {
  player: PlayerState;
  question: Question;
  isRotated: boolean;
  onAnswer: (index: number) => void;
  phase: GamePhase;
}

const PREFIXES = ['A', 'B', 'C', 'D'];

function getButtonState(
  player: PlayerState,
  question: Question,
  index: number,
  phase: GamePhase,
): AnswerButtonState {
  if (phase === 'resolved' || phase === 'finished') {
    if (index === question.correctIndex) return 'correct';
    if (index === player.selectedIndex) return 'wrong';
    return 'disabled';
  }
  if (!player.hasAnswered) return 'idle';
  if (index === player.selectedIndex) return player.lastAnswerCorrect ? 'correct' : 'wrong';
  return 'disabled';
}

export function PlayerPanel({ player, question, isRotated, onAnswer, phase }: Props) {
  const { C } = useTheme();
  const { t } = useLanguageStore();
  const isP1 = player.position === 'bottom';
  const accent = isP1 ? C.p1Primary : C.p2Primary;
  const panelBg = isP1 ? C.p1PanelBg : C.p2PanelBg;

  const scoreAnim = useRef(new Animated.Value(0)).current;
  const prevScore = useRef(player.score);

  useEffect(() => {
    if (player.score > prevScore.current) {
      prevScore.current = player.score;
      scoreAnim.setValue(1);
      Animated.timing(scoreAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }
  }, [player.score]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: panelBg },
        isRotated && styles.rotated,
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.nameBadge, { backgroundColor: accent }]}>
          <Text style={styles.nameText} numberOfLines={1}>{player.name}</Text>
        </View>

        <View style={styles.scoreRow}>
          <Animated.Text
            style={[
              styles.plusOne,
              {
                color: C.timerGreen,
                opacity: scoreAnim,
                transform: [{
                  translateY: scoreAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0],
                  }),
                }],
              },
            ]}
          >
            +1
          </Animated.Text>
          <Text style={styles.scoreEmoji}>⭐</Text>
          <Text style={[styles.scoreText, { color: C.text }]}>{player.score}</Text>
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        {question.operation === 'count' && question.countIcons ? (
          <View style={styles.iconsWrap}>
            {question.countIcons.map((icon, i) => (
              <Text key={i} style={styles.countIcon}>{icon}</Text>
            ))}
          </View>
        ) : (
          <Text style={[styles.questionText, { color: C.text }]} adjustsFontSizeToFit numberOfLines={2}>
            {questionPrompt(question.text, t)}
          </Text>
        )}
      </View>

      {/* Answers */}
      <View style={styles.answersGrid}>
        {question.choices.map((choice, i) => (
          <AnswerButton
            key={`${question.id}-${i}`}
            choice={choice}
            prefix={PREFIXES[i]}
            state={getButtonState(player, question, i, phase)}
            accentColor={accent}
            onPress={() => onAnswer(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, paddingTop: 10 },
  rotated: { transform: [{ rotate: '180deg' }] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nameBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: '60%',
  },
  nameText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'relative' },
  plusOne: {
    position: 'absolute',
    right: 0,
    top: -22,
    fontSize: 15,
    fontWeight: '900',
  },
  scoreEmoji: { fontSize: 18 },
  scoreText: { fontSize: 22, fontWeight: '900', minWidth: 28, textAlign: 'right' },
  questionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  questionText: { fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  iconsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2 },
  countIcon: { fontSize: 22 },
  answersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    flex: 1,
    alignContent: 'center',
  },
});
