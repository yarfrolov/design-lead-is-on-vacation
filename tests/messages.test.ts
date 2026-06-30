import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { unwrapUiMessage } from "../src/messages.ts";

describe("unwrapUiMessage", () => {
  it("reads direct contrast report", () => {
    const msg = unwrapUiMessage({
      data: {
        type: "report",
        report: { scannedTextNodes: 1, scannedSegments: 1, issues: [], passed: [] },
      },
    } as MessageEvent);
    assert.equal(msg?.type, "report");
  });

  it("reads pluginMessage wrapper", () => {
    const msg = unwrapUiMessage({
      data: {
        pluginMessage: {
          type: "design-context",
          context: { pageName: "P", frames: [], textSummary: [] },
        },
      },
    } as MessageEvent);
    assert.equal(msg?.type, "design-context");
  });

  it("reads nested data.pluginMessage wrapper", () => {
    const msg = unwrapUiMessage({
      data: {
        data: {
          pluginMessage: {
            type: "report",
            report: { scannedTextNodes: 0, scannedSegments: 0, issues: [], passed: [] },
          },
        },
      },
    } as MessageEvent);
    assert.equal(msg?.type, "report");
  });
});
