import type { ContrastReport } from "./analyze";
import type { DesignContext } from "./extract-design";

/** UI → sandbox */
export type UiToPluginMessage =
  | { type: "run-contrast-check" }
  | { type: "run-ai-review" }
  | { type: "select-node"; nodeId: string };

/** sandbox → UI */
export type PluginToUiMessage =
  | { type: "report"; report: ContrastReport }
  | { type: "design-context"; context: DesignContext };

export type PluginMessage = UiToPluginMessage | PluginToUiMessage;

export function unwrapPluginMessage(raw: unknown): UiToPluginMessage | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.data === "object" && o.data !== null) {
    const d = o.data as Record<string, unknown>;
    if ("pluginMessage" in d) return d.pluginMessage as UiToPluginMessage;
  }
  if ("pluginMessage" in o) return o.pluginMessage as UiToPluginMessage;
  if ("type" in o && typeof o.type === "string") return raw as UiToPluginMessage;
  return null;
}

function isPluginToUiMessage(raw: unknown): raw is PluginToUiMessage {
  if (raw == null || typeof raw !== "object") return false;
  const type = (raw as { type?: unknown }).type;
  return type === "report" || type === "design-context";
}

export function unwrapUiMessage(event: MessageEvent): PluginToUiMessage | null {
  const raw = event.data;
  if (raw == null || typeof raw !== "object") return null;

  const o = raw as Record<string, unknown>;

  if (isPluginToUiMessage(o)) return o;

  if (typeof o.pluginMessage === "object" && o.pluginMessage !== null) {
    const msg = o.pluginMessage;
    if (isPluginToUiMessage(msg)) return msg;
  }

  if (typeof o.data === "object" && o.data !== null) {
    const d = o.data as Record<string, unknown>;
    if (isPluginToUiMessage(d)) return d;
    if (typeof d.pluginMessage === "object" && d.pluginMessage !== null) {
      const msg = d.pluginMessage;
      if (isPluginToUiMessage(msg)) return msg;
    }
  }

  return null;
}
