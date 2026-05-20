export interface ThemeColors {
  // Panel backgrounds
  screenBg: string;
  p1PanelBg: string;
  p2PanelBg: string;

  // Player accents (same in both themes)
  p1Primary: string;
  p2Primary: string;

  // Surfaces / borders
  surface: string;
  border: string;
  divider: string;

  // Text
  text: string;
  textMuted: string;

  // Answer button states
  correctBg: string;
  correctBorder: string;
  wrongBg: string;
  wrongBorder: string;
  idleBg: string;
  idleBorder: string;
  idleText: string;       // adapts because idle bg flips between dark/white
  disabledBg: string;
  disabledText: string;

  // Timer bar
  timerGreen: string;
  timerYellow: string;
  timerRed: string;
}

export interface ThemeGradients {
  home: readonly [string, string, string];
  p1Button: readonly [string, string];
  p2Button: readonly [string, string];
}

export const DARK_COLORS: ThemeColors = {
  screenBg: '#0A0A1A',
  p1PanelBg: '#0A0A2E',
  p2PanelBg: '#2A0A1E',

  p1Primary: '#4361EE',
  p2Primary: '#F72585',

  surface: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.12)',
  divider: 'rgba(255,255,255,0.08)',

  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',

  correctBg: 'rgba(22,163,74,0.25)',
  correctBorder: '#22C55E',
  wrongBg: 'rgba(220,38,38,0.25)',
  wrongBorder: '#EF4444',
  idleBg: 'rgba(255,255,255,0.08)',
  idleBorder: 'rgba(255,255,255,0.18)',
  idleText: '#FFFFFF',
  disabledBg: 'rgba(255,255,255,0.03)',
  disabledText: 'rgba(255,255,255,0.22)',

  timerGreen: '#22C55E',
  timerYellow: '#FBBF24',
  timerRed: '#EF4444',
};

export const LIGHT_COLORS: ThemeColors = {
  screenBg: '#F4F6FF',
  p1PanelBg: '#EEF2FF',
  p2PanelBg: '#FFF0F5',

  p1Primary: '#4361EE',
  p2Primary: '#E11D74',

  surface: 'rgba(30,27,75,0.05)',
  border: 'rgba(30,27,75,0.1)',
  divider: 'rgba(30,27,75,0.08)',

  text: '#1E1B4B',
  textMuted: 'rgba(30,27,75,0.45)',

  correctBg: 'rgba(22,163,74,0.12)',
  correctBorder: '#16A34A',
  wrongBg: 'rgba(220,38,38,0.1)',
  wrongBorder: '#DC2626',
  idleBg: '#FFFFFF',
  idleBorder: 'rgba(30,27,75,0.15)',
  idleText: '#1E1B4B',
  disabledBg: 'rgba(30,27,75,0.04)',
  disabledText: 'rgba(30,27,75,0.25)',

  timerGreen: '#16A34A',
  timerYellow: '#D97706',
  timerRed: '#DC2626',
};

export const DARK_GRADIENTS: ThemeGradients = {
  home: ['#0A0A2E', '#1A0838', '#0A1A2E'],
  p1Button: ['#4361EE', '#3A0CA3'],
  p2Button: ['#F72585', '#B5179E'],
};

export const LIGHT_GRADIENTS: ThemeGradients = {
  home: ['#EEF2FF', '#FAF5FF', '#EFF6FF'],
  p1Button: ['#4361EE', '#3A0CA3'],
  p2Button: ['#F72585', '#B5179E'],
};

export const SIZES = {
  borderRadius: 16,
  buttonRadius: 14,
  padding: 14,
  centerBarHeight: 52,
};
