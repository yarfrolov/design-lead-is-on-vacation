import type { SceneNode, TextNode } from "../pixso-types";

function isTextNode(node: SceneNode): node is TextNode {
  return node.type === "TEXT";
}

function hasChildren(node: SceneNode): node is SceneNode & { children: ReadonlyArray<SceneNode> } {
  return "children" in node && Array.isArray((node as { children?: unknown }).children);
}

export function collectTextNodes(root: SceneNode): TextNode[] {
  const result: TextNode[] = [];

  function walk(node: SceneNode): void {
    if (!node.visible) return;
    if (isTextNode(node)) {
      if (node.characters.trim().length > 0) {
        result.push(node);
      }
      return;
    }
    if (hasChildren(node)) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  walk(root);
  return result;
}
