import type { RgbaColor } from "./color";

export type M2ColorRole = "text" | "background";

export type M2ColorToken = {
  name: string;
  role: M2ColorRole;
  color: RgbaColor;
};

export type M2TypographyToken = {
  name: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
};

function hsl(h: number, s: number, l: number, a = 1): RgbaColor {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  return { r: r + m, g: g + m, b: b + m, a };
}

/** Semantic text colors — colors-named (M2 UI Kit). */
export const M2_TEXT_TOKENS: M2ColorToken[] = [
  { name: "primary", role: "text", color: hsl(251, 20, 15) },
  { name: "secondary", role: "text", color: hsl(251, 17, 32, 0.8) },
  { name: "minor", role: "text", color: hsl(251, 14, 45, 0.6) },
  { name: "link", role: "text", color: hsl(251, 78, 40) },
  { name: "link-hover", role: "text", color: hsl(15, 100, 65) },
  { name: "link-visited", role: "text", color: hsl(251, 78, 30) },
  { name: "link-minor", role: "text", color: hsl(251, 77, 61) },
  { name: "link-minor-hover", role: "text", color: hsl(15, 100, 77) },
  { name: "link-minor-visited", role: "text", color: hsl(251, 77, 61) },
  { name: "link-secondary-visited", role: "text", color: hsl(251, 10, 46) },
  { name: "primary-alt-bg", role: "text", color: hsl(0, 0, 100) },
  { name: "secondary-alt-bg", role: "text", color: hsl(0, 0, 100, 0.64) },
  { name: "minor-alt-bg", role: "text", color: hsl(0, 0, 100, 0.32) },
  { name: "link-alt-bg", role: "text", color: hsl(15, 100, 65) },
  { name: "link-alt-bg-hover", role: "text", color: hsl(5, 90, 58) },
  { name: "link-alt-bg-visited", role: "text", color: hsl(15, 100, 65) },
  { name: "link-minor-alt-bg", role: "text", color: hsl(15, 100, 77) },
  { name: "link-minor-alt-bg-hover", role: "text", color: hsl(15, 100, 65) },
  { name: "link-minor-alt-bg-visited", role: "text", color: hsl(15, 100, 77) },
  { name: "disabled", role: "text", color: hsl(251, 17, 75) },
  { name: "disabled-transparent", role: "text", color: hsl(251, 14, 45, 0.6) },
  { name: "disabled-transparent-alt-bg", role: "text", color: hsl(0, 0, 100, 0.32) },
];

/** Semantic backgrounds — button variants and palette swatches. */
export const M2_BACKGROUND_TOKENS: M2ColorToken[] = [
  { name: "primary", role: "background", color: hsl(251, 78, 40) },
  { name: "primary:hover", role: "background", color: hsl(251, 78, 30) },
  { name: "primary:active", role: "background", color: hsl(251, 78, 21) },
  { name: "primary-alt-bg", role: "background", color: hsl(0, 0, 100) },
  { name: "primary-alt-bg:hover", role: "background", color: hsl(251, 33, 96) },
  { name: "primary-alt-bg:active", role: "background", color: hsl(251, 26, 93) },
  { name: "secondary-solid", role: "background", color: hsl(251, 26, 93) },
  { name: "secondary-solid:hover", role: "background", color: hsl(251, 17, 82) },
  { name: "secondary-solid:active", role: "background", color: hsl(251, 12, 67) },
  { name: "accent", role: "background", color: hsl(15, 100, 65) },
  { name: "accent:hover", role: "background", color: hsl(15, 100, 54) },
  { name: "accent:active", role: "background", color: hsl(15, 100, 46) },
  { name: "danger", role: "background", color: hsl(5, 90, 58) },
  { name: "danger:hover", role: "background", color: hsl(5, 90, 48) },
  { name: "danger:active", role: "background", color: hsl(5, 90, 42) },
  { name: "warn", role: "background", color: hsl(44, 95, 58) },
  { name: "warn:hover", role: "background", color: hsl(44, 95, 46) },
  { name: "warn:active", role: "background", color: hsl(44, 95, 42) },
  { name: "promo1", role: "background", color: hsl(251, 93, 72) },
  { name: "promo1:hover", role: "background", color: hsl(251, 93, 62) },
  { name: "promo1:active", role: "background", color: hsl(251, 83, 57) },
  { name: "promo2", role: "background", color: hsl(182, 65, 45) },
  { name: "promo2:hover", role: "background", color: hsl(182, 65, 35) },
  { name: "promo2:active", role: "background", color: hsl(182, 65, 30) },
  { name: "color-white", role: "background", color: hsl(0, 0, 100) },
  { name: "color-black", role: "background", color: hsl(251, 20, 15) },
  { name: "color-blue", role: "background", color: hsl(251, 78, 40) },
  { name: "color-blue-light", role: "background", color: hsl(251, 80, 76) },
  { name: "color-red", role: "background", color: hsl(5, 90, 58) },
  { name: "color-red-light", role: "background", color: hsl(5, 95, 83) },
  { name: "color-green", role: "background", color: hsl(88, 64, 51) },
  { name: "color-green-light", role: "background", color: hsl(88, 80, 78) },
  { name: "color-orange", role: "background", color: hsl(15, 100, 65) },
  { name: "color-orange-light", role: "background", color: hsl(15, 100, 86) },
  { name: "color-gray", role: "background", color: hsl(251, 10, 46) },
  { name: "color-gray-light", role: "background", color: hsl(251, 12, 67) },
];

/** Typography styles — fonts-module (M2 UI Kit). */
export const M2_TYPOGRAPHY_TOKENS: M2TypographyToken[] = [
  { name: "tiny-alone", fontSize: 10, fontWeight: 400, lineHeight: 14 },
  { name: "tiny", fontSize: 10, fontWeight: 400, lineHeight: 18 },
  { name: "small-alone", fontSize: 12, fontWeight: 400, lineHeight: 16 },
  { name: "small", fontSize: 12, fontWeight: 400, lineHeight: 20 },
  { name: "secondary-alone", fontSize: 14, fontWeight: 400, lineHeight: 20 },
  { name: "secondary", fontSize: 14, fontWeight: 400, lineHeight: 24 },
  { name: "primary-alone", fontSize: 16, fontWeight: 400, lineHeight: 20 },
  { name: "primary", fontSize: 16, fontWeight: 400, lineHeight: 24 },
  { name: "h4", fontSize: 18, fontWeight: 500, lineHeight: 28 },
  { name: "promo-primary", fontSize: 18, fontWeight: 400, lineHeight: 28 },
  { name: "promo-primary-alone", fontSize: 18, fontWeight: 400, lineHeight: 24 },
  { name: "h3", fontSize: 22, fontWeight: 500, lineHeight: 32 },
  { name: "promo-h4", fontSize: 24, fontWeight: 500, lineHeight: 32 },
  { name: "h2", fontSize: 28, fontWeight: 500, lineHeight: 36 },
  { name: "h1", fontSize: 32, fontWeight: 500, lineHeight: 40 },
];

export function getM2TokensForRole(role: M2ColorRole): M2ColorToken[] {
  return role === "text" ? M2_TEXT_TOKENS : M2_BACKGROUND_TOKENS;
}
