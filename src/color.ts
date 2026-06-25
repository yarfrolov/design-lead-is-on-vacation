import type { RGB } from "../pixso-types";

export type RgbaColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export const WHITE: RgbaColor = { r: 1, g: 1, b: 1, a: 1 };

export function rgbToHex(color: RGB, alpha = 1): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  if (alpha < 1) {
    const a = Math.round(alpha * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(n: number): string {
  return n.toString(16).padStart(2, "0");
}

export function blendColors(foreground: RgbaColor, background: RgbaColor): RgbaColor {
  const fa = foreground.a;
  const ba = background.a;
  const outA = fa + ba * (1 - fa);
  if (outA === 0) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  return {
    r: (foreground.r * fa + background.r * ba * (1 - fa)) / outA,
    g: (foreground.g * fa + background.g * ba * (1 - fa)) / outA,
    b: (foreground.b * fa + background.b * ba * (1 - fa)) / outA,
    a: outA,
  };
}

export function solidPaintToRgba(color: RGB, opacity = 1): RgbaColor {
  return { r: color.r, g: color.g, b: color.b, a: opacity };
}
