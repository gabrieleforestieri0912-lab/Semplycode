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

// L'autenticazione è attiva: l'utente accede con codice email e riceve
// un JWT Bearer firmato dal server (usato come Authorization header).
const DEV_BYPASS_AUTH = false;

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

// Ultimo codice analizzato + ultima risposta AI: servono per "Salva nel cassetto"
let lastAnalyzedCode = "";
let lastAssistantReply = "";

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

// ===== Client API condiviso (bundle da src/lib/apiClient.ts) =====
let sharedApi = null;

function getSharedApi() {
  if (!sharedApi && window.SemplycodeAPI) {
    sharedApi = window.SemplycodeAPI.createApiClient({
      baseUrl: () => API_BASE,
      getToken: () => currentToken,
      onUnauthorized: () => handleSessionExpired(),
    });
  }
  return sharedApi;
}

async function apiFetch(path, options = {}) {
  const api = getSharedApi();
  if (api) return api.fetch(path, options);
  // Fallback se il bundle non è disponibile
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
      ...(options.headers || {}),
    },
  });
  return res;
}

// Sessione scaduta: ripulisci token e riporta al login senza perdere il contesto
function handleSessionExpired() {
  if (!currentToken) return;
  currentToken = null;
  currentUser = null;
  storage.remove(["token", "user"]).catch(() => {});
  // Il codice nell'editor e la bozza restano intatti (context preserved)
  showAuth();
  initAuth();
  const emailInput = document.getElementById("auth-email");
  if (emailInput && currentUser?.email) emailInput.value = currentUser.email;
}

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

// ===== WEBAPP HUB (link rapidi alla webapp) =====
function initHubUi() {
  document.querySelectorAll(".dash-action-card").forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.dataset.action;
      const base = SITE_BASE();
      if (action === "dashboard") chrome.tabs.create({ url: base + "/dashboard" });
      if (action === "notes") chrome.tabs.create({ url: base + "/notes" });
      if (action === "settings") chrome.tabs.create({ url: base + "/settings" });
      if (action === "pricing") chrome.tabs.create({ url: base + "/#prezzi" });
    });
  });
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

  // Step 2: Verify code → il server restituisce il JWT Bearer
  verifyBtn.onclick = async () => {
    const code = codeInput.value.trim();
    if (!code) {
      showError("Inserisci il codice ricevuto via email");
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = "Verifica...";
    if (errorBox) errorBox.style.display = "none";

    try {
      const res = await fetch(`${API_BASE}/auth/verify-login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForCode, code }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || "Codice non valido o scaduto");
      }

      // Salva token + utente per le chiamate autenticate
      currentToken = data.token || null;
      currentUser = { email: data.user?.email || emailForCode };
      if (currentToken) {
        await storage.set({ token: currentToken, user: currentUser });
      }

      enterApp();
    } catch (err) {
      console.error("Errore verifica codice:", err);
      showError(err.message || "Errore durante la verifica del codice.");
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verifica codice";
    }
  };

  // Timer di validità del codice (60s)
  let codeExpiryInterval = null;

  function startCodeExpiryTimer(seconds = 60) {
    const expiryEl = document.getElementById("auth-code-expiry");
    if (!expiryEl) return;
    clearInterval(codeExpiryInterval);

    const end = Date.now() + seconds * 1000;
    expiryEl.style.display = "block";
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      if (left <= 0) {
        expiryEl.textContent = "Codice scaduto. Richiedine uno nuovo.";
        if (codeInput) codeInput.disabled = true;
        clearInterval(codeExpiryInterval);
      } else {
        expiryEl.textContent = `Codice valido per ${left}s`;
      }
    };
    tick();
    codeExpiryInterval = setInterval(tick, 1000);
  }

  // Timer di cooldown per il reinvio
  function startCooldownTimer(endTime) {
    const cooldownEl = document.getElementById("auth-cooldown");
    if (!cooldownEl) return;
    const end = typeof endTime === "number" ? endTime : Date.now() + 60 * 1000;
    cooldownEl.style.display = "block";
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      if (left <= 0) {
        cooldownEl.style.display = "none";
        resendBtn.disabled = false;
      } else {
        cooldownEl.textContent = `Puoi richiedere un nuovo codice tra ${left}s`;
      }
    };
    tick();
    const interval = setInterval(() => {
      if (Date.now() >= end) {
        clearInterval(interval);
      }
      tick();
    }, 1000);
  }

  // Helper to reset code step UI (used on resend)
  function resetCodeStepUI() {
    const expiryEl = document.getElementById("auth-code-expiry");
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
      resendBtn.disabled = false;
    }
    // Nota: se l'invio è andato a buon fine, il bottone resta disabilitato
    // finché non scade il cooldown (startCooldownTimer lo riabilita).
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
    div.innerHTML = `<div style="background:#ecfdf5;padding:8px 12px;border-radius:10px;color:#0f172a;"><strong style="color:#059669;">Tu:</strong> ${text}</div>`;
  } else {
    div.innerHTML = `<div style="background:#f8fafc;padding:9px 12px;border-radius:10px;border:1px solid #e2e8f0;border-left:3px solid #059669;color:#0f172a;">${text}</div>`;
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  chatMessages.push({ role, content: text });
}

function clearChat() {
  const container = document.getElementById("chat-messages");
  if (container) container.innerHTML = "";
  chatMessages = [];
  lastAssistantReply = "";
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

  // Save current analysis into the Cassetto delle Note
  const saveNoteBtn = document.getElementById("save-note-btn");
  if (saveNoteBtn) {
    saveNoteBtn.onclick = () => {
      if (!currentToken) {
        alert("Devi accedere per salvare le note nel cassetto.");
        showAuth();
        initAuth();
        return;
      }
      saveCurrentNote();
    };
  }

  // Micro-azione: copia l'ultima risposta AI
  const copyNoteBtn = document.getElementById("copy-note-btn");
  if (copyNoteBtn) {
    copyNoteBtn.onclick = async () => {
      if (!lastAssistantReply) {
        alert("Nessuna risposta da copiare.");
        return;
      }
      try {
        await navigator.clipboard.writeText(lastAssistantReply);
        copyNoteBtn.textContent = "Copiato ✓";
        setTimeout(() => (copyNoteBtn.textContent = "Copia"), 1500);
      } catch (e) {
        alert("Impossibile copiare: " + e.message);
      }
    };
  }

  // Analyze button - now uses the real editor
  analyzeBtn.onclick = async () => {
    const code = getEditorValue().trim();
    if (!code) {
      alert("Inserisci del codice nell'editor");
      return;
    }

    lastAnalyzedCode = code;

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

      lastAssistantReply = reply;
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

      lastAnalyzedCode = code;
      lastAssistantReply = reply;
      const container = document.getElementById("chat-messages");
      container.removeChild(loading);
      addMessage("assistant", reply);
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

// ===== CASSETTO DELLE NOTE =====
function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function currentTabUrl() {
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve((tabs && tabs[0] && tabs[0].url) || "");
      });
    } catch (e) {
      resolve("");
    }
  });
}

async function saveCurrentNote() {
  const code = lastAnalyzedCode || getEditorValue().trim();
  const explanation = lastAssistantReply;
  if (!code || !explanation) {
    alert("Analizza prima un codice per poterlo salvare nel cassetto.");
    return;
  }

  const sourceUrl = await currentTabUrl();
  try {
    const res = await apiFetch("/notes", {
      method: "POST",
      body: JSON.stringify({
        snippet_code: code,
        explanation,
        language: "javascript",
        source_type: "extension",
        source_url: sourceUrl || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore salvataggio nota");

    // Categorizzazione asincrona (non blocca il salvataggio)
    apiFetch(`/notes/${data.note.id}/categorize`, { method: "POST" }).catch(() => {});
    lastAssistantReply = ""; // evita salvataggi doppi dello stesso contenuto
    alert("Nota salvata nel cassetto ✓");
  } catch (err) {
    alert("Errore: " + err.message);
  }
}

async function loadNotes() {
  const listEl = document.getElementById("notes-list");
  const detailEl = document.getElementById("notes-detail");
  const subtitle = document.getElementById("notes-subtitle");
  if (!listEl) return;

  detailEl.style.display = "none";
  listEl.style.display = "flex";

  // Il cassetto richiede l'account: invita al login (onboarding minimo)
  if (!currentToken) {
    listEl.innerHTML =
      '<div class="notes-empty">Accedi per usare il cassetto delle note.<br/><button id="notes-login-prompt" class="btn-primary" style="margin-top:10px; padding:8px 16px; font-size:12px; width:auto;">Accedi ora</button></div>';
    document.getElementById("notes-login-prompt")?.addEventListener("click", () => {
      showAuth();
      initAuth();
    });
    return;
  }

  listEl.innerHTML = '<div class="notes-loading">Caricamento...</div>';

  try {
    const res = await apiFetch("/notes");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore caricamento");
    const notes = data.notes || [];
    if (subtitle) subtitle.textContent = `${notes.length} note salvate`;

    // Batch di categorizzazione delle note rimaste in "pending"
    apiFetch("/notes/categorize-pending", { method: "POST" }).catch(() => {});

    if (!notes.length) {
      listEl.innerHTML =
        '<div class="notes-empty">Nessuna nota salvata.<br/>Usa "Salva nel cassetto" dopo un\'analisi.</div>';
      return;
    }

    listEl.innerHTML = notes
      .map(
        (n) => `
      <div class="notes-item" data-note-id="${n.id}">
        <div class="notes-item-head">
          <span class="notes-item-title">${escapeHtml(n.title || "Nota di codice")}</span>
          ${n.status === "pending" ? '<span class="notes-badge notes-badge-pending">categorizzazione...</span>' : ""}
        </div>
        <div class="notes-item-meta">${escapeHtml(n.language)} · ${new Date(n.created_at).toLocaleDateString("it-IT")}</div>
        ${n.categories && n.categories.length ? `<div class="notes-item-cats">${n.categories.map((c) => `<span class="notes-chip">${escapeHtml(c.name)}</span>`).join("")}</div>` : ""}
      </div>`,
      )
      .join("");

    listEl.querySelectorAll(".notes-item").forEach((el) => {
      el.addEventListener("click", () => openNoteDetail(el.dataset.noteId));
    });
  } catch (err) {
    listEl.innerHTML = `<div class="notes-empty">Errore: ${escapeHtml(err.message)}</div>`;
  }
}

async function openNoteDetail(noteId) {
  const listEl = document.getElementById("notes-list");
  const detailEl = document.getElementById("notes-detail");
  if (!listEl || !detailEl) return;

  listEl.style.display = "none";
  detailEl.style.display = "block";
  detailEl.innerHTML = '<div class="notes-loading">Caricamento nota...</div>';

  try {
    const res = await apiFetch(`/notes/${noteId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Errore caricamento nota");
    const n = data.note;
    const sourceHost = n.source_url ? (() => { try { return new URL(n.source_url).hostname; } catch (e) { return ""; } })() : "";

    detailEl.innerHTML = `
      <button id="notes-back" class="btn-secondary" style="width:auto; padding:6px 12px; font-size:12px; margin-bottom:12px;">← Torna al cassetto</button>
      <div class="notes-detail-card">
        <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:4px;">${escapeHtml(n.title || "Nota di codice")}</div>
        <div style="font-size:11px;color:#64748b;margin-bottom:10px;">${escapeHtml(n.language)} · ${new Date(n.created_at).toLocaleDateString("it-IT")}${sourceHost ? ` · da ${escapeHtml(sourceHost)}` : ""}</div>
        ${(n.categories || []).length ? `<div style="margin-bottom:10px;">${n.categories.map((c) => `<span class="notes-chip">${escapeHtml(c.name)}</span>`).join("")}</div>` : ""}
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#059669;margin-bottom:6px;">Codice originale</div>
        <pre class="notes-code">${escapeHtml(n.snippet_code)}</pre>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#059669;margin:14px 0 6px;">Spiegazione</div>
        <div class="notes-explain">${escapeHtml(n.explanation).replace(/\n/g, "<br/>")}</div>
        ${n.related && n.related.length ? `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#059669;margin:14px 0 6px;">Note correlate</div>${n.related.map((r) => `<div class="notes-related">${escapeHtml(r.title)}</div>`).join("")}` : ""}
        <div style="display:flex; gap:8px; margin-top:14px;">
          <button id="notes-open-webapp" class="btn-primary" style="flex:1; font-size:12px; padding:8px;">Apri nel cassetto (webapp)</button>
          <button id="notes-delete" class="btn-outline" style="flex:1; font-size:12px; padding:8px; margin:0;">Elimina nota</button>
        </div>
      </div>`;

    document.getElementById("notes-back").addEventListener("click", () => {
      detailEl.style.display = "none";
      listEl.style.display = "flex";
      loadNotes();
    });
    document.getElementById("notes-open-webapp").addEventListener("click", () => {
      chrome.tabs.create({ url: `${SITE_BASE()}/notes?note=${noteId}` });
    });
    document.getElementById("notes-delete").addEventListener("click", async () => {
      if (!confirm("Eliminare questa nota?")) return;
      const del = await apiFetch(`/notes/${noteId}`, { method: "DELETE" });
      if (del.ok) {
        detailEl.style.display = "none";
        listEl.style.display = "flex";
        loadNotes();
      }
    });
  } catch (err) {
    detailEl.innerHTML = `<div class="notes-empty">Errore: ${escapeHtml(err.message)}</div>`;
  }
}

// ===== Polling note (la nota salvata in webapp appare qui) =====
let notesRefreshTimer = null;

function startNotesPolling() {
  stopNotesPolling();
  notesRefreshTimer = setInterval(() => {
    const detailEl = document.getElementById("notes-detail");
    // Non ricaricare mentre è aperto il dettaglio
    if (detailEl && detailEl.style.display === "none") {
      loadNotes();
    }
  }, 30000);
}

function stopNotesPolling() {
  if (notesRefreshTimer) {
    clearInterval(notesRefreshTimer);
    notesRefreshTimer = null;
  }
}

// Navigation between Playground / Dashboard / Account + active styling
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = {
    playground: document.getElementById("section-playground"),
    notes: document.getElementById("section-notes"),
    webapp: document.getElementById("section-webapp"),
    settings: document.getElementById("section-settings"),
  };

  function activate(sectionName) {
    // Update nav active states
    navItems.forEach((item) => {
      if (item.dataset.section === sectionName) {
        item.classList.add("active");
        item.style.color = "#059669";
      } else {
        item.classList.remove("active");
        item.style.color = "#64748b";
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
        if (target === "notes") {
          loadNotes();
          startNotesPolling();
        } else {
          stopNotesPolling();
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
function enterApp() {
  showApp();
  initNavigation();
  initHubUi();
  initPlayground();
  loadSelectedCodeFromContextMenu(true);
  initCodeEditor();
  initSettings();
  populateAccount();
}

async function init() {
  await initApiBase();

  if (DEV_BYPASS_AUTH) {
    // Dev only: salta completamente il login
    currentUser = { email: "dev@local" };
    enterApp();
    return;
  }

  // Flusso guest-first: l'estensione è utilizzabile subito (analisi con
  // quota ospite); il login serve solo per salvare nel cassetto e per le note.
  const saved = await storage.get(["token", "user"]);
  if (saved.token && saved.user) {
    currentToken = saved.token;
    currentUser = saved.user;
    enterApp();
  } else {
    enterApp();
  }
}

function populateAccount() {
  const email = currentUser?.email || "";
  const userNameEl = document.getElementById("webapp-user-name");
  if (userNameEl) {
    userNameEl.innerHTML = email
      ? `Benvenuto, <span class="accent">${escapeHtml(email.split("@")[0] || "Utente")}</span>!`
      : "Benvenuto! Accedi dalla webapp o dalle impostazioni per salvare le note.";
  }

  const loginBtn = document.getElementById("settings-login-btn");
  const logoutBtn = document.getElementById("settings-logout-btn");
  if (loginBtn) loginBtn.style.display = currentUser ? "none" : "block";
  if (logoutBtn) logoutBtn.style.display = currentUser ? "block" : "none";
}

function initSettings() {
  const loginBtn = document.getElementById("settings-login-btn");
  const logoutBtn = document.getElementById("settings-logout-btn");
  const apiBaseInput = document.getElementById("settings-api-base");
  const saveApiBtn = document.getElementById("settings-save-api");

  // ── Collega account webapp (link-code) ──
  const openLinkBtn = document.getElementById("settings-open-link");
  const linkCodeInput = document.getElementById("settings-link-code");
  const linkSubmitBtn = document.getElementById("settings-link-submit");
  const linkFeedback = document.getElementById("settings-link-feedback");

  const setLinkFeedback = (text, isError) => {
    if (!linkFeedback) return;
    linkFeedback.textContent = text;
    linkFeedback.style.color = isError ? "#dc2626" : "#059669";
    linkFeedback.style.display = "block";
  };

  if (openLinkBtn) {
    openLinkBtn.onclick = () => chrome.tabs.create({ url: `${SITE_BASE()}/extension-link` });
  }
  if (linkSubmitBtn) {
    linkSubmitBtn.onclick = async () => {
      const code = linkCodeInput ? linkCodeInput.value.trim() : "";
      if (!code) {
        setLinkFeedback("Incolla il codice dalla webapp.", true);
        return;
      }
      linkSubmitBtn.disabled = true;
      linkSubmitBtn.textContent = "Collegamento...";
      try {
        const res = await apiFetch("/auth/link-code", {
          method: "POST",
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Codice non valido");
        currentToken = data.token;
        currentUser = data.user;
        await storage.set({ token: currentToken, user: currentUser });
        if (linkCodeInput) linkCodeInput.value = "";
        setLinkFeedback("Account collegato! Ora puoi salvare nel cassetto.", false);
        populateAccount();
      } catch (err) {
        setLinkFeedback(err.message || "Errore di collegamento.", true);
      } finally {
        linkSubmitBtn.disabled = false;
        linkSubmitBtn.textContent = "Collega";
      }
    };
  }

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
