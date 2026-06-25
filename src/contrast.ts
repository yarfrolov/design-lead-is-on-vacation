import type { RgbaColor } from "./color";

function linearize(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color: RgbaColor): number {
  const r = linearize(color.r);
  const g = linearize(color.g);
  const b = linearize(color.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio; do not round when comparing to thresholds. */
export function contrastRatio(foreground: RgbaColor, background: RgbaColor): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/** 18pt ≈ 24px, 14pt ≈ 18.5px (WCAG 2.1, CSS 1pt = 1.333px). */
export const LARGE_TEXT_MIN_PX = 24;
export const LARGE_BOLD_MIN_PX = 18.5;
export const BOLD_WEIGHT_THRESHOLD = 700;

export function isLargeText(fontSize: number, fontWeight: number): boolean {
  if (fontSize >= LARGE_TEXT_MIN_PX) {
    return true;
  }
  return fontSize >= LARGE_BOLD_MIN_PX && fontWeight >= BOLD_WEIGHT_THRESHOLD;
}

export type WcagLevel = "AA" | "AAA";

export function requiredRatio(level: WcagLevel, largeText: boolean): number {
  if (level === "AAA") {
    return largeText ? 4.5 : 7;
  }
  return largeText ? 3 : 4.5;
}

export function passesContrast(ratio: number, level: WcagLevel, largeText: boolean): boolean {
  return ratio >= requiredRatio(level, largeText);
}
