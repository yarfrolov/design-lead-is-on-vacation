import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPendingLoaderMessage } from "../src/ui-loader.ts";
import type { ContrastSessionState } from "../src/ui-contrast-session.ts";
import type { AiReviewSessionState } from "../src/ui-ai-review-session.ts";

const baseContrast: ContrastSessionState = {
  report: null,
  tab: "issues",
  pending: false,
  onlyView: false,
  error: null,
};

const baseAiReview: AiReviewSessionState = {
  report: null,
  tab: "issues",
  pending: false,
  onlyView: false,
  error: null,
  config: { apiUrl: "", token: "", model: "gemma27b" },
};

describe("getPendingLoaderMessage", () => {
  it("shows loader while contrast-only check runs", () => {
    const message = getPendingLoaderMessage({
      contrast: { ...baseContrast, onlyView: true, pending: true },
      aiReview: baseAiReview,
    });
    assert.equal(message, "Проверяем контраст…");
  });

  it("hides loader after contrast-only check completes", () => {
    const message = getPendingLoaderMessage({
      contrast: {
        ...baseContrast,
        onlyView: true,
        pending: false,
        report: { scannedTextNodes: 1, scannedSegments: 1, issues: [], passed: [] },
      },
      aiReview: baseAiReview,
    });
    assert.equal(message, null);
  });

  it("shows combined loader while AI and contrast are pending", () => {
    const message = getPendingLoaderMessage({
      contrast: { ...baseContrast, pending: true },
      aiReview: { ...baseAiReview, onlyView: true, pending: true },
    });
    assert.equal(message, "Анализируем макет и контраст…");
  });

  it("keeps loader while AI is pending even if contrast is ready", () => {
    const message = getPendingLoaderMessage({
      contrast: {
        ...baseContrast,
        pending: false,
        report: { scannedTextNodes: 1, scannedSegments: 1, issues: [], passed: [] },
      },
      aiReview: { ...baseAiReview, onlyView: true, pending: true },
    });
    assert.equal(message, "Анализируем макет…");
  });
});
