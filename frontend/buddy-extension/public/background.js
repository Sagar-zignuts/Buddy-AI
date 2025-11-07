chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    // First try to toggle using existing script (no reinjection)
    const [{ result: toggled } = { result: false }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        try {
          if (window.__buddyTogglePanel) { window.__buddyTogglePanel(); return true; }
        } catch(e) {}
        return false;
      },
    });
    if (toggled) return;

    // Inject CSS then script
    try {
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ["assets/content.css"] });
    } catch (_) {}
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    // After injection, call toggle to mount once
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => { try { window.__buddyTogglePanel && window.__buddyTogglePanel(); } catch(e) {} },
      });
    } catch (_) {}
  } catch (e) {
    console.error("Buddy injection failed:", e);
  }
});


