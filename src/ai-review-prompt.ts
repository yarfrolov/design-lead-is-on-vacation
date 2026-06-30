import { CHECKLIST_ITEMS } from "./checklist-data";
import { CONTRAST_ITEM_ID } from "./checklist-state";
import type { DesignContext } from "./extract-design";

export function buildAiReviewMessages(context: DesignContext): Array<{ role: "system" | "user"; content: string }> {
  const checklist = CHECKLIST_ITEMS.filter((item) => item.id !== CONTRAST_ITEM_ID).map((item) => ({
    id: item.id,
    section: item.section,
    criterion: item.criterion,
    check: item.check,
  }));

  const system = `Ты UX/UI ревьюер. По описанию макета оцени соответствие чек-листу дизайнера.

Правила:
- Отвечай только по тому, что можно вывести из макета (тексты, структура, компоненты, состояния).
- Если по макету нельзя проверить пункт (нужен контекст продукта, метрики, аналитика, роли) — answer: "unknown".
- answer: "yes" — критерий соблюдён; "no" — есть проблема; "unknown" — недостаточно данных.
- Для "no" и "unknown" дай короткий comment (1–2 предложения) на русском.
- Верни ТОЛЬКО валидный JSON без markdown.

Формат ответа:
{
  "items": [{ "id": "<id из чек-листа>", "answer": "yes"|"no"|"unknown", "comment": "..." }],
  "summary": "Общий вывод в 2–4 предложения"
}`;

  const user = JSON.stringify(
    {
      page: context.pageName,
      frames: context.frames,
      texts: context.textSummary,
      checklist,
    },
    null,
    0
  );

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
