import type { ContrastReport } from "./analyze";
import {
  answerCurrent,
  applyAiReviewToChecklist,
  completeContrastCheck,
  goToQuestion,
  resetChecklist,
  saveChecklistState,
  updateComment,
  type ChecklistState,
} from "./checklist-state";
import type { ContrastSessionState } from "./ui-contrast-session";
import type { AiReviewSessionState } from "./ui-ai-review-session";
import { clearContrastReport, saveContrastReport } from "./ui-contrast-session";
import { clearAiReviewReport, saveAiReviewReport } from "./ui-ai-review-session";
import { copyAiReviewListText } from "./ai-review-render";
import { copyTextToClipboard, copyTodoListText } from "./ui-checklist-render";

export type ChecklistActionHandlers = {
  onRunContrastCheck: () => void;
  onRunAiReview: () => void;
  onSelectNode: (nodeId: string) => void;
  persist: (next: ChecklistState) => void;
  render: () => void;
  getState: () => ChecklistState;
  getContrast: () => ContrastSessionState;
  getAiReview: () => AiReviewSessionState;
  setContrast: (patch: Partial<ContrastSessionState>) => void;
  setAiReview: (patch: Partial<AiReviewSessionState>) => void;
  setState: (next: ChecklistState) => void;
  setManualStarted: (value: boolean) => void;
  getManualStarted: () => boolean;
};

function startAiReview(handlers: ChecklistActionHandlers): void {
  handlers.setContrast({ onlyView: false, pending: true, error: null });
  handlers.setAiReview({ onlyView: true, pending: true, error: null });
  handlers.render();
  handlers.onRunAiReview();
}

export function handleChecklistClick(
  event: Event,
  root: HTMLElement | null,
  handlers: ChecklistActionHandlers
): void {
  const target = (event.target as HTMLElement).closest(
    "[data-answer], [data-action], [data-contrast-tab], [data-ai-tab], .card[data-node-id]"
  ) as HTMLElement | null;
  if (!target || !root?.contains(target)) return;

  if (target.classList.contains("card") && target.dataset.nodeId) {
    handlers.onSelectNode(target.dataset.nodeId);
    return;
  }

  const contrastTabBtn = target.closest("[data-contrast-tab]") as HTMLElement | null;
  if (contrastTabBtn?.dataset.contrastTab) {
    handlers.setContrast({
      tab: contrastTabBtn.dataset.contrastTab as "issues" | "passed",
    });
    handlers.render();
    return;
  }

  const aiTabBtn = target.closest("[data-ai-tab]") as HTMLElement | null;
  if (aiTabBtn?.dataset.aiTab) {
    handlers.setAiReview({
      tab: aiTabBtn.dataset.aiTab as "issues" | "passed" | "unknown",
    });
    handlers.render();
    return;
  }

  if (target.dataset.answer) {
    handlers.setManualStarted(true);
    handlers.persist(answerCurrent(handlers.getState(), target.dataset.answer as "yes" | "no"));
    return;
  }

  const state = handlers.getState();
  const contrast = handlers.getContrast();
  const aiReview = handlers.getAiReview();

  switch (target.dataset.action) {
    case "start-manual":
      handlers.setManualStarted(true);
      handlers.render();
      break;
    case "run-ai-review":
      startAiReview(handlers);
      break;
    case "refresh-ai-review":
      startAiReview(handlers);
      break;
    case "apply-ai-review": {
      if (!aiReview.report) break;
      handlers.setAiReview({ onlyView: false });
      handlers.persist(applyAiReviewToChecklist(state, aiReview.report.items));
      break;
    }
    case "prev":
      if (state.currentIndex > 0) {
        handlers.persist(goToQuestion(state, state.currentIndex - 1));
      }
      break;
    case "show-todo":
      handlers.setContrast({ onlyView: false });
      handlers.setAiReview({ onlyView: false });
      handlers.persist({ ...state, view: "todo" });
      break;
    case "back-quiz":
      handlers.setContrast({ onlyView: false });
      handlers.setAiReview({ onlyView: false, pending: false });
      handlers.persist({ ...state, view: "quiz" });
      break;
    case "contrast-only":
      handlers.setAiReview({ onlyView: false, pending: false });
      handlers.setContrast({ onlyView: true, pending: true, error: null });
      handlers.render();
      handlers.onRunContrastCheck();
      break;
    case "run-contrast":
      handlers.setAiReview({ pending: false });
      handlers.setContrast({ onlyView: false, pending: true, error: null });
      handlers.render();
      handlers.onRunContrastCheck();
      break;
    case "refresh-contrast":
      handlers.setContrast({ pending: true, error: null });
      handlers.render();
      handlers.onRunContrastCheck();
      break;
    case "restart":
    case "reset":
      if (confirm("Сбросить все ответы чек-листа?")) {
        clearContrastReport();
        clearAiReviewReport();
        handlers.setContrast({
          report: null,
          pending: false,
          tab: "issues",
          onlyView: false,
          error: null,
        });
        handlers.setAiReview({
          report: null,
          pending: false,
          tab: "issues",
          onlyView: false,
          error: null,
        });
        handlers.setManualStarted(false);
        handlers.persist(resetChecklist());
      }
      break;
    case "copy":
      void copyTextToClipboard(copyTodoListText(state));
      break;
    case "copy-ai-review":
      if (aiReview.report) {
        void copyTextToClipboard(copyAiReviewListText(aiReview.report));
      }
      break;
  }
}

export function handleChecklistBlur(
  event: Event,
  handlers: Pick<ChecklistActionHandlers, "getState" | "setState">
): void {
  const target = event.target as HTMLTextAreaElement;
  if (!target.classList.contains("todo-comment")) return;
  const itemId = target.dataset.itemId;
  if (!itemId) return;

  const next = updateComment(handlers.getState(), itemId, target.value);
  handlers.setState(next);
  saveChecklistState(next);
}

export function applyContrastReport(
  report: ContrastReport,
  handlers: ChecklistActionHandlers
): void {
  saveContrastReport(report);
  const contrast = handlers.getContrast();
  handlers.setContrast({
    report,
    pending: false,
    error: null,
    onlyView: contrast.onlyView,
  });

  const state = handlers.getState();
  const aiReview = handlers.getAiReview();

  if (!contrast.onlyView && state.view !== "results" && !aiReview.onlyView) {
    const next = completeContrastCheck(state);
    handlers.setState(next);
    saveChecklistState(next);
  }

  handlers.render();
}

export function applyAiReviewReportToSession(
  report: import("./ai-review-types").AiReviewReport,
  handlers: ChecklistActionHandlers
): void {
  saveAiReviewReport(report);
  handlers.setAiReview({ report, pending: false, error: null, onlyView: true });
  handlers.render();
}
