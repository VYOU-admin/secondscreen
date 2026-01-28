(() => {
  // Runs on your Vercel site. Copies ss_token (from localStorage)
  // into chrome.storage.local so ESPN+ injection can use it.
  try {
    const t = localStorage.getItem("ss_token");
    if (t && t.includes(".")) {
      chrome.storage.local.set({ SS_TOKEN: t }, () => {});
      console.log("[SecondScreen] Token synced to extension storage.");
    } else {
      // If logged out, clear stored token
      chrome.storage.local.remove(["SS_TOKEN"], () => {});
    }
  } catch (e) {
    console.warn("[SecondScreen] token_sync failed", e);
  }
})();
