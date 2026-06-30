import { buildAiReviewMessages } from "./ai-review-prompt";
import type { AiReviewReport, AiReviewItem } from "./ai-review-types";
import { CHECKLIST_ITEMS } from "./checklist-data";
import { CONTRAST_ITEM_ID } from "./checklist-state";
import type { DesignContext } from "./extract-design";
import { extractJson, fetchLlmChat } from "./llm-shared";

declare const __LLM_API_URL__: string;
declare const __LLM_TOKEN__: string;
declare const __LLM_MODEL__: string;

export type LlmConfig = {
  apiUrl: string;
  token: string;
  model: string;
};

export function getDefaultLlmConfig(): LlmConfig {
  return {
    apiUrl: typeof __LLM_API_URL__ !== "undefined" ? __LLM_API_URL__ : "",
    token: typeof __LLM_TOKEN__ !== "undefined" ? __LLM_TOKEN__ : "",
    model: typeof __LLM_MODEL__ !== "undefined" ? __LLM_MODEL__ : "gemma27b",
  };
}

export function loadLlmConfig(): LlmConfig {
  return getDefaultLlmConfig();
}

export function isLlmConfigured(config: LlmConfig): boolean {
  return Boolean(config.apiUrl && config.token && config.model);
}

function normalizeAnswer(value: unknown): AiReviewItem["answer"] {
  if (value === "yes" || value === "no" || value === "unknown") return value;
  return "unknown";
}

export function parseAiReviewResponse(raw: unknown, model: string): AiReviewReport {
  if (!raw || typeof raw !== "object") {
    throw new Error("Пустой ответ модели");
  }

  const data = raw as { items?: unknown; summary?: unknown };
  const validIds = new Set(
    CHECKLIST_ITEMS.filter((item) => item.id !== CONTRAST_ITEM_ID).map((item) => item.id)
  );
  const byId = new Map<string, AiReviewItem>();

  if (Array.isArray(data.items)) {
    for (const entry of data.items) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as { id?: unknown; answer?: unknown; comment?: unknown };
      if (typeof row.id !== "string" || !validIds.has(row.id)) continue;
      byId.set(row.id, {
        id: row.id,
        answer: normalizeAnswer(row.answer),
        comment: typeof row.comment === "string" ? row.comment.trim() : "",
      });
    }
  }

  const items: AiReviewItem[] = CHECKLIST_ITEMS.filter((item) => item.id !== CONTRAST_ITEM_ID).map(
    (item) =>
      byId.get(item.id) ?? {
        id: item.id,
        answer: "unknown",
        comment: "Модель не вернула оценку по этому пункту",
      }
  );

  return {
    items,
    summary: typeof data.summary === "string" ? data.summary.trim() : "",
    model,
    reviewedAt: Date.now(),
  };
}

export async function runAiReview(context: DesignContext, config: LlmConfig): Promise<AiReviewReport> {
  if (context.emptyReason === "no-frames") {
    throw new Error("На странице нет макетов для проверки");
  }

  if (!isLlmConfigured(config)) {
    throw new Error("Не настроен доступ к LLM. Укажите URL, токен и модель.");
  }

  const messages = buildAiReviewMessages(context);
  const content = await fetchLlmChat(config, messages);
  const parsed = extractJson(content);
  return parseAiReviewResponse(parsed, config.model);
}
