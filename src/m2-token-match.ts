import type { RgbaColor } from "./color";
import { blendColors } from "./color";
import { contrastRatio, isLargeText } from "./contrast";
import {
  getM2TokensForRole,
  M2_TYPOGRAPHY_TOKENS,
  type M2ColorRole,
  type M2ColorToken,
  type M2TypographyToken,
} from "./m2-uikit-tokens";

const WHITE: RgbaColor = { r: 1, g: 1, b: 1, a: 1 };

function colorDistance(a: RgbaColor, b: RgbaColor): number {
  const ar = Math.round(a.r * 255);
  const ag = Math.round(a.g * 255);
  const ab = Math.round(a.b * 255);
  const br = Math.round(b.r * 255);
  const bg = Math.round(b.g * 255);
  const bb = Math.round(b.b * 255);
  return (ar - br) ** 2 + (ag - bg) ** 2 + (ab - bb) ** 2;
}

/** Opaque color for contrast checks; semi-transparent tokens are composited on white. */
export function resolveTokenColor(token: M2ColorToken): RgbaColor {
  if (token.color.a >= 1) return token.color;
  return blendColors(token.color, WHITE);
}

export function nearestM2Token(color: RgbaColor, role: M2ColorRole): M2ColorToken {
  const tokens = getM2TokensForRole(role);
  let best = tokens[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const token of tokens) {
    const distance = colorDistance(color, resolveTokenColor(token));
    if (distance < bestDistance) {
      best = token;
      bestDistance = distance;
    }
  }

  return best;
}

export function tokenDisplayName(name: string): string {
  return name;
}

function findPassingToken(
  tokens: M2ColorToken[],
  foreground: RgbaColor,
  background: RgbaColor,
  required: number,
  mode: "text" | "background"
): M2ColorToken | null {
  const current =
    mode === "text"
      ? nearestM2Token(foreground, "text")
      : nearestM2Token(background, "background");

  const ranked = [...tokens]
    .filter((token) => token.name !== current.name)
    .sort((a, b) => {
      const base = mode === "text" ? foreground : background;
      return colorDistance(resolveTokenColor(a), base) - colorDistance(resolveTokenColor(b), base);
    });

  for (const token of ranked) {
    const candidateFg = mode === "text" ? resolveTokenColor(token) : foreground;
    const candidateBg = mode === "background" ? resolveTokenColor(token) : background;
    if (contrastRatio(candidateFg, candidateBg) >= required) {
      return token;
    }
  }

  return null;
}

export function suggestM2TextToken(
  foreground: RgbaColor,
  background: RgbaColor,
  required: number
): { from: string; to: string } | null {
  const from = nearestM2Token(foreground, "text").name;
  const match = findPassingToken(getM2TokensForRole("text"), foreground, background, required, "text");
  if (!match || match.name === from) return null;
  return { from, to: match.name };
}

export function suggestM2BackgroundToken(
  foreground: RgbaColor,
  background: RgbaColor,
  required: number
): { from: string; to: string } | null {
  const from = nearestM2Token(background, "background").name;
  const match = findPassingToken(
    getM2TokensForRole("background"),
    foreground,
    background,
    required,
    "background"
  );
  if (!match || match.name === from) return null;
  return { from, to: match.name };
}

export function buildM2ColorFixAction(
  foreground: RgbaColor,
  background: RgbaColor,
  requiredAa: number
): string | null {
  const textFix = suggestM2TextToken(foreground, background, requiredAa);
  if (!textFix) return null;
  return `Замени текст: ${textFix.from} → ${textFix.to}.`;
}

export function nearestM2Typography(fontSize: number, fontWeight: number): M2TypographyToken {
  let best = M2_TYPOGRAPHY_TOKENS[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const token of M2_TYPOGRAPHY_TOKENS) {
    const score = Math.abs(token.fontSize - fontSize) * 10 + Math.abs(token.fontWeight - fontWeight);
    if (score < bestScore) {
      best = token;
      bestScore = score;
    }
  }

  return best;
}

export function suggestM2LargeTypography(
  fontSize: number,
  fontWeight: number
): string | null {
  const passing = M2_TYPOGRAPHY_TOKENS.filter((token) => isLargeText(token.fontSize, token.fontWeight))
    .sort((a, b) => a.fontSize - b.fontSize);

  const current = nearestM2Typography(fontSize, fontWeight);
  const target = passing.find(
    (token) =>
      token.fontSize > fontSize ||
      (token.fontSize >= fontSize && token.fontWeight > fontWeight && token.fontWeight >= 700)
  );

  if (!target || target.name === current.name) return null;

  if (target.fontWeight >= 700 && fontWeight < 700) {
    return `увеличь стиль до ${target.name} + bold`;
  }

  return `увеличь стиль до ${target.name}`;
}
