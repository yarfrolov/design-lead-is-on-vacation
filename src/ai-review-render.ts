import { CHECKLIST_ITEMS } from "./checklist-data";
import type { AiReviewItem, AiReviewReport } from "./ai-review-types";
import { el, button } from "./ui-dom";
import type { LlmConfig } from "./ai-review-client";
import { isLlmConfigured } from "./ai-review-client";
import { renderContrastPanel } from "./contrast-render";
import type { ContrastSessionState } from "./ui-contrast-session";

function findChecklistMeta(id: string) {
  return CHECKLIST_ITEMS.find((item) => item.id === id);
}

function renderAiCard(item: AiReviewItem): HTMLElement {
  const meta = findChecklistMeta(item.id);
  const fail = item.answer === "no";
  const unknown = item.answer === "unknown";

  const badgeClass = fail ? "fail" : unknown ? "unknown" : "pass";
  const badgeText = fail ? "Не ок" : unknown ? "Неясно" : "Ок";
  const cardClass = fail ? "fail" : unknown ? "unknown" : "pass";

  const card = el(
    "div",
    { className: `card ai-card ${cardClass}` },
    el(
      "div",
      { className: "card-top" },
      el("div", { className: "card-title", textContent: meta?.criterion ?? item.id }),
      el("span", { className: `badge ${badgeClass}`, textContent: badgeText })
    ),
    el("div", { className: "ai-check", textContent: meta?.check ?? "" })
  );

  if (item.comment) {
    card.appendChild(el("div", { className: "ai-comment", textContent: item.comment }));
  }

  if (meta?.section) {
    card.appendChild(el("div", { className: "ai-section", textContent: meta.section }));
  }

  return card;
}

function filterItems(report: AiReviewReport, tab: "issues" | "passed" | "unknown"): AiReviewItem[] {
  if (tab === "issues") return report.items.filter((item) => item.answer === "no");
  if (tab === "passed") return report.items.filter((item) => item.answer === "yes");
  return report.items.filter((item) => item.answer === "unknown");
}

function groupBySection(items: AiReviewItem[]): Map<string, AiReviewItem[]> {
  const grouped = new Map<string, AiReviewItem[]>();
  for (const item of items) {
    const meta = findChecklistMeta(item.id);
    const section = meta?.section ?? "Прочее";
    const list = grouped.get(section) ?? [];
    list.push(item);
    grouped.set(section, list);
  }
  return grouped;
}

function formatSectionItems(items: AiReviewItem[]): string[] {
  const lines: string[] = [];
  for (const [section, sectionItems] of groupBySection(items)) {
    lines.push(`### ${section}`);
    for (const item of sectionItems) {
      const meta = findChecklistMeta(item.id);
      lines.push(`- ${meta?.criterion ?? item.id}: ${meta?.check ?? ""}`);
      if (item.comment) lines.push(`  Комментарий: ${item.comment}`);
    }
    lines.push("");
  }
  return lines;
}

export function copyAiReviewListText(report: AiReviewReport): string {
  const issues = filterItems(report, "issues");
  const unknown = filterItems(report, "unknown");
  const lines = ["Чек-лист дизайнера — AI-проверка", ""];

  if (report.summary) {
    lines.push(`Вывод: ${report.summary}`, "");
  }

  lines.push(`## Проблемы (${issues.length})`, "");
  if (issues.length === 0) {
    lines.push("Нет проблем.", "");
  } else {
    lines.push(...formatSectionItems(issues));
  }

  lines.push(`## Неясно (${unknown.length})`, "");
  if (unknown.length === 0) {
    lines.push("Нет неясных пунктов.", "");
  } else {
    lines.push(...formatSectionItems(unknown));
  }

  return lines.join("\n").trimEnd();
}

export function renderAiReviewList(
  report: AiReviewReport,
  tab: "issues" | "passed" | "unknown"
): HTMLElement {
  const container = el("div");
  const items = filterItems(report, tab);

  if (items.length === 0) {
    container.appendChild(
      el("div", {
        className: "empty empty-inline",
        textContent:
          tab === "issues"
            ? "Проблем по чек-листу не найдено."
            : tab === "passed"
              ? "Нет пунктов в этой вкладке."
              : "Все пункты оценены однозначно.",
      })
    );
    return container;
  }

  for (const item of items) {
    container.appendChild(renderAiCard(item));
  }

  return container;
}

export function renderAiReviewPanel(
  report: AiReviewReport | null,
  tab: "issues" | "passed" | "unknown",
  pending: boolean,
  error: string | null,
  config: LlmConfig
): HTMLElement {
  const panel = el("div");

  if (error) {
    panel.appendChild(el("div", { className: "ai-error", textContent: error }));
  }

  if (!isLlmConfigured(config) && !report && !pending) {
    panel.appendChild(
      el("div", { className: "empty empty-inline" },
        el("p", {
          textContent:
            "LLM не настроен. Укажи LLM_API_URL, LLM_TOKEN и LLM_MODEL в .env и пересобери плагин.",
        })
      )
    );
    return panel;
  }

  if (report) {
    if (report.summary) {
      panel.appendChild(el("div", { className: "ai-summary", textContent: report.summary }));
    }

    const issuesCount = report.items.filter((item) => item.answer === "no").length;
    const passedCount = report.items.filter((item) => item.answer === "yes").length;
    const unknownCount = report.items.filter((item) => item.answer === "unknown").length;

    panel.appendChild(
      el(
        "div",
        { className: "ai-tabs" },
        el(
          "div",
          { className: "tabs" },
          el("button", {
            type: "button",
            className: `tab${tab === "issues" ? " active" : ""}`,
            "data-ai-tab": "issues",
            textContent: `Проблемы (${issuesCount})`,
          }),
          el("button", {
            type: "button",
            className: `tab${tab === "passed" ? " active" : ""}`,
            "data-ai-tab": "passed",
            textContent: `Ок (${passedCount})`,
          }),
          el("button", {
            type: "button",
            className: `tab${tab === "unknown" ? " active" : ""}`,
            "data-ai-tab": "unknown",
            textContent: `Неясно (${unknownCount})`,
          })
        ),
        el("button", {
          type: "button",
          "data-action": "refresh-ai-review",
          disabled: pending,
          textContent: pending ? "Анализ…" : "Обновить",
        }),
        el("button", {
          type: "button",
          className: "meta-link ai-copy-link",
          "data-action": "copy-ai-review",
          textContent: "Скопировать",
        })
      )
    );

    panel.appendChild(el("div", { className: "ai-results" }, renderAiReviewList(report, tab)));
  } else if (!pending) {
    panel.appendChild(
      el("div", { className: "empty empty-inline" },
        el("p", {
          textContent: isLlmConfigured(config)
            ? "Запусти AI-проверку — модель оценит макет по чек-листу."
            : "LLM не настроен. Укажи переменные в .env и пересобери плагин.",
        })
      )
    );
  } else {
    panel.appendChild(
      el("div", { className: "empty empty-inline" },
        el("p", { textContent: "Анализируем макет…" })
      )
    );
  }

  return panel;
}

export function renderStartScreen(): HTMLElement {
  return el(
    "div",
    { className: "panel-view start-screen" },
    el(
      "div",
      { className: "start-hero" },
      el("h2", { className: "start-title", textContent: "Проверим макет?" }),
      el("p", {
        className: "start-sub",
        textContent: "Проанализируем артборд через videocat или вручную",
      })
    ),
    el(
      "div",
      { className: "panel-footer start-footer" },
      button("Проверить через ИИ", { className: "btn primary", "data-action": "run-ai-review" }),
      button("Проверить макет вручную", { className: "btn", "data-action": "start-manual" })
    )
  );
}

export function renderAiReviewOnly(
  session: {
    report: AiReviewReport | null;
    tab: "issues" | "passed" | "unknown";
    pending: boolean;
    error: string | null;
    config: LlmConfig;
  },
  contrast: ContrastSessionState
): HTMLElement {
  const footerButtons: HTMLElement[] = [
    button("К опросу", { className: "btn", "data-action": "back-quiz" }),
  ];

  if (session.report) {
    footerButtons.unshift(
      button("Применить к чек-листу", {
        className: "btn primary",
        "data-action": "apply-ai-review",
      })
    );
  } else if (!session.pending) {
    footerButtons.unshift(
      button(session.pending ? "Анализ…" : "Запустить проверку", {
        className: "btn primary",
        "data-action": "refresh-ai-review",
        disabled: session.pending,
      })
    );
  }

  const scrollChildren: HTMLElement[] = [
    el("h2", { className: "results-title", textContent: "AI-проверка" }),
    renderAiReviewPanel(
      session.report,
      session.tab,
      session.pending,
      session.error,
      session.config
    ),
  ];

  if (!session.pending && (contrast.report || contrast.error)) {
    scrollChildren.push(
      el(
        "div",
        { className: "results-section" },
        el("h2", { className: "results-title", textContent: "Контраст" }),
        renderContrastPanel(contrast.report, contrast.tab, false, true, contrast.error)
      )
    );
  }

  return el(
    "div",
    { className: "panel-view" },
    el("div", { className: "panel-scroll" }, ...scrollChildren),
    el("div", { className: "panel-footer results-footer" }, ...footerButtons)
  );
}
