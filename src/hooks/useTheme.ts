import { useThemeStore } from '../store/themeStore';
import {
  DARK_COLORS, LIGHT_COLORS,
  DARK_GRADIENTS, LIGHT_GRADIENTS,
  ThemeColors, ThemeGradients,
} from '../constants/theme';

export interface Theme {
  isDark: boolean;
  C: ThemeColors;
  G: ThemeGradients;
  toggle: () => void;
}

export function useTheme(): Theme {
  const { isDark, toggle } = useThemeStore();
  return {
    isDark,
    C: isDark ? DARK_COLORS : LIGHT_COLORS,
    G: isDark ? DARK_GRADIENTS : LIGHT_GRADIENTS,
    toggle,
  };
}
