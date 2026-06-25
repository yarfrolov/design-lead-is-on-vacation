import type {
  BaseNodeMixin,
  ChildrenMixin,
  GeometryMixin,
  Paint,
  SceneNode,
  SolidPaint,
  TextNode,
} from "../pixso-types";
import { blendColors, solidPaintToRgba, WHITE, type RgbaColor } from "./color";

type Bounds = { x: number; y: number; width: number; height: number };

function isMixed(value: unknown): boolean {
  return value === pixso.mixed;
}

function hasGeometry(node: BaseNodeMixin): node is SceneNode & GeometryMixin {
  return "fills" in node;
}

function hasChildren(node: BaseNodeMixin): node is BaseNodeMixin & ChildrenMixin {
  return "children" in node && Array.isArray((node as ChildrenMixin).children);
}

function getBounds(node: SceneNode): Bounds | null {
  return node.absoluteBoundingBox;
}

function boundsOverlap(a: Bounds, b: Bounds): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function getTopSolidFill(fills: ReadonlyArray<Paint> | Paint[] | symbol): SolidPaint | null {
  if (isMixed(fills) || !Array.isArray(fills)) {
    return null;
  }
  for (let i = fills.length - 1; i >= 0; i -= 1) {
    const paint = fills[i];
    if (paint.visible === false) {
      continue;
    }
    if (paint.type === "SOLID") {
      return paint;
    }
  }
  return null;
}

function nodeOpacity(node: SceneNode): number {
  return typeof node.opacity === "number" ? node.opacity : 1;
}

function paintToLayerRgba(paint: SolidPaint, nodeAlpha: number): RgbaColor | null {
  const paintAlpha = paint.opacity ?? 1;
  const alpha = paintAlpha * nodeAlpha;
  if (alpha <= 0) {
    return null;
  }
  return solidPaintToRgba(paint.color, alpha);
}

function getPageBackground(node: TextNode): RgbaColor | null {
  let current: BaseNodeMixin | null = node.parent;
  while (current) {
    if (current.type === "PAGE" && "backgrounds" in current) {
      const page = current as { backgrounds: ReadonlyArray<SolidPaint> };
      const solid = getTopSolidFill(page.backgrounds);
      if (solid) {
        return paintToLayerRgba(solid, 1);
      }
      return null;
    }
    current = current.parent;
  }
  return null;
}

function collectSiblingLayersBehind(textNode: TextNode, textBounds: Bounds): RgbaColor[] {
  const parent = textNode.parent;
  if (!parent || !hasChildren(parent)) {
    return [];
  }

  const layers: RgbaColor[] = [];
  for (const child of parent.children) {
    if (child.id === textNode.id) {
      break;
    }
    if (!child.visible || child.type === "TEXT") {
      continue;
    }
    if (!hasGeometry(child)) {
      continue;
    }
    const bounds = getBounds(child as SceneNode);
    if (!bounds || !boundsOverlap(bounds, textBounds)) {
      continue;
    }
    const solid = getTopSolidFill(child.fills);
    if (!solid) {
      continue;
    }
    const rgba = paintToLayerRgba(solid, nodeOpacity(child as SceneNode));
    if (rgba) {
      layers.push(rgba);
    }
  }
  return layers;
}

function collectAncestorLayers(textNode: TextNode): RgbaColor[] {
  const layers: RgbaColor[] = [];
  let current: BaseNodeMixin | null = textNode.parent;

  while (current && current.type !== "PAGE") {
    if (hasGeometry(current)) {
      const solid = getTopSolidFill(current.fills);
      if (solid) {
        const rgba = paintToLayerRgba(solid, nodeOpacity(current as SceneNode));
        if (rgba) {
          layers.push(rgba);
        }
      }
    }
    current = current.parent;
  }

  return layers;
}

export type BackgroundSource =
  | "sibling"
  | "ancestor"
  | "page"
  | "assumed-white"
  | "unknown";

export type BackgroundResult = {
  color: RgbaColor;
  source: BackgroundSource;
  warning?: string;
};

export function resolveTextBackground(textNode: TextNode): BackgroundResult {
  const textBounds = getBounds(textNode);
  if (!textBounds) {
    return {
      color: WHITE,
      source: "assumed-white",
      warning: "Не удалось определить границы текста",
    };
  }

  const siblingLayers = collectSiblingLayersBehind(textNode, textBounds);
  const ancestorLayers = collectAncestorLayers(textNode);
  const pageBg = getPageBackground(textNode);

  let composite = pageBg ?? WHITE;
  let source: BackgroundSource = pageBg ? "page" : "assumed-white";

  if (ancestorLayers.length > 0) {
    source = "ancestor";
    for (let i = ancestorLayers.length - 1; i >= 0; i -= 1) {
      composite = blendColors(ancestorLayers[i], composite);
    }
  }

  if (siblingLayers.length > 0) {
    source = "sibling";
    for (const layer of siblingLayers) {
      composite = blendColors(layer, composite);
    }
  }

  const gradientWarning = hasUnsupportedBackground(textNode);
  if (gradientWarning) {
    return { color: composite, source, warning: gradientWarning };
  }

  return { color: composite, source };
}

export function resolveTextForeground(fills: Paint[]): RgbaColor | null {
  const solid = getTopSolidFill(fills);
  if (!solid) {
    return null;
  }
  return paintToLayerRgba(solid, 1);
}

export function colorToHex(color: RgbaColor): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase();
}

export function hasUnsupportedBackground(textNode: TextNode): string | null {
  const parent = textNode.parent;
  if (!parent || !hasChildren(parent)) {
    return null;
  }

  const textBounds = getBounds(textNode);
  if (!textBounds) {
    return null;
  }

  const checkNode = (node: SceneNode): string | null => {
    if (!node.visible || !hasGeometry(node)) {
      return null;
    }
    const bounds = getBounds(node);
    if (!bounds || !boundsOverlap(bounds, textBounds)) {
      return null;
    }
    const fills = node.fills;
    if (isMixed(fills) || !Array.isArray(fills)) {
      return null;
    }
    for (const paint of fills) {
      if (paint.visible === false) {
        continue;
      }
      if (
        paint.type === "GRADIENT_LINEAR" ||
        paint.type === "GRADIENT_RADIAL" ||
        paint.type === "IMAGE"
      ) {
        return "Градиент или изображение на фоне — контраст приблизительный";
      }
    }
    return null;
  };

  for (const child of parent.children) {
    if (child.id === textNode.id) {
      break;
    }
    const warning = checkNode(child);
    if (warning) {
      return warning;
    }
  }

  let current: BaseNodeMixin | null = textNode.parent;
  while (current && current.type !== "PAGE") {
    if (hasGeometry(current)) {
      const warning = checkNode(current as SceneNode);
      if (warning) {
        return warning;
      }
    }
    current = current.parent;
  }

  return null;
}
