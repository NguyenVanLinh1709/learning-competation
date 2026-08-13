import React, { useEffect } from 'react';
import {
  BackHandler, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity,
  TouchableWithoutFeedback, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTourStore } from '../store/tourStore';
import { STEP_LIBRARY } from '../content/tourStepLibrary';
import { useLanguageStore } from '../store/languageStore';
import { useTheme } from '../hooks/useTheme';

type Props = {
  scrollViewRef?: React.RefObject<ScrollView | null>;
  scrollYRef?: React.MutableRefObject<number>;
};

const SCRIM_COLOR = 'rgba(0,0,0,0.72)'; // deliberately darker than the 0.55 overlay used elsewhere, for spotlight contrast
const HOLE_PAD = 8;
const MISSING_TARGET_TIMEOUT_MS = 1000;
const TOOLTIP_WIDTH_MAX = 340;
const TOOLTIP_MARGIN = 16;

export default function TourOverlay({ scrollViewRef, scrollYRef }: Props) {
  const {
    activeTour, steps, stepIndex, targets, next, prev, skip,
  } = useTourStore();
  const { t } = useLanguageStore();
  const { C, isDark } = useTheme();

  const stepKey = activeTour && steps.length > 0 ? steps[stepIndex] : undefined;
  const entry = stepKey ? STEP_LIBRARY[stepKey] : undefined;
  const targetKey = entry?.targetKey ?? stepKey;
  const fullId = activeTour && targetKey ? `${activeTour}:${targetKey}` : undefined;
  const rect = fullId ? targets[fullId] : undefined;

  useEffect(() => {
    if (!activeTour) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      skip();
      return true;
    });
    return () => sub.remove();
  }, [activeTour, skip]);

  // The target might never register a rect (stale/mistyped id, control unmounted
  // by a mode switch) — bail forward after a beat so the tour can't hang forever.
  useEffect(() => {
    if (!activeTour || rect) return;
    const timer = setTimeout(() => next(), MISSING_TARGET_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [activeTour, stepIndex, rect, next]);

  // Bring the target into a safe viewing band whenever the step changes, since
  // measureInWindow can report a rect that's currently scrolled off-screen.
  // We only *request* the scroll here — we don't know where it will actually
  // land (RN clamps scrollTo to the real scrollable extent), so we don't touch
  // scrollYRef or the cached target rects. The screen's onScroll handler shifts
  // every cached rect by the real, observed delta as the scroll actually happens.
  useEffect(() => {
    if (!activeTour || !rect || !scrollViewRef?.current) return;
    const { height: winH } = Dimensions.get('window');
    const safeTop = 110;
    const safeBottom = winH - 260;
    let delta = 0;
    if (rect.y < safeTop) delta = rect.y - safeTop;
    else if (rect.y + rect.height > safeBottom) delta = (rect.y + rect.height) - safeBottom;
    if (Math.abs(delta) < 4) return;

    const nextY = Math.max(0, (scrollYRef?.current ?? 0) + delta);
    scrollViewRef.current.scrollTo({ y: nextY, animated: true });
    // Only re-run when the tour advances to a different step, not on every rect update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTour, stepIndex]);

  if (!activeTour || !stepKey) return null;

  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const handleNext = () => { tap(); next(); };
  const handlePrev = () => { tap(); prev(); };
  const handleSkip = () => { tap(); skip(); };

  const { width: winW, height: winH } = Dimensions.get('window');
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const cardBg = isDark ? '#1E1E2E' : '#FFFFFF';
  const translations = t as unknown as Record<string, string>;
  const title = entry ? translations[entry.titleKey] : '';
  const body = entry ? translations[entry.bodyKey] : '';

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="box-none">
      {rect ? (
        <SpotlightHole rect={rect} onScrimPress={handleSkip} borderColor={C.p1Primary} />
      ) : (
        <TouchableWithoutFeedback onPress={handleSkip}>
          <View style={styles.scrim} />
        </TouchableWithoutFeedback>
      )}

      {rect && (
        <Tooltip
          rect={rect}
          winW={winW}
          winH={winH}
          cardBg={cardBg}
          borderColor={C.border}
          textColor={C.text}
          mutedColor={C.textMuted}
          accentColor={C.p1Primary}
          title={title}
          body={body}
          stepIndex={stepIndex}
          totalSteps={steps.length}
          isFirst={isFirst}
          isLast={isLast}
          navLabels={{ back: t.tourBack, skip: t.tourSkip, next: t.tourNext, gotIt: t.tourGotIt }}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onNext={handleNext}
        />
      )}
    </View>
  );
}

function SpotlightHole({
  rect, onScrimPress, borderColor,
}: {
  rect: { x: number; y: number; width: number; height: number };
  onScrimPress: () => void;
  borderColor: string;
}) {
  const top = Math.max(0, rect.y - HOLE_PAD);
  const bottom = rect.y + rect.height + HOLE_PAD;
  const left = Math.max(0, rect.x - HOLE_PAD);
  const right = rect.x + rect.width + HOLE_PAD;
  const midHeight = Math.max(0, bottom - top);

  return (
    <>
      <TouchableWithoutFeedback onPress={onScrimPress}>
        <View style={[styles.scrim, { top: 0, left: 0, right: 0, height: top }]} />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={onScrimPress}>
        <View style={[styles.scrim, { top: bottom, left: 0, right: 0, bottom: 0 }]} />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={onScrimPress}>
        <View style={[styles.scrim, { top, left: 0, width: left, height: midHeight }]} />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback onPress={onScrimPress}>
        <View style={[styles.scrim, { top, left: right, right: 0, height: midHeight }]} />
      </TouchableWithoutFeedback>
      <View
        pointerEvents="none"
        style={[styles.spotlightBorder, {
          top, left, width: Math.max(0, right - left), height: midHeight, borderColor,
        }]}
      />
    </>
  );
}

function Tooltip({
  rect, winW, winH, cardBg, borderColor, textColor, mutedColor, accentColor,
  title, body, stepIndex, totalSteps, isFirst, isLast, navLabels, onPrev, onSkip, onNext,
}: {
  rect: { x: number; y: number; width: number; height: number };
  winW: number; winH: number;
  cardBg: string; borderColor: string; textColor: string; mutedColor: string; accentColor: string;
  title: string; body: string;
  stepIndex: number; totalSteps: number; isFirst: boolean; isLast: boolean;
  navLabels: { back: string; skip: string; next: string; gotIt: string };
  onPrev: () => void; onSkip: () => void; onNext: () => void;
}) {
  const width = Math.min(TOOLTIP_WIDTH_MAX, winW - TOOLTIP_MARGIN * 2);
  const left = Math.min(
    Math.max(TOOLTIP_MARGIN, rect.x + rect.width / 2 - width / 2),
    winW - width - TOOLTIP_MARGIN,
  );
  const spaceBelow = winH - (rect.y + rect.height + HOLE_PAD);
  const spaceAbove = rect.y - HOLE_PAD;
  const placeBelow = spaceBelow >= 180 || spaceBelow >= spaceAbove;

  const posStyle = placeBelow
    ? { top: rect.y + rect.height + HOLE_PAD + 12 }
    : { bottom: winH - (rect.y - HOLE_PAD) + 12 };

  return (
    <View
      style={[
        styles.tooltip,
        { width, left, backgroundColor: cardBg, borderColor },
        posStyle,
      ]}
    >
      <Text style={[styles.tooltipTitle, { color: textColor }]}>{title}</Text>
      <Text style={[styles.tooltipBody, { color: mutedColor }]}>{body}</Text>

      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              { backgroundColor: i === stepIndex ? accentColor : borderColor },
            ]}
          />
        ))}
      </View>

      <View style={styles.actionsRow}>
        {!isFirst ? (
          <TouchableOpacity onPress={onPrev} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionText, { color: mutedColor }]}>{navLabels.back}</Text>
          </TouchableOpacity>
        ) : <View />}

        <View style={styles.actionsRight}>
          <TouchableOpacity
            onPress={onSkip}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.skipBtn}
          >
            <Text style={[styles.actionText, { color: mutedColor }]}>{navLabels.skip}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onNext}
            style={[styles.nextBtn, { backgroundColor: accentColor }]}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>{isLast ? navLabels.gotIt : navLabels.next}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 9999, elevation: 9999 },
  scrim: { position: 'absolute', backgroundColor: SCRIM_COLOR },
  spotlightBorder: {
    position: 'absolute',
    borderWidth: 2.5,
    borderRadius: 16,
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  tooltipTitle: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
  tooltipBody: { fontSize: 13, lineHeight: 20 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 16, marginBottom: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  actionsRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12,
  },
  actionsRight: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  actionText: { fontSize: 14, fontWeight: '700' },
  skipBtn: {},
  nextBtn: { borderRadius: 12, paddingVertical: 9, paddingHorizontal: 18 },
  nextText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
