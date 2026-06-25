import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { nearestM2Token, suggestM2BackgroundToken, suggestM2LargeTypography } from "../src/m2-token-match.ts";

describe("m2-token-match", () => {
  it("maps white text to primary-alt-bg", () => {
    const token = nearestM2Token({ r: 1, g: 1, b: 1, a: 1 }, "text");
    assert.equal(token.name, "primary-alt-bg");
  });

  it("maps danger red background to danger token", () => {
    const token = nearestM2Token({ r: 244 / 255, g: 69 / 255, b: 53 / 255, a: 1 }, "background");
    assert.match(token.name, /danger|color-red/);
  });

  it("suggests darker danger state for white-on-red", () => {
    const fix = suggestM2BackgroundToken(
      { r: 1, g: 1, b: 1, a: 1 },
      { r: 244 / 255, g: 69 / 255, b: 53 / 255, a: 1 },
      4.5
    );
    assert.ok(fix);
    assert.match(fix.to, /danger:(hover|active)|danger\.(hover|active)|danger-(hover|active)/);
  });

  it("suggests promo-h4 for 16px regular text near large threshold", () => {
    const hint = suggestM2LargeTypography(16, 400);
    assert.ok(hint);
    assert.match(hint, /promo-h4/);
  });
});
