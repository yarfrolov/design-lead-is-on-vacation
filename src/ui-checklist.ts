import type { ContrastReport } from "./analyze";
import type { AiReviewReport } from "./ai-review-types";
import {
  CHECKLIST_ITEMS,
  CONTRAST_ITEM_ID,
  goToQuestion,
  isQuizComplete,
  loadChecklistState,
  saveChecklistState,
  shouldShowStartScreen,
  type ChecklistState,
} from "./checklist-state";
import {
  applyContrastReport,
  handleChecklistBlur,
  handleChecklistClick,
} from "./ui-checklist-actions";
import { renderChecklistBody } from "./ui-checklist-render";
import { createContrastSession, type ContrastSessionState } from "./ui-contrast-session";
import {
  createAiReviewSession,
  saveAiReviewReport,
  type AiReviewSessionState,
} from "./ui-ai-review-session";
import { loadLlmConfig } from "./ai-review-client";
import { el, replaceChildren } from "./ui-dom";

type ChecklistOptions = {
  onRunContrastCheck: () => void;
  onRunAiReview: () => void;
  onSelectNode: (nodeId: string) => void;
};

export type ChecklistView = {
  mount(container: HTMLElement): void;
  refresh(): void;
  setContrastReport(report: ContrastReport): void;
  setContrastError(message: string): void;
  setAiReviewReport(report: AiReviewReport): void;
  setAiReviewError(message: string): void;
};

export function createChecklistView(options: ChecklistOptions): ChecklistView {
  let root: HTMLElement | null = null;
  let bodyEl: HTMLElement | null = null;
  let state = loadChecklistState();
  let manualStarted = !shouldShowStartScreen(state);

  if (isQuizComplete(state) && !state.records[CONTRAST_ITEM_ID] && state.view !== "results") {
    state = {
      ...goToQuestion(state, CHECKLIST_ITEMS.length - 1),
      view: "quiz",
    };
    saveChecklistState(state);
  }

  let contrast: ContrastSessionState = createContrastSession();
  let aiReview: AiReviewSessionState = createAiReviewSession(loadLlmConfig());

  function persist(next: ChecklistState): void {
    state = next;
    saveChecklistState(state);
    render();
  }

  const handlers = {
    onRunContrastCheck: options.onRunContrastCheck,
    onRunAiReview: options.onRunAiReview,
    onSelectNode: options.onSelectNode,
    persist,
    render,
    getState: () => state,
    getContrast: () => contrast,
    getAiReview: () => aiReview,
    setContrast: (patch: Partial<ContrastSessionState>) => {
      contrast = { ...contrast, ...patch };
    },
    setAiReview: (patch: Partial<AiReviewSessionState>) => {
      aiReview = { ...aiReview, ...patch };
    },
    setState: (next: ChecklistState) => {
      state = next;
    },
    setManualStarted: (value: boolean) => {
      manualStarted = value;
    },
    getManualStarted: () => manualStarted,
  };

  function render(): void {
    if (!bodyEl) return;
    replaceChildren(
      bodyEl,
      renderChecklistBody({ state, contrast, aiReview, manualStarted })
    );
    const video = bodyEl.querySelector(".loader-video") as HTMLVideoElement | null;
    if (video?.src) {
      video.load();
      void video.play().catch(() => {});
    }
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

  function setAiReviewReport(report: AiReviewReport): void {
    saveAiReviewReport(report);
    aiReview = { ...aiReview, report, pending: false, error: null, onlyView: true };
    render();
  }

  function setAiReviewError(message: string): void {
    aiReview = { ...aiReview, pending: false, error: message, onlyView: true };
    render();
  }

  function setContrastError(message: string): void {
    contrast = { ...contrast, pending: false, error: message };
    render();
  }

  return {
    mount,
    refresh: render,
    setContrastReport,
    setContrastError,
    setAiReviewReport,
    setAiReviewError,
  };
}
