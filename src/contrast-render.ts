import type { ContrastIssue, ContrastReport } from "./analyze";
import { emptyReasonMessage } from "./ui-contrast-session";
import { el, text } from "./ui-dom";

function renderContrastCard(item: ContrastIssue): HTMLElement {
  const fail = !item.passesAa;
  const largeLabel = item.largeText ? "крупный" : "обычный";

  const fix = el("div", { className: "fix" },
    el("div", { className: "fix-problem", textContent: item.recommendation.problem }),
    el("div", { className: "fix-action", textContent: item.recommendation.action })
  );

  const metaParts = [
    text(`${item.fontSize}px, ${largeLabel}`),
    text(item.passesAaa ? " · AAA ✓" : ` · для AAA нужно ≥ ${item.requiredAaa}:1`),
  ];

  return el(
    "div",
    {
      className: `card ${fail ? "fail" : "pass"}`,
      "data-node-id": item.nodeId,
    },
    el(
      "div",
      { className: "card-top" },
      el("div", { className: "card-title", textContent: item.nodeName }),
      el("span", { className: `badge ${fail ? "fail" : "pass"}`, textContent: item.ratioLabel })
    ),
    el("div", { className: "sample", textContent: `«${item.sampleText}»` }),
    el(
      "div",
      { className: "colors" },
      el("div", { className: "swatch", style: `background:${item.foregroundHex}` }),
      el("span", { className: "color-label", textContent: item.foregroundHex }),
      text("→"),
      el("div", { className: "swatch", style: `background:${item.backgroundHex}` }),
      el("span", { className: "color-label", textContent: item.backgroundHex })
    ),
    fix,
    el("div", { className: "meta" }, ...metaParts)
  );
}

export function renderContrastList(
  report: ContrastReport,
  tab: "issues" | "passed"
): HTMLElement {
  const container = el("div");

  if (report.emptyReason) {
    container.appendChild(
      el("div", { className: "empty empty-inline" },
        el("p", { textContent: emptyReasonMessage(report.emptyReason) })
      )
    );
    return container;
  }

  const items = tab === "issues" ? report.issues : report.passed;

  if (items.length === 0) {
    container.appendChild(
      el("div", {
        className: "empty",
        textContent:
          tab === "issues"
            ? "Все проверенные тексты соответствуют WCAG AA."
            : "Нет элементов в этой вкладке.",
      })
    );
    return container;
  }

  const title =
    tab === "issues"
      ? `Не соответствует AA (${items.length})`
      : `Соответствует AA (${items.length})`;

  container.appendChild(el("div", { className: "section-title", textContent: title }));
  for (const item of items) {
    container.appendChild(renderContrastCard(item));
  }

  return container;
}

export function renderContrastPanel(
  report: ContrastReport | null,
  tab: "issues" | "passed",
  pending: boolean,
  showRefresh = true,
  error: string | null = null
): HTMLElement {
  const panel = el("div");

  if (error) {
    panel.appendChild(el("div", { className: "ai-error", textContent: error }));
  }

  if (report && showRefresh) {
    const tabsRow = el("div", { className: "contrast-tabs" },
      el(
        "div",
        { className: "tabs" },
        el("button", {
          type: "button",
          className: `tab${tab === "issues" ? " active" : ""}`,
          "data-contrast-tab": "issues",
          textContent: `Проблемы (${report.issues.length})`,
        }),
        el("button", {
          type: "button",
          className: `tab${tab === "passed" ? " active" : ""}`,
          "data-contrast-tab": "passed",
          textContent: `Пройдено (${report.passed.length})`,
        })
      ),
      el("button", {
        type: "button",
        "data-action": "refresh-contrast",
        disabled: pending,
        textContent: pending ? "Проверяем…" : "Обновить",
      })
    );
    panel.appendChild(tabsRow);
  } else if (!report) {
    panel.appendChild(
      el("button", {
        type: "button",
        className: "btn",
        "data-action": "refresh-contrast",
        disabled: pending,
        textContent: pending ? "Проверяем…" : "Проверить контраст",
      })
    );
  }

  const results = el("div", { className: "contrast-results" });
  if (report) {
    results.appendChild(renderContrastList(report, tab));
  } else {
    results.appendChild(
      el("div", { className: "empty empty-inline" },
        el("p", { textContent: pending ? "Проверяем…" : "Запусти проверку контраста." })
      )
    );
  }
  panel.appendChild(results);

  return panel;
}
