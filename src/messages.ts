import type { ContrastReport } from "./analyze";

/** UI → sandbox */
export type UiToPluginMessage =
  | { type: "run-contrast-check" }
  | { type: "select-node"; nodeId: string };

/** sandbox → UI */
export type PluginToUiMessage = { type: "report"; report: ContrastReport };

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

export function unwrapUiMessage(event: MessageEvent): PluginToUiMessage | null {
  const data = event.data as { pluginMessage?: PluginToUiMessage };
  const msg = data?.pluginMessage;
  if (msg?.type === "report") return msg;
  return null;
}
