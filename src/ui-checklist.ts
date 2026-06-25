import type { ContrastReport } from "./analyze";
import {
  CHECKLIST_ITEMS,
  CONTRAST_ITEM_ID,
  goToQuestion,
  isQuizComplete,
  loadChecklistState,
  saveChecklistState,
  type ChecklistState,
} from "./checklist-state";
import { applyContrastReport, handleChecklistBlur, handleChecklistClick } from "./ui-checklist-actions";
import { renderChecklistBody } from "./ui-checklist-render";
import { createContrastSession, type ContrastSessionState } from "./ui-contrast-session";
import { el, replaceChildren } from "./ui-dom";

type ChecklistOptions = {
  onRunContrastCheck: () => void;
  onSelectNode: (nodeId: string) => void;
};

export type ChecklistView = {
  mount(container: HTMLElement): void;
  refresh(): void;
  setContrastReport(report: ContrastReport): void;
};

export function createChecklistView(options: ChecklistOptions): ChecklistView {
  let root: HTMLElement | null = null;
  let bodyEl: HTMLElement | null = null;
  let state = loadChecklistState();

  if (isQuizComplete(state) && !state.records[CONTRAST_ITEM_ID] && state.view !== "results") {
    state = {
      ...goToQuestion(state, CHECKLIST_ITEMS.length - 1),
      view: "quiz",
    };
    saveChecklistState(state);
  }

  let contrast: ContrastSessionState = createContrastSession();

  function persist(next: ChecklistState): void {
    state = next;
    saveChecklistState(state);
    render();
  }

  const handlers = {
    onRunContrastCheck: options.onRunContrastCheck,
    onSelectNode: options.onSelectNode,
    persist,
    render,
    getState: () => state,
    getContrast: () => contrast,
    setContrast: (patch: Partial<ContrastSessionState>) => {
      contrast = { ...contrast, ...patch };
    },
    setState: (next: ChecklistState) => {
      state = next;
    },
  };

  function render(): void {
    if (!bodyEl) return;
    replaceChildren(bodyEl, renderChecklistBody({ state, contrast }));
  }

  function mount(container: HTMLElement): void {
    root = el("div", { className: "checklist-view" }, el("div", { className: "checklist-body" }));
    bodyEl = root.querySelector(".checklist-body") as HTMLElement;
    root.addEventListener("click", (event) => handleChecklistClick(event, root, handlers));
    root.addEventListener("blur", (event) => handleChecklistBlur(event, handlers), true);
    container.appendChild(root);
    render();
  }

  function setContrastReport(report: ContrastReport): void {
    applyContrastReport(report, handlers);
  }

  return { mount, refresh: render, setContrastReport };
}
