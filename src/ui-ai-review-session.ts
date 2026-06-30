import type { AiReviewReport } from "./ai-review-types";
import type { LlmConfig } from "./ai-review-client";

const SESSION_KEY = "design-lead-ai-review-v1";

export type AiReviewSessionState = {
  report: AiReviewReport | null;
  tab: "issues" | "passed" | "unknown";
  pending: boolean;
  onlyView: boolean;
  error: string | null;
  config: LlmConfig;
};

export function createAiReviewSession(config: LlmConfig): AiReviewSessionState {
  return {
    report: loadAiReviewReport(),
    tab: "issues",
    pending: false,
    onlyView: false,
    error: null,
    config,
  };
}

export function loadAiReviewReport(): AiReviewReport | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AiReviewReport;
  } catch {
    return null;
  }
}

export function saveAiReviewReport(report: AiReviewReport): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(report));
  } catch {
    // sessionStorage may be unavailable — keep in-memory only.
  }
}

export function clearAiReviewReport(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
