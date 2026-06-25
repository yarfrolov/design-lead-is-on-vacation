import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  CONTRAST_ITEM_ID,
  answerCurrent,
  completeContrastCheck,
  createInitialState,
  getTodoItems,
  isQuizComplete,
} from "../src/checklist-state.ts";

describe("checklist-state", () => {
  it("advances quiz on yes/no answers", () => {
    let state = createInitialState();
    state = answerCurrent(state, "yes");
    assert.equal(state.currentIndex, 1);
    state = answerCurrent(state, "no");
    assert.equal(state.currentIndex, 2);
    assert.equal(getTodoItems(state).length, 1);
  });

  it("does not answer contrast item via yes/no", () => {
    let state = createInitialState();
    for (let i = 0; i < 39; i += 1) {
      state = answerCurrent(state, "yes");
    }
    assert.equal(state.currentIndex, 39);
    const before = state.currentIndex;
    state = answerCurrent(state, "yes");
    assert.equal(state.currentIndex, before);
  });

  it("completes quiz after contrast check", () => {
    let state = createInitialState();
    for (let i = 0; i < 39; i += 1) {
      state = answerCurrent(state, "yes");
    }
    assert.equal(isQuizComplete(state), false);
    state = completeContrastCheck(state);
    assert.equal(isQuizComplete(state), true);
    assert.equal(state.view, "results");
    assert.equal(state.records[CONTRAST_ITEM_ID]?.answer, "yes");
  });
});
