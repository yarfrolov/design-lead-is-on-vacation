import type { ContrastReport } from "./analyze";
import {
  CHECKLIST_ITEMS,
  getCurrentItem,
  getTodoBySection,
  getTodoItems,
  isContrastItem,
  isQuizComplete,
  type ChecklistState,
} from "./checklist-state";
import { renderContrastPanel } from "./contrast-render";
import type { ContrastSessionState } from "./ui-contrast-session";
import { backChevronSvg, button, el } from "./ui-dom";
import { pluralize } from "./ui-pluralize";

export type ChecklistRenderInput = {
  state: ChecklistState;
  contrast: ContrastSessionState;
};

function renderQuizMeta(state: ChecklistState): HTMLElement {
  const item = getCurrentItem(state);
  const section = item?.section ?? "";

  return el(
    "div",
    { className: "quiz-meta" },
    el("span", { className: "quiz-section", textContent: section }),
    el(
      "div",
      { className: "quiz-meta-links" },
      button("Проверить контраст", { className: "meta-link", "data-action": "contrast-only" }),
      button(`Доработки (${getTodoItems(state).length})`, {
        className: "meta-link",
        "data-action": "show-todo",
      })
    )
  );
}

function renderQuizHeader(criterion: string, index: number): HTMLElement {
  const header = el("div", { className: "quiz-header" });

  if (index > 0) {
    header.appendChild(
      el(
        "button",
        {
          type: "button",
          className: "btn-back",
          "data-action": "prev",
          "aria-label": "Назад",
        },
        backChevronSvg()
      )
    );
  }

  header.appendChild(el("h3", { className: "quiz-question", textContent: criterion }));
  return header;
}

function renderQuizProgress(index: number): HTMLElement {
  const progress = Math.round((index / CHECKLIST_ITEMS.length) * 100);
  return el(
    "div",
    { className: "quiz-progress" },
    el(
      "div",
      { className: "quiz-progress-bar" },
      el("div", { className: "quiz-progress-fill", style: `width:${progress}%` })
    ),
    el("span", {
      className: "quiz-progress-label",
      textContent: `${index + 1} / ${CHECKLIST_ITEMS.length}`,
    })
  );
}

function renderQuizPanel(state: ChecklistState, footer: HTMLElement): HTMLElement {
  const item = getCurrentItem(state);
  if (!item) return el("div");

  const scroll = el(
    "div",
    { className: "panel-scroll" },
    renderQuizProgress(state.currentIndex),
    renderQuizMeta(state),
    renderQuizHeader(item.criterion, state.currentIndex),
    el("p", { className: "quiz-hint", textContent: item.check })
  );

  return el("div", { className: "panel-view" }, scroll, el("div", { className: "panel-footer" }, footer));
}

function renderYesNoFooter(): HTMLElement {
  return el(
    "div",
    { className: "quiz-actions" },
    button("Да", { className: "btn btn-yes", "data-answer": "yes" }),
    button("Нет", { className: "btn btn-no", "data-answer": "no" })
  );
}

function renderContrastFooter(pending: boolean): HTMLElement {
  return el(
    "div",
    { className: "quiz-actions quiz-actions-single" },
    button(pending ? "Проверяем…" : "Проверить контраст", {
      className: "btn btn-check-contrast",
      "data-action": "run-contrast",
      disabled: pending,
    })
  );
}

function renderTodoCards(state: ChecklistState): HTMLElement {
  const grouped = getTodoBySection(state);
  const todos = getTodoItems(state);
  const container = el("div");

  if (todos.length === 0) {
    container.appendChild(
      el("div", { className: "empty empty-inline" },
        el("p", { textContent: "Нет доработок по чек-листу." })
      )
    );
    return container;
  }

  for (const [section, items] of grouped) {
    container.appendChild(
      el("div", { className: "section-title", textContent: `${section} (${items.length})` })
    );
    for (const { item, record } of items) {
      container.appendChild(
        el(
          "div",
          { className: "todo-card" },
          el("div", { className: "todo-criterion", textContent: item.criterion }),
          el("div", { className: "todo-check", textContent: item.check }),
          el("label", { className: "todo-comment-label", textContent: "Комментарий" }),
          el("textarea", {
            className: "todo-comment",
            "data-item-id": item.id,
            placeholder: "Что именно нужно исправить…",
            textContent: record.comment,
          })
        )
      );
    }
  }

  return container;
}

function renderResults(state: ChecklistState, contrast: ContrastSessionState): HTMLElement {
  const todos = getTodoItems(state);

  return el(
    "div",
    { className: "panel-view" },
    el(
      "div",
      { className: "panel-scroll results" },
      el(
        "div",
        { className: "results-section" },
        el("h2", { className: "results-title", textContent: `Доработки (${todos.length})` }),
        renderTodoCards(state)
      ),
      el(
        "div",
        { className: "results-section" },
        el("h2", { className: "results-title", textContent: "Контраст" }),
        renderContrastPanel(contrast.report, contrast.tab, contrast.pending)
      )
    ),
    el(
      "div",
      { className: "panel-footer results-footer" },
      button("Скопировать доработки", { className: "btn", "data-action": "copy" }),
      button("Пройти заново", { className: "btn", "data-action": "restart" })
    )
  );
}

function renderTodoView(state: ChecklistState): HTMLElement {
  const todos = getTodoItems(state);

  if (todos.length === 0) {
    return el(
      "div",
      { className: "empty" },
      el("p", { textContent: "Пока нет доработок." }),
      el("p", {
        className: "empty-sub",
        textContent: "Ответ «Нет» на вопрос чек-листа добавит пункт сюда.",
      }),
      button("Вернуться к опросу", { className: "btn", "data-action": "back-quiz" })
    );
  }

  return el(
    "div",
    { className: "panel-view" },
    el(
      "div",
      { className: "panel-scroll" },
      el("div", {
        className: "todo-summary",
        textContent: `${todos.length} ${pluralize(todos.length, "доработка", "доработки", "доработок")}`,
      }),
      renderTodoCards(state)
    ),
    el(
      "div",
      { className: "panel-footer todo-footer" },
      button("К опросу", { className: "btn", "data-action": "back-quiz" }),
      button("Скопировать список", { className: "btn", "data-action": "copy" })
    )
  );
}

function renderContrastOnly(contrast: ContrastSessionState): HTMLElement {
  return el(
    "div",
    { className: "panel-view" },
    el(
      "div",
      { className: "panel-scroll" },
      el("h2", { className: "results-title", textContent: "Контраст" }),
      renderContrastPanel(contrast.report, contrast.tab, contrast.pending)
    ),
    el(
      "div",
      { className: "panel-footer" },
      button("К опросу", { className: "btn", "data-action": "back-quiz" })
    )
  );
}

function renderQuiz(state: ChecklistState, contrast: ContrastSessionState): HTMLElement {
  if (state.view === "results" || isQuizComplete(state)) {
    return renderResults(state, contrast);
  }

  const item = getCurrentItem(state);
  if (!item) return el("div");

  const footer = isContrastItem(item)
    ? renderContrastFooter(contrast.pending)
    : renderYesNoFooter();

  return renderQuizPanel(state, footer);
}

export function renderChecklistBody(input: ChecklistRenderInput): HTMLElement {
  const { state, contrast } = input;

  if (contrast.onlyView) {
    return renderContrastOnly(contrast);
  }

  if (state.view === "results") {
    return renderResults(state, contrast);
  }

  if (state.view === "todo") {
    return renderTodoView(state);
  }

  return renderQuiz(state, contrast);
}

export function copyTodoListText(state: ChecklistState): string {
  const lines = ["Чек-лист дизайнера — доработки", ""];
  for (const [section, items] of getTodoBySection(state)) {
    lines.push(`## ${section}`);
    for (const { item, record } of items) {
      lines.push(`- ${item.criterion}: ${item.check}`);
      if (record.comment) lines.push(`  Комментарий: ${record.comment}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const area = document.createElement("textarea");
  area.value = text;
  area.style.cssText = "position:fixed;left:-9999px";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  document.body.removeChild(area);
}
