import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  contrastRatio,
  formatRatio,
  isLargeText,
  passesContrast,
  relativeLuminance,
  requiredRatio,
} from "../src/contrast.ts";

describe("contrast", () => {
  it("computes relative luminance for black and white", () => {
    assert.equal(relativeLuminance({ r: 0, g: 0, b: 0, a: 1 }), 0);
    assert.equal(relativeLuminance({ r: 1, g: 1, b: 1, a: 1 }), 1);
  });

  it("computes 21:1 for black on white", () => {
    const ratio = contrastRatio(
      { r: 0, g: 0, b: 0, a: 1 },
      { r: 1, g: 1, b: 1, a: 1 }
    );
    assert.equal(ratio, 21);
    assert.equal(formatRatio(ratio), "21.00:1");
  });

  it("detects large text thresholds", () => {
    assert.equal(isLargeText(24, 400), true);
    assert.equal(isLargeText(18.5, 700), true);
    assert.equal(isLargeText(18, 700), false);
    assert.equal(isLargeText(20, 400), false);
  });

  it("applies WCAG AA thresholds", () => {
    assert.equal(requiredRatio("AA", false), 4.5);
    assert.equal(requiredRatio("AA", true), 3);
    assert.equal(passesContrast(4.5, "AA", false), true);
    assert.equal(passesContrast(4.49, "AA", false), false);
    assert.equal(passesContrast(3, "AA", true), true);
  });
});
