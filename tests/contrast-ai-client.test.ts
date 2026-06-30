import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseContrastAiResponse } from "../src/contrast-ai-client.ts";
import type { ContrastDesignContext } from "../src/extract-contrast-context.ts";

const sampleContext: ContrastDesignContext = {
  pageName: "Page 1",
  entries: [
    {
      key: "1:0",
      nodeId: "1",
      nodeName: "Title",
      sampleText: "Hello",
      fontSize: 16,
      fontWeight: 400,
      largeText: false,
      foregroundHex: "#000000",
      backgroundHex: "#ffffff",
      ratio: 21,
      ratioLabel: "21.00:1",
      requiredAa: 4.5,
      requiredAaa: 7,
    },
    {
      key: "2:0",
      nodeId: "2",
      nodeName: "Hint",
      sampleText: "Muted",
      fontSize: 12,
      fontWeight: 400,
      largeText: false,
      foregroundHex: "#cccccc",
      backgroundHex: "#ffffff",
      ratio: 1.6,
      ratioLabel: "1.60:1",
      requiredAa: 4.5,
      requiredAaa: 7,
    },
  ],
};

describe("parseContrastAiResponse", () => {
  it("splits issues and passed from AI response", () => {
    const report = parseContrastAiResponse(
      {
        items: [
          { key: "1:0", passesAa: true, passesAaa: true, comment: "Контраст достаточный" },
          { key: "2:0", passesAa: false, passesAaa: false, comment: "Слишком бледный текст" },
        ],
        summary: "Есть проблемы",
      },
      sampleContext
    );

    assert.equal(report.scannedSegments, 2);
    assert.equal(report.issues.length, 1);
    assert.equal(report.passed.length, 1);
    assert.equal(report.issues[0]?.nodeName, "Hint");
    assert.match(report.issues[0]?.recommendation.problem ?? "", /бледный/i);
  });
});
