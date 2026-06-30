import type { SceneNode } from "../pixso-types";

function isFrameNode(node: SceneNode): boolean {
  return node.type === "FRAME" || node.type === "COMPONENT" || node.type === "INSTANCE";
}

/** Один выделенный фрейм → только он; иначе все top-level макеты страницы. */
export function getContrastScanRoots(selection: SceneNode[], pageChildren: SceneNode[]): SceneNode[] {
  if (selection.length === 1 && isFrameNode(selection[0])) {
    return [selection[0]];
  }

  return pageChildren;
}
