/// <reference path="./pixso-types.d.ts" />

declare const pixso: import("./pixso-types").PixsoAPI;
declare const __html__: string;

import type { SceneNode } from "./pixso-types";
import { buildReport, type ContrastReport } from "./src/analyze";
import { collectTextNodes } from "./src/collect-text";
import { extractDesignContext, type DesignContext } from "./src/extract-design";
import { getContrastScanRoots } from "./src/get-scan-roots";
import { unwrapPluginMessage } from "./src/messages";

function isSceneNode(node: import("./pixso-types").BaseNodeMixin | null): node is SceneNode {
  return node !== null && node.type !== "PAGE" && node.type !== "DOCUMENT";
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

function getPageChildren(): SceneNode[] {
  return pixso.currentPage.children.filter(isSceneNode);
}

function scanSelectedMocks(): {
  contrastReport: ContrastReport;
  designContext: DesignContext;
} {
  const pageName = pixso.currentPage.name;
  const scanRoots = getContrastScanRoots(pixso.currentPage.selection, getPageChildren());

  if (scanRoots.length === 0) {
    return {
      contrastReport: emptyReport("no-frames"),
      designContext: extractDesignContext([], pageName),
    };
  }

  pixso.viewport.scrollAndZoomIntoView(scanRoots);

  const textNodes = scanRoots.flatMap((root) => collectTextNodes(root));
  const designContext = extractDesignContext(scanRoots, pageName);
  const contrastReport =
    textNodes.length === 0 ? emptyReport("no-text") : buildReport(textNodes);

  return { contrastReport, designContext };
}

function sendReport(report: ContrastReport): void {
  pixso.ui.postMessage({ type: "report", report });
}

function sendDesignContext(context: DesignContext): void {
  pixso.ui.postMessage({ type: "design-context", context });
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
      try {
        sendReport(scanSelectedMocks().contrastReport);
      } catch (error) {
        console.error("Contrast scan failed:", error);
        sendReport(emptyReport("no-text"));
      }
      return;
    }

    if (msg.type === "run-ai-review") {
      try {
        const { contrastReport, designContext } = scanSelectedMocks();
        sendReport(contrastReport);
        sendDesignContext(designContext);
      } catch (error) {
        console.error("AI review scan failed:", error);
        sendReport(emptyReport("no-text"));
        sendDesignContext(extractDesignContext([], pixso.currentPage.name));
      }
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
