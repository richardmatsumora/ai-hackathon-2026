// Opens the side panel when the extension action button is clicked.
// Content script can also trigger this via chrome.runtime.sendMessage.
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Allow content script to open the panel and pass context (selected date/time)
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === 'OPEN_PANEL' && sender.tab?.id) {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    // Store context so panel.js can read it on load
    chrome.storage.session.set({ pendingContext: msg.context ?? null });
  }
});
