chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    // Inject CSS first (built by Vite into assets/content.css)
    try {
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["assets/content.css"] });
    } catch (_) {}

    // Inject the content script that mounts the panel
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
  } catch (e) {
    console.error("Buddy injection failed:", e);
  }
});


