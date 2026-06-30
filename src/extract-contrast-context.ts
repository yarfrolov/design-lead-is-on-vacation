import type { SceneNode } from "../pixso-types";
import { analyzeTextNode } from "./analyze";
import { collectTextNodes } from "./collect-text";

const MAX_ENTRIES = 100;

export type ContrastTextEntry = {
  key: string;
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
  warning?: string;
};

export type ContrastDesignContext = {
  pageName: string;
  entries: ContrastTextEntry[];
  emptyReason?: "no-frames" | "no-text";
};

export function extractContrastContext(frames: SceneNode[], pageName: string): ContrastDesignContext {
  if (frames.length === 0) {
    return { pageName, entries: [], emptyReason: "no-frames" };
  }

  const textNodes = frames.flatMap((frame) => collectTextNodes(frame));
  if (textNodes.length === 0) {
    return { pageName, entries: [], emptyReason: "no-text" };
  }

  const entries: ContrastTextEntry[] = [];

  for (const node of textNodes) {
    const segments = analyzeTextNode(node);
    segments.forEach((issue, index) => {
      entries.push({
        key: `${issue.nodeId}:${index}`,
        nodeId: issue.nodeId,
        nodeName: issue.nodeName,
        sampleText: issue.sampleText,
        fontSize: issue.fontSize,
        fontWeight: issue.fontWeight,
        largeText: issue.largeText,
        foregroundHex: issue.foregroundHex,
        backgroundHex: issue.backgroundHex,
        ratio: issue.ratio,
        ratioLabel: issue.ratioLabel,
        requiredAa: issue.requiredAa,
        requiredAaa: issue.requiredAaa,
        warning: issue.warning,
      });
    });
  }

  return {
    pageName,
    entries: entries.slice(0, MAX_ENTRIES),
  };
}
