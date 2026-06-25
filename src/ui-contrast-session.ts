import type { ContrastReport } from "./analyze";

const SESSION_KEY = "design-lead-contrast-v1";

export type ContrastSessionState = {
  report: ContrastReport | null;
  tab: "issues" | "passed";
  pending: boolean;
  onlyView: boolean;
};

export function createContrastSession(): ContrastSessionState {
  return {
    report: loadContrastReport(),
    tab: "issues",
    pending: false,
    onlyView: false,
  };
}

export function loadContrastReport(): ContrastReport | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ContrastReport;
  } catch {
    return null;
  }
}

export function saveContrastReport(report: ContrastReport): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(report));
  } catch {
    // sessionStorage may be unavailable in sandbox — keep in-memory only.
  }
}

export function clearContrastReport(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

export function emptyReasonMessage(reason: NonNullable<ContrastReport["emptyReason"]>): string {
  if (reason === "no-frames") {
    return "На странице нет макетов для проверки. Добавь frame на текущую страницу.";
  }
  return "В макетах на странице нет текстовых слоёв с содержимым.";
}
