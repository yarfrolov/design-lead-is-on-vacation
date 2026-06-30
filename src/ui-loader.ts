import type { AiReviewSessionState } from "./ui-ai-review-session";
import type { ContrastSessionState } from "./ui-contrast-session";
import { el } from "./ui-dom";

declare const __LOADER_VIDEO_DATA_URL__: string;

function getLoaderVideoSrc(): string {
  return typeof __LOADER_VIDEO_DATA_URL__ !== "undefined" ? __LOADER_VIDEO_DATA_URL__ : "";
}

export function renderPendingLoader(message: string): HTMLElement {
  const video = el("video", {
    className: "loader-video",
    autoplay: true,
    loop: true,
    muted: true,
    playsInline: true,
    preload: "auto",
  }) as HTMLVideoElement;

  const src = getLoaderVideoSrc();
  if (src) {
    video.src = src;
  }

  video.setAttribute("aria-hidden", "true");

  return el(
    "div",
    { className: "panel-view loader-view" },
    el(
      "div",
      { className: "loader-stage" },
      video,
      el("div", { className: "loader-scrim" }),
      el("p", { className: "loader-label", textContent: message })
    )
  );
}

export function getPendingLoaderMessage(input: {
  contrast: ContrastSessionState;
  aiReview: AiReviewSessionState;
}): string | null {
  const { contrast, aiReview } = input;

  if (contrast.onlyView) {
    return contrast.pending ? "Проверяем контраст…" : null;
  }

  if (aiReview.onlyView) {
    if (aiReview.pending && contrast.pending) {
      return "Анализируем макет и контраст…";
    }
    if (aiReview.pending) return "Анализируем макет…";
    if (contrast.pending) return "Проверяем контраст…";
    return null;
  }

  if (contrast.pending) return "Проверяем контраст…";
  if (aiReview.pending) return "Анализируем макет…";
  return null;
}
