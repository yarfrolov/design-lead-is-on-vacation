import type { TextNode } from "../pixso-types";
import {
  colorToHex,
  resolveTextBackground,
  resolveTextForeground,
} from "./background";
import {
  contrastRatio,
  formatRatio,
  isLargeText,
  passesContrast,
  requiredRatio,
} from "./contrast";
import { buildTextSegments } from "./text-segments";
import { buildFixRecommendation, type FixRecommendation } from "./recommendations";

export type ContrastIssue = {
  nodeId: string;
  nodeName: string;
  sampleText: string;
  fontSize: number;
  fontWeight: number;
  largeText: boolean;
  foregroundHex: string;
  backgroundHex: string;
  ratio: number;
  ratioLabel: string;
  requiredAa: number;
  requiredAaa: number;
  passesAa: boolean;
  passesAaa: boolean;
  recommendation: FixRecommendation;
  warning?: string;
};

export type ContrastEmptyReason = "no-frames" | "no-text";

export type ContrastReport = {
  scannedTextNodes: number;
  scannedSegments: number;
  issues: ContrastIssue[];
  passed: ContrastIssue[];
  emptyReason?: ContrastEmptyReason;
};

function truncateSample(text: string, max = 40): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function analyzeSegment(
  textNode: TextNode,
  fontSize: number,
  fontWeight: number,
  fills: import("../pixso-types").Paint[],
  sampleText: string
): ContrastIssue {
  const foreground = resolveTextForeground(fills);
  const large = isLargeText(fontSize, fontWeight);
  const requiredAa = requiredRatio("AA", large);

  if (!foreground) {
    const recommendation = buildFixRecommendation({
      ratio: 0,
      requiredAa,
      largeText: large,
      fontSize,
      fontWeight,
      foregroundHex: "—",
      backgroundHex: "—",
      foreground: null,
      background: null,
      unknownForeground: true,
    });
    return {
      nodeId: textNode.id,
      nodeName: textNode.name,
      sampleText: truncateSample(sampleText),
      fontSize,
      fontWeight,
      largeText: large,
      foregroundHex: "—",
      backgroundHex: "—",
      ratio: 0,
      ratioLabel: "—",
      requiredAa,
      requiredAaa: requiredRatio("AAA", large),
      passesAa: false,
      passesAaa: false,
      recommendation,
    };
  }

  const bg = resolveTextBackground(textNode);
  const ratio = contrastRatio(foreground, bg.color);

  const recommendation = buildFixRecommendation({
    ratio,
    requiredAa,
    largeText: large,
    fontSize,
    fontWeight,
    foregroundHex: colorToHex(foreground),
    backgroundHex: colorToHex(bg.color),
    foreground,
    background: bg.color,
    backgroundWarning: bg.warning,
  });

  return {
    nodeId: textNode.id,
    nodeName: textNode.name,
    sampleText: truncateSample(sampleText),
    fontSize,
    fontWeight,
    largeText: large,
    foregroundHex: colorToHex(foreground),
    backgroundHex: colorToHex(bg.color),
    ratio,
    ratioLabel: formatRatio(ratio),
    requiredAa,
    requiredAaa: requiredRatio("AAA", large),
    passesAa: passesContrast(ratio, "AA", large),
    passesAaa: passesContrast(ratio, "AAA", large),
    recommendation,
    warning: bg.warning,
  };
}

export function analyzeTextNode(textNode: TextNode): ContrastIssue[] {
  const segments = buildTextSegments(textNode);
  if (segments.length === 0) return [];

  return segments.map((segment) =>
    analyzeSegment(
      textNode,
      segment.fontSize,
      segment.fontWeight,
      segment.fills,
      segment.characters
    )
  );
}

export function buildReport(textNodes: TextNode[]): ContrastReport {
  const allIssues: ContrastIssue[] = [];
  let segmentCount = 0;

  for (const node of textNodes) {
    const results = analyzeTextNode(node);
    segmentCount += results.length;
    allIssues.push(...results);
  }

  const failed = allIssues.filter((item) => !item.passesAa);
  const passed = allIssues.filter((item) => item.passesAa);

  return {
    scannedTextNodes: textNodes.length,
    scannedSegments: segmentCount,
    issues: failed,
    passed,
  };
}
