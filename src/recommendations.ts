import type { RgbaColor } from "./color";
import { formatRatio } from "./contrast";
import {
  buildM2ColorFixAction,
  suggestM2LargeTypography,
} from "./m2-token-match";

export type FixRecommendation = {
  problem: string;
  action: string;
};

export function buildFixRecommendation(params: {
  ratio: number;
  requiredAa: number;
  largeText: boolean;
  fontSize: number;
  fontWeight: number;
  foregroundHex: string;
  backgroundHex: string;
  foreground: RgbaColor | null;
  background: RgbaColor | null;
  unknownForeground?: boolean;
  backgroundWarning?: string;
}): FixRecommendation {
  const {
    ratio,
    requiredAa,
    largeText,
    fontSize,
    fontWeight,
    foreground,
    background,
    unknownForeground,
    backgroundWarning,
  } = params;

  if (unknownForeground || !foreground) {
    return {
      problem: "Цвет текста не определён.",
      action: "Задай сплошную заливку текста — градиенты не считаются.",
    };
  }

  const ratioText = formatRatio(ratio);

  if (ratio >= requiredAa) {
    return {
      problem: `${ratioText} — ок.`,
      action: backgroundWarning ?? "Менять ничего не нужно.",
    };
  }

  const problem = `${ratioText} — нужно ${requiredAa}:1.`;
  const actions: string[] = [];

  if (background) {
    const colorAction = buildM2ColorFixAction(foreground, background, requiredAa);
    if (colorAction) actions.push(colorAction);
  } else {
    actions.push("Подбери пару текст/фон из палитры M2 UI Kit.");
  }

  if (!largeText && ratio >= 3) {
    const sizeHint = suggestM2LargeTypography(fontSize, fontWeight);
    if (sizeHint) {
      actions.push(`Или ${sizeHint} — для крупного хватит 3:1 (сейчас ${ratioText}).`);
    }
  }

  if (backgroundWarning) {
    actions.push(backgroundWarning);
  }

  return {
    problem,
    action: actions.join(" "),
  };
}
