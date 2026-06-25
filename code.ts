/// <reference path="./pixso-types.d.ts" />

declare const pixso: import("./pixso-types").PixsoAPI;
declare const __html__: string;

import type { SceneNode } from "./pixso-types";
import { buildReport, type ContrastReport } from "./src/analyze";
import { collectTextNodes } from "./src/collect-text";
import { unwrapPluginMessage } from "./src/messages";

function isSceneNode(node: import("./pixso-types").BaseNodeMixin | null): node is SceneNode {
  return node !== null && node.type !== "PAGE" && node.type !== "DOCUMENT";
}

function getPageFrames(): SceneNode[] {
  return pixso.currentPage.children.filter(isSceneNode);
}

function emptyReport(reason: ContrastReport["emptyReason"]): ContrastReport {
  return {
    scannedTextNodes: 0,
    scannedSegments: 0,
    issues: [],
    passed: [],
    emptyReason: reason,
  };
}

function runContrastCheckOnPage(): ContrastReport {
  const frames = getPageFrames();
  if (frames.length === 0) {
    return emptyReport("no-frames");
  }

  pixso.currentPage.selection = frames;
  pixso.viewport.scrollAndZoomIntoView(frames);

  const textNodes = frames.flatMap((frame) => collectTextNodes(frame));
  if (textNodes.length === 0) {
    return emptyReport("no-text");
  }

  return buildReport(textNodes);
}

function sendReport(report: ContrastReport): void {
  pixso.ui.postMessage({ type: "report", report });
}

pixso.on("run", () => {
  pixso.showUI(__html__, {
    visible: true,
    width: 480,
    height: 720,
    title: "Design Lead is on vacation",
  });

  pixso.ui.onmessage = (raw: unknown) => {
    const msg = unwrapPluginMessage(raw);
    if (!msg) return;

    if (msg.type === "run-contrast-check") {
      sendReport(runContrastCheckOnPage());
      return;
    }

    if (msg.type === "select-node") {
      const node = pixso.getNodeById(msg.nodeId);
      if (isSceneNode(node)) {
        pixso.currentPage.selection = [node];
        pixso.viewport.scrollAndZoomIntoView([node]);
      }
    }
  };
});
