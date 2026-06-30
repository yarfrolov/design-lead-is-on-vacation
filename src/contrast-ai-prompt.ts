import type { ContrastDesignContext } from "./extract-contrast-context";

export function buildContrastAiMessages(
  context: ContrastDesignContext
): Array<{ role: "system" | "user"; content: string }> {
  const system = `Ты эксперт по доступности и WCAG 2.1. Проверь контраст текста на макете.

Пороги WCAG AA:
- Обычный текст: минимум 4.5:1
- Крупный текст (≥24px или ≥18.5px жирный): минимум 3:1

Пороги AAA:
- Обычный текст: 7:1
- Крупный текст: 4.5:1

Правила:
- Оцени каждый текстовый элемент из списка entries.
- Используй foregroundHex, backgroundHex, ratioLabel, largeText, requiredAa и requiredAaa.
- Если есть warning — фон приблизительный, учти это в comment.
- passesAa: true — соответствует WCAG AA; false — не соответствует.
- passesAaa: true — соответствует WCAG AAA; false — не соответствует.
- comment: коротко на русском (1–2 предложения) — что не так или почему ок.
- Верни оценку для каждого key из entries.
- Верни ТОЛЬКО валидный JSON без markdown.

Формат ответа:
{
  "items": [{ "key": "<key>", "passesAa": true|false, "passesAaa": true|false, "comment": "..." }],
  "summary": "Общий вывод в 2–4 предложения"
}`;

  const user = JSON.stringify(
    {
      page: context.pageName,
      entries: context.entries,
    },
    null,
    0
  );

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
