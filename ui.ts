import { runAiReview, loadLlmConfig } from "./src/ai-review-client";
import type { DesignContext } from "./src/extract-design";
import { unwrapUiMessage } from "./src/messages";
import { createChecklistView } from "./src/ui-checklist";

function postToPlugin(message: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

const modeContent = document.getElementById("mode-content")!;

const checklistView = createChecklistView({
  onRunContrastCheck: () => postToPlugin({ type: "run-contrast-check" }),
  onRunAiReview: () => postToPlugin({ type: "run-ai-review" }),
  onSelectNode: (nodeId) => postToPlugin({ type: "select-node", nodeId }),
});

checklistView.mount(modeContent);

async function handleDesignContext(context: DesignContext): Promise<void> {
  const config = loadLlmConfig();
  try {
    const report = await runAiReview(context, config);
    checklistView.setAiReviewReport(report);
  } catch (error) {
    checklistView.setAiReviewError(
      error instanceof Error ? error.message : "Не удалось выполнить AI-проверку"
    );
  }
}

window.onmessage = (event: MessageEvent) => {
  const msg = unwrapUiMessage(event);
  if (!msg) return;

  if (msg.type === "report") {
    checklistView.setContrastReport(msg.report);
    return;
  }

  if (msg.type === "design-context") {
    void handleDesignContext(msg.context);
  }
};
