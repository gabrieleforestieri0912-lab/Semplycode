if (chrome.sidePanel) {
  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error("Side panel setup failed:", error));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "AUTH_STATE_CHANGED") {
    try {
      chrome.runtime.sendMessage({ type: "AUTH_UPDATE", payload: message.payload });
    } catch {
      // No listener available, ignore
    }
  }
  // Google OAuth removed from extension. All OAuth flows are handled via the web app
  // and the extension uses the email magic-code flow. Keep this listener focused
  // on relaying auth state updates between extension parts.
});
