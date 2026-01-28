(() => {
  const EXT_KEY = "ss_sidebar_prefs_v1";
  const DEFAULTS = { width: 380, collapsed: false };

  if (window.__SS_SIDEBAR_INJECTED__) return;
  window.__SS_SIDEBAR_INJECTED__ = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function isLikelyWatchPage() {
    const url = location.href;
    return url.includes("plus.espn.com") || url.includes("/watch") || url.includes("/video");
  }

  function buildSidebarUrl() {
  return "https://secondscreen-chi.vercel.app/extension/sidebar";
}


  function loadPrefs() {
    return new Promise((resolve) => {
      chrome.storage.local.get([EXT_KEY], (res) => {
        resolve({ ...DEFAULTS, ...(res[EXT_KEY] || {}) });
      });
    });
  }

  function savePrefs(prefs) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [EXT_KEY]: prefs }, () => resolve());
    });
  }

  function createSidebar(prefs) {
    const iframeUrl = buildSidebarUrl();

    const sidebar = document.createElement("div");
    sidebar.id = "ss-sidebar";
    sidebar.style.setProperty("--ss-width", `${prefs.width}px`);

    const resize = document.createElement("div");
    resize.id = "ss-resize";
    sidebar.appendChild(resize);

    const header = document.createElement("div");
    header.id = "ss-header";

    const title = document.createElement("div");
    title.id = "ss-title";
    title.innerHTML = `SecondScreen <span id="ss-pill">Loading…</span>`;

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "8px";

    const collapseBtn = document.createElement("button");
    collapseBtn.className = "ss-btn";
    collapseBtn.textContent = "Collapse";

    controls.appendChild(collapseBtn);

    header.appendChild(title);
    header.appendChild(controls);
    sidebar.appendChild(header);

    const iframe = document.createElement("iframe");
    iframe.id = "ss-iframe";
    iframe.src = iframeUrl;
    iframe.addEventListener("load", () => {
        chrome.storage.local.get(["SS_TOKEN"], (res) => {
            const token = res.SS_TOKEN || null;
            iframe.contentWindow?.postMessage({ type: "SS_TOKEN", token }, "*");
        });
    });

    
    iframe.allow = "autoplay; clipboard-read; clipboard-write";
    sidebar.appendChild(iframe);

    const launcher = document.createElement("div");
    launcher.id = "ss-launcher";
    launcher.textContent = "SS";

    collapseBtn.addEventListener("click", async () => {
      prefs.collapsed = true;
      await savePrefs(prefs);
      sidebar.remove();
      document.body.appendChild(launcher);
    });

    launcher.addEventListener("click", async () => {
      prefs.collapsed = false;
      await savePrefs(prefs);
      launcher.remove();
      document.body.appendChild(sidebar);
    });

    // Resize
    let isResizing = false;
    let startX = 0;
    let startWidth = prefs.width;

    resize.addEventListener("mousedown", (e) => {
      isResizing = true;
      startX = e.clientX;
      startWidth = prefs.width;
      document.documentElement.style.cursor = "ew-resize";
      e.preventDefault();
    });

    window.addEventListener("mousemove", async (e) => {
      if (!isResizing) return;
      const dx = startX - e.clientX;
      const newWidth = Math.min(720, Math.max(280, startWidth + dx));
      prefs.width = Math.round(newWidth);
      sidebar.style.setProperty("--ss-width", `${prefs.width}px`);
      await savePrefs(prefs);
    });

    window.addEventListener("mouseup", () => {
      if (!isResizing) return;
      isResizing = false;
      document.documentElement.style.cursor = "";
    });

    // Status updates from iframe
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "SS_STATUS") {
        const pill = sidebar.querySelector("#ss-pill");
        if (pill) pill.textContent = data.text || "Ready";
      }
    });

    return { sidebar, launcher };
  }

  // SPA URL watcher
  let lastUrl = location.href;
  function watchUrlChanges(onChange) {
    const obs = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        onChange(lastUrl);
      }
    });
    obs.observe(document, { subtree: true, childList: true });
  }

  async function injectOrRemoveForPage() {
    const existing = document.getElementById("ss-sidebar");
    const launcher = document.getElementById("ss-launcher");
    if (existing) existing.remove();
    if (launcher) launcher.remove();

    if (!isLikelyWatchPage()) return;

    const prefs = await loadPrefs();
    const ui = createSidebar(prefs);
    if (prefs.collapsed) document.body.appendChild(ui.launcher);
    else document.body.appendChild(ui.sidebar);
  }

  async function main() {
    await sleep(700);
    await injectOrRemoveForPage();
    watchUrlChanges(() => injectOrRemoveForPage());
  }

  main().catch(console.error);
})();
