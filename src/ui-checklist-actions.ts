import type { ContrastReport } from "./analyze";
import {
  answerCurrent,
  completeContrastCheck,
  goToQuestion,
  resetChecklist,
  saveChecklistState,
  updateComment,
  type ChecklistState,
} from "./checklist-state";
import type { ContrastSessionState } from "./ui-contrast-session";
import { clearContrastReport, saveContrastReport } from "./ui-contrast-session";
import { copyTextToClipboard, copyTodoListText } from "./ui-checklist-render";

export type ChecklistActionHandlers = {
  onRunContrastCheck: () => void;
  onSelectNode: (nodeId: string) => void;
  persist: (next: ChecklistState) => void;
  render: () => void;
  getState: () => ChecklistState;
  getContrast: () => ContrastSessionState;
  setContrast: (patch: Partial<ContrastSessionState>) => void;
  setState: (next: ChecklistState) => void;
};

export function handleChecklistClick(
  event: Event,
  root: HTMLElement | null,
  handlers: ChecklistActionHandlers
): void {
  const target = (event.target as HTMLElement).closest(
    "[data-answer], [data-action], [data-contrast-tab], .card[data-node-id]"
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

  if (target.dataset.answer) {
    handlers.persist(answerCurrent(handlers.getState(), target.dataset.answer as "yes" | "no"));
    return;
  }

  const state = handlers.getState();
  const contrast = handlers.getContrast();

  switch (target.dataset.action) {
    case "prev":
      if (state.currentIndex > 0) {
        handlers.persist(goToQuestion(state, state.currentIndex - 1));
      }
      break;
    case "show-todo":
      handlers.setContrast({ onlyView: false });
      handlers.persist({ ...state, view: "todo" });
      break;
    case "back-quiz":
      handlers.setContrast({ onlyView: false });
      handlers.persist({ ...state, view: "quiz" });
      break;
    case "contrast-only":
      handlers.setContrast({ onlyView: true, pending: true });
      handlers.render();
      handlers.onRunContrastCheck();
      break;
    case "run-contrast":
      handlers.setContrast({ onlyView: false, pending: true });
      handlers.render();
      handlers.onRunContrastCheck();
      break;
    case "refresh-contrast":
      handlers.setContrast({ pending: true });
      handlers.render();
      handlers.onRunContrastCheck();
      break;
    case "restart":
    case "reset":
      if (confirm("Сбросить все ответы чек-листа?")) {
        clearContrastReport();
        handlers.setContrast({
          report: null,
          pending: false,
          tab: "issues",
          onlyView: false,
        });
        handlers.persist(resetChecklist());
      }
      break;
    case "copy":
      void copyTextToClipboard(copyTodoListText(state));
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
  handlers.setContrast({ report, pending: false });

  const state = handlers.getState();
  const contrast = handlers.getContrast();

  if (!contrast.onlyView && state.view !== "results") {
    const next = completeContrastCheck(state);
    handlers.setState(next);
    saveChecklistState(next);
  }

  handlers.render();
}
