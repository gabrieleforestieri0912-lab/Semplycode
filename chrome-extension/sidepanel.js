// Semplycode Sidepanel - Full Auth + Nav + Playground (Manifest V3)

// API Bases
const DEV_API_BASE  = "http://localhost:3000/api";
const PROD_API_BASE = "https://semplycode.com/api";

// Storage helpers
const storage = {
  get: (keys) => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
  set: (obj) => new Promise(resolve => chrome.storage.local.set(obj, resolve)),
  remove: (keys) => new Promise(resolve => chrome.storage.local.remove(keys, resolve)),
};

// Default to localhost during development
let API_BASE = DEV_API_BASE;

// === TEMPORARY DEV BYPASS (disattiva il login) ===
// Imposta su false per riattivare l'autenticazione
const DEV_BYPASS_AUTH = true;

// === DASHBOARD DATA (dinamico - sarà popolato dall'API quando riattiveremo il login) ===
let dashboardData = {
  analysesToday: 0,
  analysesLimit: 10,
  analysesTotal: 0,
  chatsTotal: 0,
  timeSaved: "0h 0m",
  streak: 0,
  plan: "free",
  recentActivity: []
};

// CodeMirror 6 Editor instance
let codeEditor = null;

// Enhanced fallback textarea (used when real CodeMirror 6 cannot be loaded due to CSP)
function enhanceFallbackEditor(textarea) {
  if (!textarea) return;

  // Better editor-like behavior
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
        // Shift+Tab → remove indentation
        const before = value.substring(0, start);
        const after = value.substring(end);
        const lineStart = before.lastIndexOf('\n') + 1;
        const lineContent = before.substring(lineStart);
        const dedented = lineContent.replace(/^([ \t]{1,2})/, '');
        const newBefore = before.substring(0, lineStart) + dedented;
        textarea.value = newBefore + after;
        const newPos = lineStart + dedented.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      } else {
        // Tab → insert 2 spaces
        textarea.value = value.substring(0, start) + '  ' + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    }
  });

  // Auto-save draft while typing (debounced)
  let draftTimer = null;
  textarea.addEventListener('input', () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      try {
        chrome.storage.local.set({ draftCode: textarea.value });
      } catch (_) {}
    }, 800);
  });

  // Nice placeholder behavior
  if (!textarea.value.trim()) {
    textarea.value = '// Incolla o scrivi il tuo codice qui...\n\nfunction esempio() {\n  console.log("Hello from Semplycode");\n}\n';
    textarea.selectionStart = textarea.selectionEnd = 0;
  }
}

async function initCodeEditor() {
  const container = document.getElementById("code-editor");
  if (!container || codeEditor) return;

  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;

  if (!isExtension) {
    try {
      const { EditorView, basicSetup } = await import('https://cdn.jsdelivr.net/npm/codemirror@6/dist/index.js');
      const { javascript } = await import('https://cdn.jsdelivr.net/npm/@codemirror/lang-javascript@6/dist/index.js');
      const { oneDark } = await import('https://cdn.jsdelivr.net/npm/@codemirror/theme-one-dark@6/dist/index.js');

      codeEditor = new EditorView({
        doc: "// Incolla o scrivi il tuo codice qui\n\nfunction esempio() {\n  console.log('Hello from Semplycode');\n}",
        extensions: [
          basicSetup,
          javascript(),
          oneDark,
          EditorView.lineWrapping,
        ],
        parent: container
      });
      console.log('[Semplycode] CodeMirror 6 loaded from CDN');
      return;
    } catch (e) {
      console.warn('[Semplycode] CDN CodeMirror failed, using fallback');
    }
  }

  if (isExtension) {
    console.log('[Semplycode] Extension detected, checking for bundled CodeMirror...');
    if (typeof window !== 'undefined' && window.__SemplycodeCodeMirror) {
      const cm = window.__SemplycodeCodeMirror;
      try {
        codeEditor = new cm.EditorView({
          doc: "// Incolla o scrivi il tuo codice qui\n\nfunction esempio() {\n  console.log('Hello from Semplycode');\n}",
          extensions: [
            cm.basicSetup,
            cm.javascript(),
            cm.oneDark,
            cm.EditorView.lineWrapping,
            cm.EditorView.theme({
              "&": { height: "100%", minHeight: "100%" },
              ".cm-scroller": { minHeight: "100%" },
            }),
          ],
          parent: container,
        });
        container.style.display = "flex";
        container.style.flexDirection = "column";
        console.log('[Semplycode] CodeMirror 6 loaded from local bundle');
        return;
      } catch (e) {
        console.warn('[Semplycode] Bundled CodeMirror failed:', e);
      }
    }
  }

  console.log('[Semplycode] Using enhanced textarea fallback');
  container.innerHTML = `
    <textarea id="code-editor-fallback"
              spellcheck="false"
              class="code-editor-fallback-inner"></textarea>
  `;
  const style = document.createElement("style");
  style.textContent = `
    .code-editor-fallback-inner {
      width:100%; height:100%; min-height:0; flex:1;
      font-family: Consolas, Menlo, Monaco, monospace;
      font-size: 13px; line-height: 1.5;
      background: #0b0f1a; color: #34d399;
      border: none; border-radius: 10px;
      padding: 14px; resize: none; outline: none; box-sizing: border-box;
    }
  `;
  if (!document.getElementById("cm-fallback-style")) {
    style.id = "cm-fallback-style";
    document.head.appendChild(style);
  }
  const ta = document.getElementById('code-editor-fallback');

  try {
    const saved = await chrome.storage.local.get('draftCode');
    if (saved.draftCode) {
      ta.value = saved.draftCode;
    }
  } catch (_) {}

  enhanceFallbackEditor(ta);
}

// Get current code from the editor (supports both CM6 and fallback)

// Get current code from the editor (supports both CM6 and fallback)
function getEditorValue() {
  if (codeEditor) {
    return codeEditor.state.doc.toString();
  }
  const fallback = document.getElementById("code-editor-fallback");
  return fallback ? fallback.value : "";
}



// ===== DEV HELPER =====
// Durante lo sviluppo usa localhost di default.
// Per passare in produzione esegui:
//   setApiBase("https://semplycode.com/api")
// Per tornare a localhost:
//   setApiBase("http://localhost:3000/api")
window.setApiBase = async function (newBase) {
  await storage.set({ apiBase: newBase });
  console.log("[Semplycode] API base salvata. Ricarica il side panel per applicare:", newBase);
};

let currentToken = null;
let currentUser = null;
let chatMessages = [];

// Load custom API base from storage (useful for local development)
async function initApiBase() {
  try {
    const result = await storage.get(['apiBase']);
    if (result.apiBase && typeof result.apiBase === 'string') {
      API_BASE = result.apiBase;
      console.log('[Semplycode] Usando API base personalizzata:', API_BASE);
    } else {
      // Default a localhost durante lo sviluppo
      console.log('[Semplycode] Nessun override → usando default:', API_BASE);
    }
  } catch (e) {
    console.warn('[Semplycode] Errore caricamento API base, uso default', e);
  }
}

const SITE_BASE = () => API_BASE.replace(/\/api\/?$/, "");

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
      ...(options.headers || {}),
    },
  });
  return res;
}

function planLabelFromId(plan) {
  if (plan === "pro") return "Pro";
  if (plan === "enterprise") return "Enterprise";
  if (plan === "guest") return "Ospite";
  return "Gratuito";
}

// ===== View helpers =====
function showApp() {
  document.body.classList.remove("auth-mode");
  const authScreen = document.getElementById("auth-screen");
  const appScreen = document.getElementById("app-screen");
  if (authScreen) authScreen.style.display = "none";
  if (appScreen) appScreen.classList.add("visible");
}

function showAuth() {
  document.body.classList.add("auth-mode");
  const authScreen = document.getElementById("auth-screen");
  const appScreen = document.getElementById("app-screen");
  if (authScreen) authScreen.style.display = "flex";
  if (appScreen) appScreen.classList.remove("visible");
}

function renderWeekChart(usedToday, dailyLimit) {
  const container = document.getElementById("dash-week-chart");
  if (!container) return;

  const days = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const max = dailyLimit || 10;

  const values = days.map((_, i) => {
    if (i === todayIdx) return usedToday;
    return Math.max(0, Math.min(max, Math.floor((max * 0.3) + Math.random() * max * 0.5)));
  });

  container.innerHTML = days
    .map((day, i) => {
      const pct = Math.max(8, Math.min(100, (values[i] / max) * 100));
      return `<div class="dash-chart-bar-col"><div class="dash-chart-bar-track" style="height:${pct}%"><div class="dash-chart-bar-fill"></div></div><span class="day">${day}</span><span class="val">${values[i]}</span></div>`;
    })
    .join("");
}

function renderActivityList(chats) {
  const list = document.getElementById("dash-activity-list");
  if (!list) return;

  if (!chats?.length) {
    list.innerHTML =
      '<div class="dash-empty"><p>Nessuna attività recente.</p><p style="margin-top:6px;font-size:11px;">Inizia una nuova analisi nel Playground.</p></div>';
    return;
  }

  list.innerHTML = chats
    .slice(0, 5)
    .map((chat) => {
      const title = (chat.title || "Nuova analisi").replace(/</g, "&lt;");
      const lang = chat.language || "javascript";
      const date = chat.createdAt
        ? new Date(chat.createdAt).toLocaleDateString("it-IT")
        : "";
      return `<div class="dash-activity-item" data-chat-id="${chat._id || ""}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div>
          <div class="meta">${lang} · ${date}</div>
        </div>
      </div>`;
    })
    .join("");

  list.querySelectorAll(".dash-activity-item").forEach((el) => {
    el.addEventListener("click", () => {
      const nav = document.querySelector('.nav-item[data-section="playground"]');
      if (nav) nav.click();
    });
  });
}

async function loadDashboard() {
  let stats = {
    plan: "free",
    analyses: 0,
    chats: 0,
    remainingAnalyses: 10,
    dailyLimit: 10,
    authenticated: false,
  };

  try {
    const statsRes = await apiFetch("/usage/stats");
    if (statsRes.ok) {
      stats = await statsRes.json();
    }
  } catch (e) {
    console.warn("[Semplycode] stats fetch failed", e);
  }

  let recentChats = [];
  if (stats.authenticated) {
    try {
      const histRes = await apiFetch("/chat/history");
      if (histRes.ok) {
        const data = await histRes.json();
        recentChats = data.chats || [];
      }
    } catch (e) {
      console.warn("[Semplycode] history fetch failed", e);
    }
  }

  const planLabel = planLabelFromId(stats.plan);
  const remaining =
    stats.remainingAnalyses === null ? "∞" : String(stats.remainingAnalyses);
  const limit = stats.dailyLimit ?? 10;
  const used =
    stats.dailyLimit != null && stats.remainingAnalyses != null
      ? limit - stats.remainingAnalyses
      : stats.analyses || 0;

  const firstName =
    currentUser?.firstName ||
    currentUser?.email?.split("@")[0] ||
    (stats.authenticated ? "Utente" : "Ospite");

  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  set("dash-user-name", firstName);
  set("dash-plan-pill-label", planLabel);
  set("dash-remaining", remaining);
  set("dash-remaining-sub", stats.dailyLimit ? "al giorno" : "illimitate");
  set("dash-analyses-total", String(stats.analyses ?? 0));
  set("dash-chats-total", String(stats.chats ?? 0));
  set("dash-plan-title", planLabel);
  set("dash-action-plan", planLabel);
  set(
    "dash-plan-desc",
    stats.plan === "free"
      ? `${limit} analisi al giorno`
      : stats.plan === "guest"
        ? "3 analisi al giorno (ospite)"
        : "Analisi illimitate",
  );
  set(
    "dash-usage-label",
    stats.dailyLimit != null ? `${used}/${limit}` : "Illimitato",
  );

  const bar = document.getElementById("dash-usage-bar");
  if (bar) {
    const pct =
      stats.dailyLimit != null
        ? Math.min(100, (used / limit) * 100)
        : 100;
    bar.style.width = `${pct}%`;
  }

  renderWeekChart(used, stats.dailyLimit);
  renderActivityList(recentChats);
}

function initDashboardUi() {
  document.querySelectorAll(".dash-action-card").forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.dataset.action;
      if (action === "playground") {
        document.querySelector('.nav-item[data-section="playground"]')?.click();
        return;
      }
      if (action === "plan-info") {
        document.querySelector('.nav-item[data-section="account"]')?.click();
        return;
      }
      const base = SITE_BASE();
      if (action === "settings") chrome.tabs.create({ url: `${base}/settings` });
      if (action === "pricing") chrome.tabs.create({ url: `${base}/#prezzi` });
    });
  });

  document.getElementById("dash-see-all")?.addEventListener("click", () => {
    document.querySelector('.nav-item[data-section="playground"]')?.click();
  });

  document.getElementById("dash-manage-plan")?.addEventListener("click", () => {
    chrome.tabs.create({ url: `${SITE_BASE()}/#prezzi` });
  });

  document.querySelectorAll(".dash-tip-card").forEach((card) => {
    card.addEventListener("click", () => {
      const tip = card.dataset.tip;
      if (tip === "pro") {
        chrome.tabs.create({ url: `${SITE_BASE()}/#prezzi` });
      } else {
        document.querySelector('.nav-item[data-section="playground"]')?.click();
      }
    });
  });
}

function renderDashboard() {
  loadDashboard();
}

// ===== AUTH (real working flow) =====
function initAuth() {
  const emailStep = document.getElementById("auth-email-step");
  const codeStep = document.getElementById("auth-code-step");
  const emailInput = document.getElementById("auth-email");
  const sendBtn = document.getElementById("auth-send-code");
  const codeInput = document.getElementById("auth-code");
  const verifyBtn = document.getElementById("auth-verify");
  const resendBtn = document.getElementById("auth-resend");
  const errorBox = document.getElementById("auth-error");
  const emailDisplay = document.getElementById("auth-email-display");

  let emailForCode = "";

  const showError = (msg) => {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = "block";
    }
  };

  // Step 1: Send login code
  sendBtn.onclick = async () => {
    const email = emailInput.value.trim();
    if (!email) {
      showError("Inserisci una email valida");
      return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Invio in corso...";
    if (errorBox) errorBox.style.display = "none";

    try {
      const url = `${API_BASE}/auth/send-login-code`;
      console.log('[Semplycode] Invio codice a:', url);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (e) {
        console.error("Risposta non JSON:", res);
      }

      if (!res.ok) {
        const msg = data.error || data.message || `Errore ${res.status} durante l'invio del codice`;
        console.error("Send login code failed:", msg, data);
        
        // Better messages for common server errors
        if (res.status === 500) {
          throw new Error("Errore interno del server (500). Controlla il terminale di 'npm run dev' per il dettaglio dell'errore.");
        }
        if (res.status === 429) {
          throw new Error("Troppi tentativi. Aspetta un minuto prima di riprovare.");
        }
        
        throw new Error(msg);
      }

      emailForCode = email;
      if (emailDisplay) emailDisplay.textContent = email;

      // Switch to code step
      if (emailStep) emailStep.style.display = "none";
      if (codeStep) codeStep.style.display = "block";

      // Start 60-second code validity timer
      startCodeExpiryTimer(60);

      // Start resend cooldown timer if backend gave reset time
      if (data.reset) {
        startCooldownTimer(data.reset);
      } else {
        // fallback 60s cooldown for resend
        startCooldownTimer(Date.now() + 60 * 1000);
      }
    } catch (err) {
      console.error("Errore invio codice:", err);
      const isLocal = API_BASE.includes("localhost");
      
      let userMessage = err.message || "Errore sconosciuto durante l'invio del codice.";
      
      if (isLocal && !err.message?.includes("500")) {
        userMessage = "Impossibile contattare il server locale. Assicurati che 'npm run dev' sia in esecuzione su http://localhost:3000";
      }
      
      showError(userMessage);
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = "Invia codice di accesso";
    }
  };

  // Step 2: Verify code (legacy auth flow - only runs when DEV_BYPASS_AUTH = false)
  // Currently disabled / stubbed to keep file syntactically valid while using bypass mode.
  verifyBtn.onclick = async () => {
    // Auth temporarily bypassed. See DEV_BYPASS_AUTH at top of file.
    console.log("[Semplycode] verify code clicked (bypass active)");
  };

  // Code validity timer (legacy)
  let codeExpiryInterval = null;

  function startCodeExpiryTimer(seconds = 60) {
    // no-op in current bypass mode
  }

  // Helper to reset code step UI (used on resend)
  function resetCodeStepUI() {
    if (expiryEl) {
      expiryEl.style.display = "none";
      expiryEl.textContent = "";
    }
    if (codeInput) {
      codeInput.disabled = false;
      codeInput.value = "";
    }
    if (verifyBtn) verifyBtn.disabled = false;
  }

  // Resend code
  resendBtn.onclick = async () => {
    if (!emailForCode) return;

    resetCodeStepUI(); // clear old expiry + input
    resendBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/send-login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForCode }),
      });

      if (res.ok) {
        // Successfully resent → restart 60s validity timer
        startCodeExpiryTimer(60);

        // Restart resend cooldown
        startCooldownTimer(Date.now() + 60 * 1000);
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Resend failed:", data.error || res.status);
        showError("Errore durante il reinvio. Riprova.");
      }
    } catch (e) {
      console.error("Errore durante il reinvio del codice:", e);
      showError("Impossibile inviare il codice. Controlla la connessione.");
    }

    resendBtn.disabled = false;
  };
}

// ===== PLAYGROUND (Editor top + Chat full height bottom) =====
function addMessage(role, text) {
  const container = document.getElementById("chat-messages");
  if (!container) return;

  const div = document.createElement("div");
  div.style.marginBottom = "10px";
  div.style.fontSize = "13px";
  div.style.lineHeight = "1.4";

  if (role === "user") {
    div.innerHTML = `<div style="background:#1f2937;padding:8px 12px;border-radius:10px;"><strong>Tu:</strong> ${text}</div>`;
  } else {
    div.innerHTML = `<div style="background:#0f172a;padding:9px 12px;border-radius:10px;border-left:3px solid #10b981;">${text}</div>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  chatMessages.push({ role, content: text });
}

function clearChat() {
  const container = document.getElementById("chat-messages");
  if (container) container.innerHTML = "";
  chatMessages = [];
}

async function sendToAI(messages) {
  const res = await apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Errore dal server AI");
  return data.message.content;
}

function initPlayground() {
  const analyzeBtn = document.getElementById("analyze-btn");
  const chatInput = document.getElementById("chat-input");
  const chatSend = document.getElementById("chat-send");

  if (!analyzeBtn) return;

  // Restore draft is already handled in initCodeEditor

  // Auto-save draft when editor changes (for CM6 we can add update listener later)
  // For now we save on analyze

  // Analyze button - now uses the real editor
  analyzeBtn.onclick = async () => {
    const code = getEditorValue().trim();
    if (!code) {
      alert("Inserisci del codice nell'editor");
      return;
    }

    // Save draft
    storage.set({ draftCode: code });

    clearChat();
    addMessage("user", "Analizza questo codice");

    const loadingDiv = document.createElement("div");
    loadingDiv.textContent = "Analisi in corso...";
    document.getElementById("chat-messages").appendChild(loadingDiv);

    try {
      const reply = await sendToAI([
        {
          role: "system",
          content:
            "Sei un esperto Code Reviewer italiano. La tua priorità assoluta è individuare, spiegare e correggere gli errori nel codice. Poi dai suggerimenti e il codice corretto.",
        },
        { role: "user", content: `Codice da analizzare:\n${code}` },
      ]);

      const container = document.getElementById("chat-messages");
      container.removeChild(loadingDiv);
      addMessage("assistant", reply);
    } catch (e) {
      const container = document.getElementById("chat-messages");
      container.removeChild(loadingDiv);
      addMessage("assistant", "Errore: " + e.message);
    }
  };

  // Chat send
  const sendChat = async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    const code = getEditorValue().trim();
    addMessage("user", question);
    chatInput.value = "";

    const loading = document.createElement("div");
    loading.textContent = "...";
    document.getElementById("chat-messages").appendChild(loading);

    try {
      const reply = await sendToAI([
        {
          role: "system",
          content: `L'utente sta lavorando su questo codice:\n${code}\nRispondi in italiano in modo chiaro e utile.`,
        },
        ...chatMessages.slice(-6),
      ]);

      const container = document.getElementById("chat-messages");
      container.removeChild(loading);
      addMessage("assistant", reply);
      loadDashboard();
    } catch (e) {
      const container = document.getElementById("chat-messages");
      container.removeChild(loading);
      addMessage("assistant", "Errore: " + e.message);
    }
  };

  chatSend.onclick = sendChat;
  chatInput.onkeydown = (e) => {
    if (e.key === "Enter") sendChat();
  };
}

// Load code sent via context menu (from background.js)
async function loadSelectedCodeFromContextMenu(autoAnalyze = false) {
  const data = await storage.get("selectedCode");
  if (data.selectedCode) {
    if (codeEditor) {
      codeEditor.dispatch({
        changes: { from: 0, to: codeEditor.state.doc.length, insert: data.selectedCode }
      });
    } else {
      const fallback = document.getElementById("code-editor-fallback");
      if (fallback) fallback.value = data.selectedCode;
    }

    await storage.remove("selectedCode");

    if (autoAnalyze) {
      setTimeout(() => {
        const btn = document.getElementById("analyze-btn");
        if (btn) btn.click();
      }, 400);
    }
  }
}

// Navigation between Playground / Dashboard / Account + active styling
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = {
    playground: document.getElementById("section-playground"),
    dashboard: document.getElementById("section-dashboard"),
    account: document.getElementById("section-account"),
    settings: document.getElementById("section-settings"),
  };

  function activate(sectionName) {
    // Update nav active states
    navItems.forEach((item) => {
      if (item.dataset.section === sectionName) {
        item.classList.add("active");
        item.style.color = "#fff";
      } else {
        item.classList.remove("active");
        item.style.color = "#9ca3af";
      }
    });

    // Show/hide sections
    Object.keys(sections).forEach((key) => {
      const el = sections[key];
      if (!el) return;
      const active = key === sectionName;
      el.classList.toggle("active-panel", active && key === "playground");
      el.style.display = active ? (key === "playground" ? "flex" : "block") : "none";
    });
  }

  navItems.forEach((item) => {
    item.onclick = () => {
      const target = item.dataset.section;
      if (target) {
        activate(target);
        if (target === "playground") {
          if (!codeEditor && !document.getElementById("code-editor-fallback")) {
            initCodeEditor();
          }
          requestAnimationFrame(() => {
            if (codeEditor?.requestMeasure) codeEditor.requestMeasure();
          });
        }
        if (target === "dashboard") {
          loadDashboard();
        }
      }
    };
  });

  // Ensure initial active state matches the HTML (playground by default)
  const initial = document.querySelector('.nav-item.active') || navItems[0];
  if (initial) {
    const startSection = initial.dataset.section || "playground";
    activate(startSection);
  }
}

// ===== MAIN INIT =====
async function init() {
  await initApiBase();

  if (DEV_BYPASS_AUTH) {
    // TEMP: salta completamente il login e vai dritto alle sezioni
    showApp();
    initNavigation();
    initDashboardUi();
    initPlayground();
    loadSelectedCodeFromContextMenu(true);
    loadDashboard();
    initCodeEditor();
    initSettings();
    return;
  }

  // Flusso normale con autenticazione
  const saved = await storage.get(["token", "user"]);

  if (saved.token && saved.user) {
    currentToken = saved.token;
    currentUser = saved.user;

    showApp();
    initNavigation();
    initDashboardUi();
    initPlayground();
    loadSelectedCodeFromContextMenu(true);
    loadDashboard();
    initCodeEditor();
    initSettings();
  } else {
    showAuth();
    initAuth();
  }
}

function initSettings() {
  const loginBtn = document.getElementById("settings-login-btn");
  const logoutBtn = document.getElementById("settings-logout-btn");
  const apiBaseInput = document.getElementById("settings-api-base");
  const saveApiBtn = document.getElementById("settings-save-api");

  // API base input
  if (apiBaseInput) apiBaseInput.value = API_BASE;

  // Login button - redirect to auth
  if (loginBtn) {
    loginBtn.onclick = () => {
      document.querySelector('.nav-item[data-section="playground"]')?.click();
      showAuth();
    };
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await storage.remove(["token", "user"]);
      currentToken = null;
      currentUser = null;
      showAuth();
      initAuth();
    };
  }

  // Save API base
  if (saveApiBtn && apiBaseInput) {
    saveApiBtn.onclick = async () => {
      const newBase = apiBaseInput.value.trim();
      if (newBase) {
        await storage.set({ apiBase: newBase });
        API_BASE = newBase;
        saveApiBtn.textContent = "Salvato";
        setTimeout(() => saveApiBtn.textContent = "Salva", 1500);
      }
    };
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "start-analysis" && msg.code) {
    const apply = async () => {
      if (codeEditor) {
        codeEditor.dispatch({
          changes: { from: 0, to: codeEditor.state.doc.length, insert: msg.code },
        });
      } else {
        const fallback = document.getElementById("code-editor-fallback");
        if (fallback) fallback.value = msg.code;
        if (!codeEditor) await initCodeEditor();
      }
      const nav = document.querySelector('.nav-item[data-section="playground"]');
      if (nav) nav.click();
      setTimeout(() => document.getElementById("analyze-btn")?.click(), 500);
    };
    apply();
  }
});

init();
