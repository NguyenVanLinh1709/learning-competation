const BASE_WIDTH = 375; // iPhone SE / standard design baseline
const SCALE_CAP = 680;  // stop scaling up past this width to avoid over-inflation

export interface Responsive {
  /** Linear scale capped at SCALE_CAP */
  scale: (n: number) => number;
  /** Moderate scale — softer for fonts (factor 0 = no scaling, 1 = full linear) */
  mscale: (n: number, factor?: number) => number;
  isTablet: boolean;
  isLargeTablet: boolean;
  /** Recommended horizontal padding for the screen */
  hPad: number;
  /** Width of usable content area (after padding, capped at 680) */
  contentWidth: number;
}

export function makeResponsive(screenWidth: number): Responsive {
  const capped = Math.min(screenWidth, SCALE_CAP);
  const ratio = capped / BASE_WIDTH;

  const scale = (n: number): number => Math.round(ratio * n);
  const mscale = (n: number, factor = 0.45): number =>
    Math.round(n + (scale(n) - n) * factor);

  const isTablet = screenWidth >= 600;
  const isLargeTablet = screenWidth >= 900;

  const hPad = Math.min(Math.round(screenWidth * 0.055), 40);
  const contentWidth = Math.min(screenWidth - hPad * 2, SCALE_CAP);

  return { scale, mscale, isTablet, isLargeTablet, hPad, contentWidth };
}
