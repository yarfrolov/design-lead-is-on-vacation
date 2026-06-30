import type { ContrastIssue, ContrastReport } from "./analyze";
import type { RgbaColor } from "./color";
import { passesContrast } from "./contrast";
import { buildContrastAiMessages } from "./contrast-ai-prompt";
import type { ContrastDesignContext, ContrastTextEntry } from "./extract-contrast-context";
import type { LlmConfig } from "./ai-review-client";
import { extractJson, fetchLlmChat } from "./llm-shared";
import { buildFixRecommendation } from "./recommendations";

function hexToRgba(hex: string): RgbaColor | null {
  if (!hex.startsWith("#") || hex === "—") return null;
  const raw = hex.slice(1);
  if (raw.length !== 6) return null;
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  if ([r, g, b].some((value) => Number.isNaN(value))) return null;
  return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
}

function buildIssueFromEntry(
  entry: ContrastTextEntry,
  passesAa: boolean,
  passesAaa: boolean,
  comment: string
): ContrastIssue {
  const foreground = hexToRgba(entry.foregroundHex);
  const background = hexToRgba(entry.backgroundHex);
  const recommendation = buildFixRecommendation({
    ratio: entry.ratio,
    requiredAa: entry.requiredAa,
    largeText: entry.largeText,
    fontSize: entry.fontSize,
    fontWeight: entry.fontWeight,
    foregroundHex: entry.foregroundHex,
    backgroundHex: entry.backgroundHex,
    foreground,
    background,
    unknownForeground: !foreground,
    backgroundWarning: entry.warning,
  });

  if (!passesAa && comment) {
    recommendation.problem = comment;
  } else if (passesAa && comment && comment.toLowerCase() !== "ok") {
    recommendation.action = comment;
  }

  return {
    nodeId: entry.nodeId,
    nodeName: entry.nodeName,
    sampleText: entry.sampleText,
    fontSize: entry.fontSize,
    fontWeight: entry.fontWeight,
    largeText: entry.largeText,
    foregroundHex: entry.foregroundHex,
    backgroundHex: entry.backgroundHex,
    ratio: entry.ratio,
    ratioLabel: entry.ratioLabel,
    requiredAa: entry.requiredAa,
    requiredAaa: entry.requiredAaa,
    passesAa,
    passesAaa,
    recommendation,
    warning: entry.warning,
  };
}

function fallbackPasses(entry: ContrastTextEntry): { passesAa: boolean; passesAaa: boolean } {
  return {
    passesAa: passesContrast(entry.ratio, "AA", entry.largeText),
    passesAaa: passesContrast(entry.ratio, "AAA", entry.largeText),
  };
}

export function parseContrastAiResponse(
  raw: unknown,
  context: ContrastDesignContext
): ContrastReport {
  const byKey = new Map<string, { passesAa: boolean; passesAaa: boolean; comment: string }>();

  if (raw && typeof raw === "object") {
    const data = raw as { items?: unknown };
    if (Array.isArray(data.items)) {
      for (const entry of data.items) {
        if (!entry || typeof entry !== "object") continue;
        const row = entry as {
          key?: unknown;
          passesAa?: unknown;
          passesAaa?: unknown;
          comment?: unknown;
        };
        if (typeof row.key !== "string") continue;
        byKey.set(row.key, {
          passesAa: row.passesAa === true,
          passesAaa: row.passesAaa === true,
          comment: typeof row.comment === "string" ? row.comment.trim() : "",
        });
      }
    }
  }

  const issues: ContrastIssue[] = [];
  const uniqueNodes = new Set(context.entries.map((entry) => entry.nodeId));

  for (const entry of context.entries) {
    const ai = byKey.get(entry.key);
    const passes = ai
      ? { passesAa: ai.passesAa, passesAaa: ai.passesAaa }
      : fallbackPasses(entry);
    const comment = ai?.comment ?? (ai ? "" : "Модель не вернула оценку — использован расчётный контраст");

    issues.push(buildIssueFromEntry(entry, passes.passesAa, passes.passesAaa, comment));
  }

  const failed = issues.filter((item) => !item.passesAa);
  const passed = issues.filter((item) => item.passesAa);

  return {
    scannedTextNodes: uniqueNodes.size,
    scannedSegments: context.entries.length,
    issues: failed,
    passed,
  };
}

export async function runAiContrastCheck(
  context: ContrastDesignContext,
  config: LlmConfig
): Promise<ContrastReport> {
  if (context.emptyReason === "no-frames") {
    return {
      scannedTextNodes: 0,
      scannedSegments: 0,
      issues: [],
      passed: [],
      emptyReason: "no-frames",
    };
  }

  if (context.emptyReason === "no-text") {
    return {
      scannedTextNodes: 0,
      scannedSegments: 0,
      issues: [],
      passed: [],
      emptyReason: "no-text",
    };
  }

  if (context.entries.length === 0) {
    throw new Error("Нет текстовых элементов для проверки контраста");
  }

  const messages = buildContrastAiMessages(context);
  const content = await fetchLlmChat(config, messages, 8192);
  const parsed = extractJson(content);
  return parseContrastAiResponse(parsed, context);
}
