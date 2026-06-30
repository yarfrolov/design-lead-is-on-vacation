import type { LlmConfig } from "./ai-review-client";
import { isLlmConfigured } from "./ai-review-client";

export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return JSON.parse(fenced[1].trim());
    }
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Модель вернула ответ не в формате JSON");
  }
}

export async function fetchLlmChat(
  config: LlmConfig,
  messages: Array<{ role: "system" | "user"; content: string }>,
  maxTokens = 4096
): Promise<string> {
  if (!isLlmConfigured(config)) {
    throw new Error("Не настроен доступ к LLM. Укажите URL, токен и модель.");
  }

  const baseUrl = config.apiUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/v1/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`LLM API ${response.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Пустой ответ от LLM API");
  }

  return content;
}
