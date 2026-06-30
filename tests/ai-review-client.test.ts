import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAiReviewResponse } from "../src/ai-review-client.ts";
import { copyAiReviewListText } from "../src/ai-review-render.ts";

describe("parseAiReviewResponse", () => {
  it("normalizes valid items and fills missing ones", () => {
    const report = parseAiReviewResponse(
      {
        items: [
          { id: "goal-clear", answer: "yes", comment: "" },
          { id: "texts-short", answer: "no", comment: "Много канцелярита" },
        ],
        summary: "Есть проблемы с текстами",
      },
      "gemma27b"
    );

    assert.equal(report.model, "gemma27b");
    assert.equal(report.summary, "Есть проблемы с текстами");
    assert.equal(report.items.length, 39);

    const goal = report.items.find((item) => item.id === "goal-clear");
    assert.equal(goal?.answer, "yes");

    const texts = report.items.find((item) => item.id === "texts-short");
    assert.equal(texts?.answer, "no");
    assert.equal(texts?.comment, "Много канцелярита");

    const unknown = report.items.find((item) => item.id === "analytics-agreed");
    assert.equal(unknown?.answer, "unknown");
  });

  it("formats issues and unknown for clipboard", () => {
    const report = parseAiReviewResponse(
      {
        items: [
          { id: "texts-short", answer: "no", comment: "Много канцелярита" },
          { id: "analytics-agreed", answer: "unknown", comment: "Нет данных в макете" },
        ],
        summary: "Нужны правки",
      },
      "gemma27b"
    );

    const text = copyAiReviewListText(report);
    assert.match(text, /## Проблемы \(1\)/);
    assert.match(text, /Много канцелярита/);
    assert.match(text, /Нет данных в макете/);
    assert.match(text, /Вывод: Нужны правки/);
  });
});
