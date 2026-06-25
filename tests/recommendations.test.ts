import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { suggestM2TextToken } from "../src/m2-token-match.ts";
import { buildFixRecommendation } from "../src/recommendations.ts";

describe("recommendations", () => {
  it("returns guidance for unknown foreground", () => {
    const fix = buildFixRecommendation({
      ratio: 0,
      requiredAa: 4.5,
      largeText: false,
      fontSize: 16,
      fontWeight: 400,
      foregroundHex: "—",
      backgroundHex: "—",
      foreground: null,
      background: null,
      unknownForeground: true,
    });

    assert.match(fix.problem, /не определён/i);
    assert.match(fix.action, /сплошную заливку/i);
  });

  it("suggests semantic text token when contrast fails", () => {
    const fix = buildFixRecommendation({
      ratio: 2.5,
      requiredAa: 4.5,
      largeText: false,
      fontSize: 16,
      fontWeight: 400,
      foregroundHex: "#777777",
      backgroundHex: "#FFFFFF",
      foreground: { r: 0.47, g: 0.47, b: 0.47, a: 1 },
      background: { r: 1, g: 1, b: 1, a: 1 },
    });

    assert.match(fix.problem, /2\.50:1/);
    assert.doesNotMatch(fix.action, /#[0-9A-F]{6}/i);
    assert.match(fix.action, /→/);
  });

  it("returns ok message when contrast passes", () => {
    const fix = buildFixRecommendation({
      ratio: 5,
      requiredAa: 4.5,
      largeText: false,
      fontSize: 16,
      fontWeight: 400,
      foregroundHex: "#000000",
      backgroundHex: "#FFFFFF",
      foreground: { r: 0, g: 0, b: 0, a: 1 },
      background: { r: 1, g: 1, b: 1, a: 1 },
    });

    assert.match(fix.problem, /ок/i);
  });

  it("shows typography hint for white on danger without background advice", () => {
    const foreground = { r: 1, g: 1, b: 1, a: 1 };
    const background = { r: 244 / 255, g: 69 / 255, b: 53 / 255, a: 1 };

    assert.equal(suggestM2TextToken(foreground, background, 4.5), null);

    const fix = buildFixRecommendation({
      ratio: 3.65,
      requiredAa: 4.5,
      largeText: false,
      fontSize: 16,
      fontWeight: 400,
      foregroundHex: "#FFFFFF",
      backgroundHex: "#F44535",
      foreground,
      background,
    });

    assert.match(fix.problem, /3\.65:1/);
    assert.doesNotMatch(fix.action, /фон/i);
    assert.doesNotMatch(fix.action, /Затемни|Осветли/i);
    assert.match(fix.action, /promo-h4/);
  });
});
