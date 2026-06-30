import type { SceneNode, TextNode } from "../pixso-types";

const MAX_FRAMES = 20;
const MAX_DEPTH = 4;
const MAX_CHILDREN = 40;
const MAX_TEXT_LEN = 200;

export type DesignLayer = {
  type: string;
  name: string;
  w?: number;
  h?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  children?: DesignLayer[];
};

export type DesignFrame = {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: DesignLayer[];
};

export type DesignContext = {
  pageName: string;
  frames: DesignFrame[];
  textSummary: string[];
  emptyReason?: "no-frames";
};

function isTextNode(node: SceneNode): node is TextNode {
  return node.type === "TEXT";
}

function hasChildren(node: SceneNode): node is SceneNode & { children: ReadonlyArray<SceneNode> } {
  return "children" in node && Array.isArray((node as { children?: unknown }).children);
}

function truncate(text: string, max = MAX_TEXT_LEN): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function readFontSize(node: TextNode): number | undefined {
  if (typeof node.fontSize === "number") return node.fontSize;
  return undefined;
}

function readFontFamily(node: TextNode): string | undefined {
  if (node.fontName && typeof node.fontName === "object" && "family" in node.fontName) {
    return node.fontName.family;
  }
  return undefined;
}

function serializeLayer(node: SceneNode, depth: number): DesignLayer | null {
  if (!node.visible) return null;

  const layer: DesignLayer = {
    type: node.type,
    name: node.name,
    w: Math.round(node.width),
    h: Math.round(node.height),
  };

  if (isTextNode(node)) {
    const text = truncate(node.characters);
    if (!text) return null;
    layer.text = text;
    layer.fontSize = readFontSize(node);
    layer.fontFamily = readFontFamily(node);
    return layer;
  }

  if (depth >= MAX_DEPTH || !hasChildren(node)) {
    return layer;
  }

  const children: DesignLayer[] = [];
  for (const child of node.children.slice(0, MAX_CHILDREN)) {
    const serialized = serializeLayer(child, depth + 1);
    if (serialized) children.push(serialized);
  }

  if (children.length > 0) {
    layer.children = children;
  }

  return layer;
}

function collectTextSummary(root: SceneNode, out: string[]): void {
  if (!root.visible) return;

  if (isTextNode(root)) {
    const text = truncate(root.characters, 120);
    if (text) {
      out.push(`${root.name}: «${text}»`);
    }
    return;
  }

  if (hasChildren(root)) {
    for (const child of root.children) {
      collectTextSummary(child, out);
    }
  }
}

export function extractDesignContext(frames: SceneNode[], pageName: string): DesignContext {
  if (frames.length === 0) {
    return { pageName, frames: [], textSummary: [], emptyReason: "no-frames" };
  }

  const textSummary: string[] = [];
  const designFrames: DesignFrame[] = [];

  for (const frame of frames.slice(0, MAX_FRAMES)) {
    const layers: DesignLayer[] = [];
    if (hasChildren(frame)) {
      for (const child of frame.children.slice(0, MAX_CHILDREN)) {
        const layer = serializeLayer(child, 0);
        if (layer) layers.push(layer);
      }
    }

    collectTextSummary(frame, textSummary);

    designFrames.push({
      id: frame.id,
      name: frame.name,
      width: Math.round(frame.width),
      height: Math.round(frame.height),
      layers,
    });
  }

  return {
    pageName,
    frames: designFrames,
    textSummary: textSummary.slice(0, 150),
  };
}
