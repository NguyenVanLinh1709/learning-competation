import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { VocabAnswerButton } from './VocabAnswerButton';
import { useTheme } from '../hooks/useTheme';
import type { AnswerButtonState, GamePhase, PlayerState, VocabQuestion } from '../types';

interface Props {
  player: PlayerState;
  question: VocabQuestion;
  isRotated: boolean;
  onAnswer: (index: number) => void;
  phase: GamePhase;
}

const PREFIXES = ['A', 'B', 'C', 'D'];

const DIR_LABEL: Record<string, string> = {
  en_to_vi: 'EN → VI',
  vi_to_en: 'VI → EN',
};

function getButtonState(
  player: PlayerState,
  question: VocabQuestion,
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

export function VocabPlayerPanel({ player, question, isRotated, onAnswer, phase }: Props) {
  const { C } = useTheme();
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
    <View style={[styles.container, { backgroundColor: panelBg }, isRotated && styles.rotated]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.nameBadge, { backgroundColor: accent }]}>
          <Text style={styles.nameText} numberOfLines={1}>{player.name}</Text>
        </View>

        <View style={styles.scoreRow}>
          <Animated.Text
            style={[styles.plusOne, {
              color: C.timerGreen, opacity: scoreAnim,
              transform: [{ translateY: scoreAnim.interpolate({ inputRange: [0, 1], outputRange: [-22, 0] }) }],
            }]}
          >
            +1
          </Animated.Text>
          <Text style={styles.scoreEmoji}>⭐</Text>
          <Text style={[styles.scoreText, { color: C.text }]}>{player.score}</Text>
        </View>
      </View>

      {/* Direction badge */}
      <View style={styles.dirRow}>
        <View style={[styles.dirBadge, { borderColor: accent }]}>
          <Text style={[styles.dirText, { color: accent }]}>{DIR_LABEL[question.direction]}</Text>
        </View>
      </View>

      {/* Question: emoji + word */}
      <View style={styles.questionContainer}>
        {question.emoji ? (
          <>
            <View style={[styles.emojiCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={styles.emojiText}>{question.emoji}</Text>
            </View>
            <Text style={[styles.questionText, { color: C.text }]} adjustsFontSizeToFit numberOfLines={2}>
              {question.text}
            </Text>
          </>
        ) : (
          <Text style={[styles.questionTextLarge, { color: C.text }]} adjustsFontSizeToFit numberOfLines={2}>
            {question.text}
          </Text>
        )}
      </View>

      {/* Answer buttons */}
      <View style={styles.answersGrid}>
        {question.choices.map((choice, i) => (
          <VocabAnswerButton
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
  container: { flex: 1, padding: 12, paddingTop: 8 },
  rotated: { transform: [{ rotate: '180deg' }] },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  nameBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, maxWidth: '60%' },
  nameText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, position: 'relative' },
  plusOne: { position: 'absolute', right: 0, top: -20, fontSize: 14, fontWeight: '900' },
  scoreEmoji: { fontSize: 18 },
  scoreText: { fontSize: 22, fontWeight: '900', minWidth: 28, textAlign: 'right' },
  dirRow: { alignItems: 'flex-start', marginBottom: 4 },
  dirBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1.5,
  },
  dirText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  questionContainer: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, marginBottom: 4, gap: 6,
  },
  emojiCard: {
    width: 70, height: 70, borderRadius: 20,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  emojiText: { fontSize: 40, lineHeight: 50 },
  questionText: { fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.3 },
  questionTextLarge: { fontSize: 32, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  answersGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', flex: 1, alignContent: 'center',
  },
});
