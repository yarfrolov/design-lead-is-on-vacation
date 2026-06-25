import type { FontName, Paint, TextNode } from "../pixso-types";

export type TextSegmentData = {
  characters: string;
  fontSize: number;
  fontName: FontName;
  fontWeight: number;
  fills: Paint[];
};

const SEGMENT_FIELDS = ["fontName", "fontSize", "fontWeight", "fills"] as const;

function isMixed(value: unknown): boolean {
  return value === pixso.mixed;
}

function fontWeightFromStyle(style: string): number {
  const lower = style.toLowerCase();
  if (lower.includes("black")) return 900;
  if (lower.includes("bold")) return 700;
  if (lower.includes("semibold") || lower.includes("semi bold")) return 600;
  if (lower.includes("medium")) return 500;
  if (lower.includes("light")) return 300;
  if (lower.includes("thin")) return 100;
  return 400;
}

function unwrapMixed<T>(value: T | typeof pixso.mixed): T {
  if (isMixed(value)) {
    throw new Error("Unexpected mixed text style");
  }
  return value as T;
}

function readStyleAt(node: TextNode, index: number): Omit<TextSegmentData, "characters"> {
  const start = index;
  const end = index + 1;
  const fontName = unwrapMixed(node.getRangeFontName(start, end));
  const fontSize = unwrapMixed(node.getRangeFontSize(start, end));
  const fills = unwrapMixed(node.getRangeFills(start, end));
  return {
    fontName,
    fontSize,
    fontWeight: fontWeightFromStyle(fontName.style),
    fills: [...fills],
  };
}

function styleSignature(style: Omit<TextSegmentData, "characters">): string {
  return JSON.stringify({
    fontName: style.fontName,
    fontSize: style.fontSize,
    fills: style.fills,
  });
}

function buildSegmentsFromRangeApi(node: TextNode): TextSegmentData[] {
  const text = node.characters;
  const length = text.length;
  if (length === 0) return [];

  const segments: TextSegmentData[] = [];
  let start = 0;

  while (start < length) {
    const style = readStyleAt(node, start);
    const signature = styleSignature(style);
    let end = start + 1;
    while (end < length) {
      const nextStyle = readStyleAt(node, end);
      if (styleSignature(nextStyle) !== signature) break;
      end += 1;
    }
    segments.push({ ...style, characters: text.slice(start, end) });
    start = end;
  }

  return segments;
}

function buildSegmentsFromStyledTextSegments(node: TextNode): TextSegmentData[] | null {
  const getter = (node as TextNode & {
    getStyledTextSegments?: (
      fields: readonly string[]
    ) => Array<Record<string, unknown> & { characters: string }>;
  }).getStyledTextSegments;

  if (typeof getter !== "function") return null;

  try {
    const raw = getter.call(node, [...SEGMENT_FIELDS]);
    if (!Array.isArray(raw) || raw.length === 0) return null;
    return raw.map((segment) => ({
      characters: segment.characters,
      fontSize: segment.fontSize as number,
      fontName: segment.fontName as FontName,
      fontWeight:
        (segment.fontWeight as number | undefined) ??
        fontWeightFromStyle((segment.fontName as FontName).style),
      fills: segment.fills as Paint[],
    }));
  } catch {
    return null;
  }
}

export function buildTextSegments(node: TextNode): TextSegmentData[] {
  const fromStyled = buildSegmentsFromStyledTextSegments(node);
  if (fromStyled && fromStyled.length > 0) return fromStyled;
  return buildSegmentsFromRangeApi(node);
}
