import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getContrastScanRoots } from "../src/get-scan-roots.ts";
import type { SceneNode } from "../pixso-types";

function frame(id: string): SceneNode {
  return { id, type: "FRAME", name: id } as SceneNode;
}

function text(id: string): SceneNode {
  return { id, type: "TEXT", name: id } as SceneNode;
}

describe("getContrastScanRoots", () => {
  const pageFrames = [frame("a"), frame("b")];

  it("scans single selected frame only", () => {
    const roots = getContrastScanRoots([frame("a")], pageFrames);
    assert.deepEqual(roots.map((node) => node.id), ["a"]);
  });

  it("scans all page frames when nothing selected", () => {
    const roots = getContrastScanRoots([], pageFrames);
    assert.deepEqual(roots.map((node) => node.id), ["a", "b"]);
  });

  it("scans all page frames when multiple nodes selected", () => {
    const roots = getContrastScanRoots([frame("a"), frame("b")], pageFrames);
    assert.deepEqual(roots.map((node) => node.id), ["a", "b"]);
  });

  it("scans all page frames when single non-frame selected", () => {
    const roots = getContrastScanRoots([text("t1")], pageFrames);
    assert.deepEqual(roots.map((node) => node.id), ["a", "b"]);
  });
});
