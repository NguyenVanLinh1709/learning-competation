import { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTourStore } from '../store/tourStore';

// Attach { ref, onLayout } directly to a control so TourOverlay can spotlight it.
// onLayout defers measurement a frame so the layout pass has settled before we
// read window coordinates (measureInWindow right inside onLayout can be stale).
export function useTourTarget(fullId: string) {
  const ref = useRef<View>(null);
  const registerTarget = useTourStore((s) => s.registerTarget);
  const activeTour = useTourStore((s) => s.activeTour);
  // On Android (edge-to-edge), measureInWindow reports y excluding the status
  // bar, but TourOverlay spotlights against full-screen (status-bar-inclusive)
  // coordinates — every measured rect lands `insets.top` too high unless we
  // add it back here. iOS's measureInWindow already includes it.
  const insets = useSafeAreaInsets();

  const measure = useCallback(() => {
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((x, y, width, height) => {
        if (width === 0 && height === 0) return;
        const adjustedY = Platform.OS === 'android' ? y + insets.top : y;
        registerTarget(fullId, { x, y: adjustedY, width, height });
      });
    });
  }, [fullId, registerTarget, insets.top]);

  // Defensive re-sync: re-measure every mounted target whenever a tour
  // actually opens, in case anything shifted layout since the mount-time
  // onLayout fired (e.g. async content above the target changing height).
  useEffect(() => {
    if (!activeTour) return;
    measure();
  }, [activeTour, measure]);

  return { ref, onLayout: measure };
}
