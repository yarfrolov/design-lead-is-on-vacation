import { CHECKLIST_ITEMS, buildTodoText, type ChecklistItem } from "./checklist-data";

export type ChecklistAnswer = "yes" | "no";

export type ChecklistRecord = {
  itemId: string;
  answer: ChecklistAnswer;
  comment: string;
  answeredAt: number;
};

export const CONTRAST_ITEM_ID = "contrast-ok";

export type ChecklistState = {
  currentIndex: number;
  records: Record<string, ChecklistRecord>;
  view: "quiz" | "todo" | "results";
};

const STORAGE_KEY = "design-lead-checklist-v2";

export function createInitialState(): ChecklistState {
  return {
    currentIndex: 0,
    records: {},
    view: "quiz",
  };
}

export function loadChecklistState(): ChecklistState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as ChecklistState;
    const currentIndex = Math.max(
      0,
      Math.min(parsed.currentIndex ?? 0, CHECKLIST_ITEMS.length)
    );
    return {
      currentIndex,
      records: parsed.records ?? {},
      view: parsed.view === "todo" ? "todo" : parsed.view === "results" ? "results" : "quiz",
    };
  } catch {
    return createInitialState();
  }
}

export function saveChecklistState(state: ChecklistState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Pixso UI sandbox may block localStorage — keep in-memory state only.
  }
}

export function getCurrentItem(state: ChecklistState): ChecklistItem | null {
  return CHECKLIST_ITEMS[state.currentIndex] ?? null;
}

export function isQuizComplete(state: ChecklistState): boolean {
  return state.currentIndex >= CHECKLIST_ITEMS.length;
}

export type TodoItem = {
  item: ChecklistItem;
  record: ChecklistRecord;
  todo: string;
};

export function getTodoItems(state: ChecklistState): TodoItem[] {
  return CHECKLIST_ITEMS.filter((item) => state.records[item.id]?.answer === "no").map(
    (item) => {
      const record = state.records[item.id];
      return {
        item,
        record,
        todo: buildTodoText(item),
      };
    }
  );
}

export function getTodoBySection(state: ChecklistState): Map<string, TodoItem[]> {
  const grouped = new Map<string, TodoItem[]>();
  for (const todo of getTodoItems(state)) {
    const list = grouped.get(todo.item.section) ?? [];
    list.push(todo);
    grouped.set(todo.item.section, list);
  }
  return grouped;
}

export function isContrastItem(item: ChecklistItem): boolean {
  return item.id === CONTRAST_ITEM_ID;
}

export function answerCurrent(
  state: ChecklistState,
  answer: ChecklistAnswer,
  comment = ""
): ChecklistState {
  const item = getCurrentItem(state);
  if (!item || isContrastItem(item)) return state;

  return {
    ...state,
    records: {
      ...state.records,
      [item.id]: {
        itemId: item.id,
        answer,
        comment: answer === "no" ? comment.trim() : "",
        answeredAt: Date.now(),
      },
    },
    currentIndex: state.currentIndex + 1,
    view: "quiz",
  };
}

export function completeContrastCheck(state: ChecklistState): ChecklistState {
  return {
    ...state,
    currentIndex: CHECKLIST_ITEMS.length,
    view: "results",
    records: {
      ...state.records,
      [CONTRAST_ITEM_ID]: {
        itemId: CONTRAST_ITEM_ID,
        answer: "yes",
        comment: "",
        answeredAt: Date.now(),
      },
    },
  };
}

export function resetChecklist(): ChecklistState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return createInitialState();
}

export function updateComment(state: ChecklistState, itemId: string, comment: string): ChecklistState {
  const record = state.records[itemId];
  if (!record || record.answer !== "no") return state;

  return {
    ...state,
    records: {
      ...state.records,
      [itemId]: { ...record, comment: comment.trim() },
    },
  };
}

export function goToQuestion(state: ChecklistState, index: number): ChecklistState {
  const clamped = Math.max(0, Math.min(index, CHECKLIST_ITEMS.length - 1));
  return { ...state, currentIndex: clamped, view: "quiz" };
}

export function hasAnyAnswers(state: ChecklistState): boolean {
  return Object.keys(state.records).length > 0;
}

export function shouldShowStartScreen(state: ChecklistState): boolean {
  return state.view === "quiz" && state.currentIndex === 0 && !hasAnyAnswers(state);
}

export function applyAiReviewToChecklist(
  state: ChecklistState,
  items: Array<{ id: string; answer: "yes" | "no" | "unknown"; comment: string }>
): ChecklistState {
  const records = { ...state.records };

  for (const item of items) {
    if (item.answer === "unknown") continue;
    records[item.id] = {
      itemId: item.id,
      answer: item.answer,
      comment: item.answer === "no" ? item.comment.trim() : "",
      answeredAt: Date.now(),
    };
  }

  const firstUnanswered = CHECKLIST_ITEMS.findIndex((item) => !records[item.id]);

  return {
    ...state,
    records,
    currentIndex: firstUnanswered >= 0 ? firstUnanswered : CHECKLIST_ITEMS.length,
    view: firstUnanswered >= 0 ? "quiz" : "results",
  };
}

export { CHECKLIST_ITEMS };
