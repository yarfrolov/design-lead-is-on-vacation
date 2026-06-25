import { unwrapUiMessage } from "./src/messages";
import { createChecklistView } from "./src/ui-checklist";

function postToPlugin(message: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

const modeContent = document.getElementById("mode-content")!;

const checklistView = createChecklistView({
  onRunContrastCheck: () => postToPlugin({ type: "run-contrast-check" }),
  onSelectNode: (nodeId) => postToPlugin({ type: "select-node", nodeId }),
});

checklistView.mount(modeContent);

window.onmessage = (event: MessageEvent) => {
  const msg = unwrapUiMessage(event);
  if (msg) {
    checklistView.setContrastReport(msg.report);
  }
};
