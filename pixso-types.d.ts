// Pixso Plugin API types (subset for WCAG contrast checker)
// https://pixso.net/developer/en/plugin-api/

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface FontName {
  family: string;
  style: string;
}

type FontStyle = "REGULAR" | "ITALIC" | "OBLIQUE";

interface LetterSpacing {
  value: number;
  unit: "PIXELS" | "PERCENT" | "PT";
}

interface LineHeight {
  value: number;
  unit: "PIXELS" | "PERCENT" | "PT" | "AUTO";
}

type TextCase = "ORIGINAL" | "UPPER" | "LOWER" | "TITLE" | "SMALL_CAPS" | "SMALL_CAPS_FORCED";
type TextDecoration = "NONE" | "UNDERLINE" | "STRIKETHROUGH";

interface SolidPaint {
  readonly type: "SOLID";
  readonly color: RGB;
  readonly visible?: boolean;
  readonly opacity?: number;
}

interface GradientPaint {
  readonly type:
    | "GRADIENT_LINEAR"
    | "GRADIENT_RADIAL"
    | "GRADIENT_ANGULAR"
    | "GRADIENT_DIAMOND";
  readonly visible?: boolean;
  readonly opacity?: number;
}

interface ImagePaint {
  readonly type: "IMAGE";
  readonly visible?: boolean;
  readonly opacity?: number;
}

type Paint = SolidPaint | GradientPaint | ImagePaint;

interface BaseNodeMixin {
  readonly id: string;
  name: string;
  readonly type: string;
  visible: boolean;
  readonly parent: (BaseNodeMixin & ChildrenMixin) | null;
}

interface SceneNodeMixin extends BaseNodeMixin {
  x: number;
  y: number;
  readonly width: number;
  readonly height: number;
  opacity: number;
  readonly absoluteBoundingBox: { x: number; y: number; width: number; height: number } | null;
}

interface GeometryMixin {
  fills: ReadonlyArray<Paint> | Paint[] | PixsoAPI["mixed"];
}

interface ChildrenMixin {
  readonly children: ReadonlyArray<SceneNode>;
}

interface FrameNode extends SceneNodeMixin, GeometryMixin, ChildrenMixin {
  readonly type: "FRAME";
}

interface RectangleNode extends SceneNodeMixin, GeometryMixin {
  readonly type: "RECTANGLE";
}

interface GroupNode extends SceneNodeMixin, ChildrenMixin {
  readonly type: "GROUP";
}

interface InstanceNode extends SceneNodeMixin, ChildrenMixin {
  readonly type: "INSTANCE";
}

interface ComponentNode extends SceneNodeMixin, GeometryMixin, ChildrenMixin {
  readonly type: "COMPONENT";
}

interface StyledTextSegment {
  characters: string;
  start: number;
  end: number;
  fontSize: number;
  fontName: FontName;
  fontWeight: number;
  fontStyle: FontStyle;
  textDecoration: TextDecoration;
  textCase: TextCase;
  lineHeight: LineHeight;
  letterSpacing: LetterSpacing;
  fills: Paint[];
}

interface TextNode extends SceneNodeMixin, GeometryMixin {
  readonly type: "TEXT";
  characters: string;
  fontSize: number | PixsoAPI["mixed"];
  fontName: FontName | PixsoAPI["mixed"];
  getRangeFontName(start: number, end: number): FontName | PixsoAPI["mixed"];
  getRangeFontSize(start: number, end: number): number | PixsoAPI["mixed"];
  getRangeFills(start: number, end: number): Paint[] | PixsoAPI["mixed"];
  getStyledTextSegments?<
    F extends (keyof Omit<StyledTextSegment, "characters" | "start" | "end">)[],
  >(
    fields: F,
    start?: number,
    end?: number
  ): Array<Pick<StyledTextSegment, F[number] | "characters" | "start" | "end">>;
}

type SceneNode =
  | FrameNode
  | RectangleNode
  | GroupNode
  | InstanceNode
  | ComponentNode
  | TextNode;

interface PageNode extends BaseNodeMixin, ChildrenMixin {
  readonly type: "PAGE";
  selection: SceneNode[];
  backgrounds: ReadonlyArray<SolidPaint>;
}

interface ViewportAPI {
  scrollAndZoomIntoView(nodes: ReadonlyArray<BaseNodeMixin>): void;
}

interface PixsoUI {
  onmessage: ((message: unknown) => void) | null;
  postMessage(message: unknown): void;
}

export interface PixsoAPI {
  readonly mixed: unique symbol;
  readonly currentPage: PageNode;
  readonly ui: PixsoUI;
  readonly viewport: ViewportAPI;
  on(event: "run", callback: () => void): void;
  showUI(
    html: string,
    options?: { visible?: boolean; width?: number; height?: number; title?: string }
  ): void;
  notify(
    message: string,
    options?: { timeout?: number; error?: boolean; icon?: "SUCCESS" | "ERROR" | "WARN" | "INFO" }
  ): void;
  closePlugin(message?: string): void;
  getNodeById(id: string): BaseNodeMixin | null;
  loadFontAsync(fontName: FontName): Promise<void>;
}

export type {
  SceneNode,
  FrameNode,
  TextNode,
  Paint,
  SolidPaint,
  FontName,
  RGB,
  PageNode,
  GeometryMixin,
  ChildrenMixin,
  BaseNodeMixin,
};

declare global {
  const pixso: PixsoAPI;
}
