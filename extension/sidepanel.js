// Semplycode Sidepanel - Full Auth + Nav + Playground (Manifest V3)

// API Bases
const DEV_API_BASE  = "http://localhost:3000/api";
const PROD_API_BASE = "https://semplycode.vercel.app/api";

// Storage helpers
const storage = {
  get: (keys) => new Promise(resolve => chrome.storage.local.get(keys, resolve)),
  set: (obj) => new Promise(resolve => chrome.storage.local.set(obj, resolve)),
  remove: (keys) => new Promise(resolve => chrome.storage.local.remove(keys, resolve)),
};

// Default to production
let API_BASE = PROD_API_BASE;

// L'autenticazione è attiva: l'utente accede con codice email e riceve
// un JWT Bearer firmato dal server (usato come Authorization header).
const DEV_BYPASS_AUTH = false;

// CodeMirror 6 Editor instance
let codeEditor = null;

// ===== Helpers =====

function escapeHtml(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function $(id) {
  return document.getElementById(id);
}

let toastTimer = null;
function showToast(message, ms = 2000) {
  const toast = $("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), ms);
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

// ===== Theme =====

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme || "light");
  const dark = theme === "dark";
  const sunIcon = $("theme-icon-sun");
  const moonIcon = $("theme-icon-moon");
  if (sunIcon && moonIcon) {
    sunIcon.style.display = dark ? "block" : "none";
    moonIcon.style.display = dark ? "none" : "block";
  }
}

async function initTheme() {
  let current = "light";
  try {
    const saved = await storage.get("theme");
    // Se non è mai stato salvato nulla usa 'light' come default
    current = saved.theme || "light";
  } catch (e) {
    current = "light";
  }
  applyTheme(current);

  const toggle = $("theme-toggle");
  if (toggle) {
    toggle.onclick = () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      storage.set({ theme: next });
    };
  }
}

// ===== Enhanced fallback textarea (used when CodeMirror cannot load) =====

function enhanceFallbackEditor(textarea) {
  if (!textarea) return;

  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
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
        textarea.value = value.substring(0, start) + '  ' + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }
    }
  });

  let draftTimer = null;
  textarea.addEventListener('input', () => {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => {
      try {
        chrome.storage.local.set({ draftCode: textarea.value });
      } catch (_) {}
    }, 800);
  });

  if (!textarea.value.trim()) {
    textarea.value = '// Incolla o scrivi il tuo codice qui...\n\nfunction esempio() {\n  console.log("Hello from Semplycode");\n}\n';
    textarea.selectionStart = textarea.selectionEnd = 0;
  }
}

async function initCodeEditor() {
  const container = $("code-editor");
  if (!container || codeEditor) return;

  const isExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;

  if (isExtension && window.__SemplycodeCodeMirror) {
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
      console.log('[Semplycode] CodeMirror 6 loaded from local bundle');
      return;
    } catch (e) {
      console.warn('[Semplycode] Bundled CodeMirror failed:', e);
    }
  }

  if (!isExtension) {
    try {
      const { EditorView, basicSetup } = await import('https://cdn.jsdelivr.net/npm/codemirror@6/dist/index.js');
      const { javascript } = await import('https://cdn.jsdelivr.net/npm/@codemirror/lang-javascript@6/dist/index.js');
      const { oneDark } = await import('https://cdn.jsdelivr.net/npm/@codemirror/theme-one-dark@6/dist/index.js');

      codeEditor = new EditorView({
        doc: "// Incolla o scrivi il tuo codice qui\n\nfunction esempio() {\n  console.log('Hello from Semplycode');\n}",
        extensions: [basicSetup, javascript(), oneDark, EditorView.lineWrapping],
        parent: container,
      });
      console.log('[Semplycode] CodeMirror 6 loaded from CDN');
      return;
    } catch (e) {
      console.warn('[Semplycode] CDN CodeMirror failed, using fallback');
    }
  }

  console.log('[Semplycode] Using enhanced textarea fallback');
  container.innerHTML = `<textarea id="code-editor-fallback" spellcheck="false"></textarea>`;
  const ta = $("code-editor-fallback");
  try {
    const saved = await chrome.storage.local.get('draftCode');
    if (saved.draftCode) {
      ta.value = saved.draftCode;
      ta.selectionStart = ta.selectionEnd = 0;
    }
  } catch (_) {}
  enhanceFallbackEditor(ta);
}

function getEditorValue() {
  if (codeEditor) {
    return codeEditor.state.doc.toString();
  }
  const fallback = $("code-editor-fallback");
  return fallback ? fallback.value : "";
}

function setEditorValue(text) {
  if (codeEditor) {
    codeEditor.dispatch({
      changes: { from: 0, to: codeEditor.state.doc.length, insert: text },
    });
  } else {
    const fallback = $("code-editor-fallback");
    if (fallback) fallback.value = text;
  }
}

// ===== API =====

window.setApiBase = async function (newBase) {
  await storage.set({ apiBase: newBase });
  console.log("[Semplycode] API base salvata. Ricarica il side panel per applicare:", newBase);
};

let currentToken = null;
let currentUser = null;
let chatMessages = [];

let lastAnalyzedCode = "";
let lastAssistantReply = "";

async function initApiBase() {
  try {
    const result = await storage.get(['apiBase']);
    if (result.apiBase && typeof result.apiBase === 'string') {
      API_BASE = result.apiBase;
      console.log('[Semplycode] Usando API base personalizzata:', API_BASE);
    }
  } catch (e) {
    console.warn('[Semplycode] Errore caricamento API base, uso default', e);
  }
}

const SITE_BASE = () => API_BASE.replace(/\/api\/?$/, "");

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

function handleSessionExpired() {
  if (!currentToken) return;
  const email = currentUser?.email;
  currentToken = null;
  currentUser = null;
  storage.remove(["token", "user"]).catch(() => {});
  showAuth();
  const emailInput = $("auth-email");
  if (emailInput && email) emailInput.value = email;
  showToast("Sessione scaduta. Accedi di nuovo.");
}

// ===== Screen management =====

function showApp() {
  document.body.classList.remove("auth-mode");
}

function showAuth() {
  document.body.classList.add("auth-mode");
}

// ===== Webapp links =====

function initHubUi() {
  document.querySelectorAll(".dash-action-card").forEach((card) => {
    card.addEventListener("click", () => {
      const action = card.dataset.action;
      const base = SITE_BASE();
      if (action === "notes") chrome.tabs.create({ url: base + "/notes" });
      if (action === "settings") chrome.tabs.create({ url: base + "/settings" });
      if (action === "webapp") chrome.tabs.create({ url: base });
      if (action === "login") showAuth();
    });
  });
}

// ===== Account & plans =====

const ACCOUNT_PLANS = [
  {
    id: "free",
    name: "Gratis",
    price: "0",
    tokensLabel: "30",
    tokensNote: "crediti/mese ≈ ~6 analisi",
    features: [
      "30 crediti / mese ≈ ~6 analisi",
      "Modello standard",
      "Editor web + rilevamento lingua",
      "Rilevamento errori base + spiegazione",
      "Supporto Community",
    ],
    popular: false,
  },
  {
    id: "starter",
    name: "Starter",
    price: "4.99",
    tokensLabel: "1.500",
    tokensNote: "crediti/mese ≈ ~300 analisi",
    features: [
      "1.500 crediti / mese ≈ ~300 analisi",
      "Review approfondite (Correzione + Revisione)",
      "Upload file (.py, .js, .ts…) + GitHub",
      "Export Markdown e link",
      "Supporto via Email",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "7.99",
    tokensLabel: "3.000",
    tokensNote: "crediti/mese ≈ ~600 analisi",
    features: [
      "3.000 crediti / mese ≈ ~600 analisi",
      "Tutti i tipi di analisi",
      "Fino a 5 file + ZIP + GitHub",
      "Modelli avanzati sbloccati",
      "Supporto prioritario",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Team",
    price: "—",
    tokensLabel: "—",
    tokensNote: "lista d'attesa",
    features: [
      "Fatturazione centralizzata su richiesta",
      "Fino a 20 file per richiesta",
      "Pool crediti condiviso su volumi concordati",
      "Tutti i tipi di analisi + modelli avanzati",
      "Supporto prioritario condiviso",
    ],
    popular: false,
  },
];

function currentPlanId() {
  if (currentUser?.plan) return currentUser.plan;
  return "free";
}

function renderPlans() {
  const list = $("plans-list");
  if (!list) return;

  const currentId = currentPlanId();

  list.innerHTML = ACCOUNT_PLANS.map((plan) => {
    const isCurrent = plan.id === currentId;
    const popularBadge = plan.popular
      ? `<span class="plan-card-popular">Più popolare</span>`
      : "";

    return `
      <div class="plan-card ${isCurrent ? "current" : ""}">
        <div class="plan-card-head">
          <div>
            <span class="plan-card-name">${plan.name}</span>
            ${popularBadge}
            ${isCurrent ? '<span class="plan-card-popular">Piano attuale</span>' : ""}
          </div>
          <span class="plan-card-tokens">${plan.tokensLabel} <span style="font-weight:500;color:var(--text-faint);">${plan.tokensNote}</span></span>
        </div>
        <div class="plan-card-price">
          ${plan.price === "0" ? "Sempre gratis" : "€" + plan.price + " /mese"}
        </div>
        <ul class="plan-card-features">
          ${plan.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
        </ul>
        <button class="btn btn-primary plan-card-cta" data-plan="${plan.id}">
          ${isCurrent ? "Piano attuale" : "Gestisci nella webapp"}
        </button>
      </div>
    `;
  }).join("");

  list.querySelectorAll(".plan-card-cta").forEach((btn) => {
    btn.onclick = () => {
      const planId = btn.dataset.plan;
      const base = SITE_BASE();
      if (planId === "free") {
        chrome.tabs.create({ url: base + "/register" });
      } else {
        chrome.tabs.create({ url: base + "/#prezzi" });
      }
    };
  });
}

async function fetchAccountPlan() {
  if (!currentUser || !currentToken) return;
  try {
    const api = getSharedApi();
    const res = api
      ? await api.fetch("/api/usage/stats")
      : await fetch(`${API_BASE}/api/usage/stats`, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
    const data = await res.json().catch(() => ({}));
    if (data?.plan) {
      currentUser.plan = data.plan;
      await storage.set({ user: currentUser });
      updateAccountSummary();
      renderPlans();
    }
  } catch (e) {
    console.warn("[Semplycode] Impossibile recuperare il piano:", e);
  }
}

function updateAccountSummary() {
  const nameEl = $("account-plan-name");
  const tokensEl = $("account-plan-tokens");
  const subtitle = $("account-subtitle");
  if (!nameEl || !tokensEl) return;

  const plan = ACCOUNT_PLANS.find((p) => p.id === currentPlanId()) || ACCOUNT_PLANS[0];

  nameEl.textContent = plan.id === "free" ? "Piano Gratuito" : "Piano " + plan.name;
  tokensEl.textContent = `${plan.tokensLabel} ${plan.tokensNote}${
    currentUser ? ` · ${currentUser.email}` : " · Accedi per sincronizzare"
  }`;
  if (subtitle) {
    subtitle.textContent = currentUser
      ? "Piano e abbonamento"
      : "Piano e abbonamento";
  }
}

// ===== Guided tour =====

const TOUR_STEPS = [
  {
    selector: '.nav-item[data-section="playground"]',
    title: "Playground",
    desc: "Incolla qui il tuo codice, premi Analizza e ottieni subito spiegazioni, fix e best practice con l'AI.",
  },
  {
    selector: '.nav-item[data-section="notes"]',
    title: "Cassetto note",
    desc: "Salva le spiegazioni utili nel cassetto per rivederle quando vuoi. Accedi per sincronizzarle.",
  },
  {
    selector: '.nav-item[data-section="account"]',
    title: "Account e piani",
    desc: "Qui trovi il tuo piano attuale, i token rimanenti e tutti i piani di abbonamento. Le azioni si completano nella webapp.",
  },
  {
    selector: '#tour-btn',
    title: "Guida sempre disponibile",
    desc: "Questo pulsante fa ripartire la guida in qualsiasi momento. Premi Avanti per concludere.",
  },
  {
    selector: '#theme-toggle',
    title: "Tema chiaro/scuro",
    desc: "Alterna il tema dell'estensione. La tua scelta viene ricordata al prossimo avvio.",
  },
];

let tourActive = false;
let tourIndex = 0;

function positionSpotlight(step) {
  const overlay = $("tour-overlay");
  const spotlight = $("tour-spotlight");
  const tooltip = $("tour-tooltip");
  if (!overlay || !spotlight || !tooltip) return;

  const target = document.querySelector(step.selector);
  if (!target) return;

  const rect = target.getBoundingClientRect();
  const pad = 6;
  const left = Math.max(4, rect.left - pad);
  const top = Math.max(4, rect.top - pad);
  const width = rect.width + pad * 2;
  const height = rect.height + pad * 2;

  spotlight.style.inset = "auto";
  spotlight.style.left = left + "px";
  spotlight.style.top = top + "px";
  spotlight.style.width = width + "px";
  spotlight.style.height = height + "px";
  spotlight.style.background = "rgba(16, 185, 129, 0.06)";
  spotlight.style.boxShadow =
    `0 0 0 9999px rgba(2, 6, 23, 0.55), ` +
    `0 0 0 2px var(--primary), 0 0 0 5px rgba(16, 185, 129, 0.3)`;

  const viewport = { w: window.innerWidth, h: window.innerHeight };
  const tooltipW = 320;
  const tooltipH = 200;
  const gap = 12;

  let leftPos = rect.left + rect.width / 2 - tooltipW / 2;
  leftPos = Math.max(12, Math.min(viewport.w - tooltipW - 12, leftPos));

  let topPos;
  if (rect.top > tooltipH + gap * 2) {
    topPos = rect.top - tooltipH - gap;
  } else {
    topPos = rect.bottom + gap;
  }
  topPos = Math.max(12, Math.min(viewport.h - tooltipH - 12, topPos));

  tooltip.style.left = leftPos + "px";
  tooltip.style.top = topPos + "px";
}

function tourTargetVisible(step) {
  const target = document.querySelector(step.selector);
  return target && target.offsetParent !== null;
}

function showTourStep() {
  const step = TOUR_STEPS[tourIndex];
  if (!step) return;

  if (!tourTargetVisible(step)) {
    nextTourStep();
    return;
  }

  const overlay = $("tour-overlay");
  const titleEl = $("tour-title");
  const descEl = $("tour-desc");
  const labelEl = $("tour-step-label");
  const prevBtn = $("tour-prev");
  const nextBtn = $("tour-next");

  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.textContent = step.desc;
  if (labelEl) labelEl.textContent = `${tourIndex + 1} / ${TOUR_STEPS.length}`;
  if (prevBtn) prevBtn.style.visibility = tourIndex === 0 ? "hidden" : "visible";
  if (nextBtn) nextBtn.textContent = tourIndex === TOUR_STEPS.length - 1 ? "Chiudi" : "Avanti";

  if (overlay) overlay.classList.add("show");
  positionSpotlight(step);
}

function nextTourStep() {
  tourIndex += 1;
  if (tourIndex >= TOUR_STEPS.length) {
    closeTour();
    return;
  }
  showTourStep();
}

function prevTourStep() {
  if (tourIndex <= 0) return;
  tourIndex -= 1;
  showTourStep();
}

function closeTour() {
  tourActive = false;
  tourIndex = 0;
  const overlay = $("tour-overlay");
  if (overlay) overlay.classList.remove("show");
  const spotlight = $("tour-spotlight");
  if (spotlight) spotlight.style.inset = "0";
}

function startTour() {
  if (tourActive) return;
  tourActive = true;
  tourIndex = 0;
  showTourStep();
}

function initTour() {
  const overlay = $("tour-overlay");
  if (!overlay) return;

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeTour();
  });

  const tooltip = $("tour-tooltip");
  if (tooltip) tooltip.addEventListener("click", (e) => e.stopPropagation());

  const tourBtn = $("tour-btn");
  if (tourBtn) tourBtn.onclick = startTour;

  const nextBtn = $("tour-next");
  const prevBtn = $("tour-prev");
  const skipBtn = $("tour-skip");
  if (nextBtn) nextBtn.onclick = nextTourStep;
  if (prevBtn) prevBtn.onclick = prevTourStep;
  if (skipBtn) skipBtn.onclick = closeTour;

  window.addEventListener("resize", () => {
    if (tourActive) showTourStep();
  });

  storage.get("tourSeen").then((r) => {
    if (!r.tourSeen) {
      storage.set({ tourSeen: true });
      setTimeout(startTour, 600);
    }
  });
}


// ===== Auth =====

function initAuth() {
  const emailStep = $("auth-email-step");
  const codeStep = $("auth-code-step");
  const emailInput = $("auth-email");
  const sendBtn = $("auth-send-code");
  const codeInput = $("auth-code");
  const verifyBtn = $("auth-verify");
  const resendBtn = $("auth-resend");
  const errorBox = $("auth-error");
  const emailDisplay = $("auth-email-display");

  let emailForCode = "";

  const showError = (msg) => {
    if (errorBox) {
      errorBox.textContent = msg;
      errorBox.style.display = "block";
    }
  };

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

      if (emailStep) emailStep.style.display = "none";
      if (codeStep) codeStep.style.display = "flex";

      startCodeExpiryTimer(60);

      if (data.reset) {
        startCooldownTimer(data.reset);
      } else {
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

      currentToken = data.token || null;
      currentUser = { email: data.user?.email || emailForCode };
      if (currentToken) {
        await storage.set({ token: currentToken, user: currentUser });
      }

      enterApp();
      fetchAccountPlan();
    } catch (err) {
      console.error("Errore verifica codice:", err);
      showError(err.message || "Errore durante la verifica del codice.");
    } finally {
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Verifica codice";
    }
  };

  let codeExpiryInterval = null;

  function startCodeExpiryTimer(seconds = 60) {
    const expiryEl = $("auth-code-expiry");
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

  function startCooldownTimer(endTime) {
    const cooldownEl = $("auth-cooldown");
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

  function resetCodeStepUI() {
    const expiryEl = $("auth-code-expiry");
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

  resendBtn.onclick = async () => {
    if (!emailForCode) return;

    resetCodeStepUI();
    resendBtn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/auth/send-login-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForCode }),
      });

      if (res.ok) {
        startCodeExpiryTimer(60);
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
  };
}

// ===== Chat / messages =====

function renderMarkdown(text) {
  if (!text) return "";
  let html = escapeHtml(text);

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^## (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^# (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^---$/gm, "<hr>");

  html = html.replace(/^(?:- (.+)\n?)+/gm, (match) => {
    const items = match
      .split("\n")
      .filter((l) => l.startsWith("- "))
      .map((l) => `<li>${l.slice(2)}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  html = html.replace(/^(?:\d+\. (.+)\n?)+/gm, (match) => {
    const items = match
      .split("\n")
      .filter((l) => /^\d+\. /.test(l))
      .map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  html = html.replace(/\n\n/g, "</p><p>");
  html = html.replace(/\n/g, "<br>");

  if (!html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }

  return `<div class="markdown">${html}</div>`;
}

function addMessage(role, text) {
  const container = $("chat-messages");
  if (!container) return;

  const div = document.createElement("div");
  div.className = role === "user" ? "msg msg-user" : "msg msg-ai";
  if (role === "user") {
    div.textContent = text;
  } else {
    div.innerHTML = renderMarkdown(text);
  }

  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  chatMessages.push({ role, content: text });
}

function addLoadingMessage() {
  const container = $("chat-messages");
  const div = document.createElement("div");
  div.className = "msg msg-loading";
  div.innerHTML = `Analisi in corso<span class="dots"></span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function addStreamingMessage() {
  const container = $("chat-messages");
  const div = document.createElement("div");
  div.className = "msg msg-ai msg-streaming";
  div.dataset.raw = "";
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return {
    el: div,
    append(chunk) {
      div.dataset.raw += chunk;
      div.innerHTML = renderMarkdown(div.dataset.raw);
      container.scrollTop = container.scrollHeight;
    },
    finalize() {
      div.classList.remove("msg-streaming");
      const final = div.dataset.raw;
      div.innerHTML = renderMarkdown(final);
      return final;
    },
  };
}

function clearChat() {
  const container = $("chat-messages");
  if (container) container.innerHTML = "";
  chatMessages = [];
  lastAssistantReply = "";
}

async function sendToAI(messages) {
  const res = await apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ messages, stream: false }),
  });

  if (!res.ok) {
    let data = {};
    try { data = await res.json(); } catch (_) {}
    throw new Error(data.error || `Errore ${res.status} dal server AI`);
  }

  const data = await res.json();
  // support both {message:{content}} and {choices:[{message:{content}}]}
  return data?.message?.content || data?.choices?.[0]?.message?.content || "";
}

async function sendToAIStream(messages, onChunk, onDone, onError, extraMode) {
  try {
    const modeToSend = extraMode || (typeof currentMode !== 'undefined' ? currentMode : 'correction');
    const res = await apiFetch("/chat", {
      method: "POST",
      body: JSON.stringify({ messages, stream: true, analysisType: modeToSend }),
    });

    if (!res.ok) {
      let data = {};
      try { data = await res.json(); } catch (_) {}
      onError(data.error || `Errore ${res.status} dal server AI`);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.slice(5).trim();
        if (!dataStr || dataStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.done) { onDone(fullContent); return; }
          const chunk = parsed.content || parsed?.choices?.[0]?.delta?.content || "";
          if (chunk) { fullContent += chunk; onChunk(chunk); }
        } catch (_) {}
      }
    }
    onDone(fullContent);
  } catch (err) {
    if (err.name !== "AbortError") onError(err.message || "Errore di streaming");
  }
}

let currentMode = "correction";
const MODE_HINTS = {
  correction: "Correzione — corregge solo gli errori nel codice.",
  revision: "Revisione — ripulisce e ottimizza il codice.",
  creation: "Creazione — ti guida passo-passo a costruire progetti in ogni linguaggio.",
};
function updateModeHint() {
  const hint = $("mode-hint");
  if (!hint) return;
  hint.textContent = MODE_HINTS[currentMode] || "";
  hint.style.display = hint.textContent ? "block" : "none";
  const btn = $("analyze-btn");
  if (btn) {
    if (currentMode === "creation") btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Crea';
    else if (currentMode === "revision") btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Revisiona';
    else btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Analizza';
  }
}

function initPlayground() {
  const analyzeBtn = $("analyze-btn");
  const chatInput = $("chat-input");
  const chatSend = $("chat-send");
  const modeSelect = $("mode-select");

  if (modeSelect) {
    try { const saved = localStorage.getItem("semplycode:mode"); if (saved) currentMode = saved; } catch(_) {}
    modeSelect.value = currentMode;
    updateModeHint();
    modeSelect.onchange = () => {
      currentMode = modeSelect.value;
      try { localStorage.setItem("semplycode:mode", currentMode); } catch(_) {}
      updateModeHint();
    };
  }

  if (!analyzeBtn) return;

  const saveNoteBtn = $("save-note-btn");
  if (saveNoteBtn) {
    saveNoteBtn.onclick = () => {
      if (!currentToken) {
        showToast("Accedi per salvare le note nel cassetto.");
        showAuth();
        return;
      }
      saveCurrentNote();
    };
  }

  const copyNoteBtn = $("copy-note-btn");
  if (copyNoteBtn) {
    copyNoteBtn.onclick = async () => {
      if (!lastAssistantReply) {
        showToast("Nessuna risposta da copiare.");
        return;
      }
      try {
        await navigator.clipboard.writeText(lastAssistantReply);
        copyNoteBtn.textContent = "Copiato";
        setTimeout(() => (copyNoteBtn.textContent = "Copia"), 1500);
      } catch (e) {
        showToast("Impossibile copiare: " + e.message);
      }
    };
  }

  function setAnalyzing(on) {
    analyzeBtn.disabled = on;
    analyzeBtn.textContent = on ? "Analisi..." : "Analizza";
  }

  analyzeBtn.onclick = async () => {
    const code = getEditorValue().trim();
    if (!code) { showToast("Inserisci del codice nell'editor"); return; }

    lastAnalyzedCode = code;
    storage.set({ draftCode: code });
    clearChat();
    const modeLabel = currentMode === 'creation' ? 'Crea progetto' : currentMode === 'revision' ? 'Revisiona questo codice' : 'Correggi questo codice';
    addMessage("user", modeLabel);
    setAnalyzing(true);

    const systemPrompts = {
      correction: "Sei un esperto Code Reviewer italiano in modalità CORREZIONE: correggi SOLO gli errori sintattici/logici, senza ottimizzazioni extra. Mostra errori e codice corretto minimo.",
      revision: "Sei un esperto Code Reviewer italiano in modalità REVISIONE: correggi, ripulisci e ottimizza il codice (naming, DRY, performance, leggibilità). Fornisci codice revisionato e best practice.",
      creation: "Sei un tutor italiano in modalità CREAZIONE: guida passo-passo la costruzione del progetto dal nulla. Prerequisiti, struttura cartelle, ogni passo con comandi e snippet in ogni linguaggio, fino a progetto funzionante.",
    };
    const messages = [
      { role: "system", content: systemPrompts[currentMode] || systemPrompts.correction },
      { role: "user", content: `Modalità: ${currentMode}\nCodice/contesto:\n\`\`\`\n${code}\n\`\`\`` },
    ];

    const streaming = addStreamingMessage();
    sendToAIStream(
      messages,
      (chunk) => streaming.append(chunk),
      (full) => {
        lastAssistantReply = streaming.finalize();
        chatMessages.push({ role: "assistant", content: lastAssistantReply });
        setAnalyzing(false);
      },
      (err) => {
        streaming.el.remove();
        addMessage("assistant", "Errore: " + err);
        setAnalyzing(false);
      }
    );
  };

  const sendChat = async () => {
    const question = chatInput.value.trim();
    if (!question) return;

    const code = getEditorValue().trim();
    addMessage("user", question);
    chatInput.value = "";
    chatSend.disabled = true;

    const systemCtx = code
      ? `L'utente sta lavorando su questo codice:\n\`\`\`\n${code}\n\`\`\`\nRispondi in italiano in modo chiaro e utile.`
      : "Sei un esperto di programmazione. Rispondi in italiano in modo chiaro e utile.";

    const messages = [
      { role: "system", content: systemCtx },
      ...chatMessages.slice(-8),
    ];

    const streaming = addStreamingMessage();
    sendToAIStream(
      messages,
      (chunk) => streaming.append(chunk),
      (full) => {
        lastAssistantReply = streaming.finalize();
        chatMessages.push({ role: "assistant", content: lastAssistantReply });
        chatSend.disabled = false;
      },
      (err) => {
        streaming.el.remove();
        addMessage("assistant", "Errore: " + err);
        chatSend.disabled = false;
      }
    );
  };

  chatSend.onclick = sendChat;
  chatInput.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); }
  };
}

// ===== Revision (prosa) =====

async function handleRevision(text) {
  if (!text || !text.trim()) return;
  const nav = document.querySelector('.nav-item[data-section="playground"]');
  if (nav) nav.click();
  if (!codeEditor && !$("code-editor-fallback")) await initCodeEditor();
  clearChat();
  // Mostra il testo originale come messaggio utente
  addMessage("user", `Rivedi questa scrittura:\n\n"${text.slice(0, 4000)}"`);
  const systemPrompt = `Sei un correttore di bozze esperto in italiano (e inglese se il testo è in inglese). Correggi ortografia, grammatica, punteggiatura e stile.
Rispondi in italiano con questa struttura Markdown:
## Testo rivisto
[versione corretta e fluida, pronta da copiare]

## Correzioni principali
- [elenco puntato delle modifiche più importanti]

## Suggerimenti di stile
- [eventuali consigli per migliorare chiarezza/concisioni]

Mantieni il significato originale, non aggiungere contenuti nuovi. Se il testo è codice, segnalalo.`;
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ];
  const streaming = addStreamingMessage();
  sendToAIStream(
    messages,
    (chunk) => streaming.append(chunk),
    (full) => {
      lastAssistantReply = streaming.finalize();
      chatMessages.push({ role: "assistant", content: lastAssistantReply });
    },
    (err) => {
      streaming.el.remove();
      addMessage("assistant", "Errore revisione: " + err);
    }
  );
}

async function loadReviseTextFromStorage() {
  const data = await storage.get("reviseText");
  if (data.reviseText) {
    const txt = data.reviseText;
    await storage.remove("reviseText");
    handleRevision(txt);
  }
}

// ===== Context menu code =====

async function loadSelectedCodeFromContextMenu(autoAnalyze = false) {
  const data = await storage.get("selectedCode");
  if (data.selectedCode) {
    setEditorValue(data.selectedCode);
    await storage.remove("selectedCode");

    if (autoAnalyze) {
      setTimeout(() => {
        const btn = $("analyze-btn");
        if (btn) btn.click();
      }, 400);
    }
  }
}

// ===== Notes (Cassetto) =====

async function saveCurrentNote() {
  const code = lastAnalyzedCode || getEditorValue().trim();
  const explanation = lastAssistantReply;
  if (!code || !explanation) {
    showToast("Analizza prima un codice per poterlo salvare nel cassetto.");
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

    apiFetch(`/notes/${data.note.id}/categorize`, { method: "POST" }).catch(() => {});
    lastAssistantReply = "";
    showToast("Nota salvata nel cassetto");
  } catch (err) {
    showToast("Errore: " + err.message);
  }
}

async function loadNotes() {
  const listEl = $("notes-list");
  const detailEl = $("notes-detail");
  const subtitle = $("notes-subtitle");
  if (!listEl) return;

  detailEl.style.display = "none";
  listEl.style.display = "flex";

  if (!currentToken) {
    listEl.innerHTML =
      '<div class="notes-empty">Accedi per usare il cassetto delle note.<br/><button id="notes-login-prompt" class="btn btn-primary">Accedi ora</button></div>';
    $("notes-login-prompt")?.addEventListener("click", () => {
      showAuth();
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
  const listEl = $("notes-list");
  const detailEl = $("notes-detail");
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
      <button id="notes-back" class="btn btn-soft" style="width:auto; padding:6px 14px; font-size:12px; margin-bottom:12px;">← Torna al cassetto</button>
      <div class="notes-detail-card">
        <div class="note-title">${escapeHtml(n.title || "Nota di codice")}</div>
        <div class="note-meta">${escapeHtml(n.language)} · ${new Date(n.created_at).toLocaleDateString("it-IT")}${sourceHost ? ` · da ${escapeHtml(sourceHost)}` : ""}</div>
        ${(n.categories || []).length ? `<div style="margin-bottom:10px;">${n.categories.map((c) => `<span class="notes-chip">${escapeHtml(c.name)}</span>`).join("")}</div>` : ""}
        <div class="notes-label">Codice originale</div>
        <pre class="notes-code">${escapeHtml(n.snippet_code)}</pre>
        <div class="notes-label">Spiegazione</div>
        <div class="notes-explain">${escapeHtml(n.explanation).replace(/\n/g, "<br/>")}</div>
        ${n.related && n.related.length ? `<div class="notes-label">Note correlate</div>${n.related.map((r) => `<div class="notes-related">${escapeHtml(r.title)}</div>`).join("")}` : ""}
        <div class="note-actions">
          <button id="notes-open-webapp" class="btn btn-primary">Apri nel cassetto (webapp)</button>
          <button id="notes-delete" class="btn btn-danger">Elimina</button>
        </div>
      </div>`;

    $("notes-back").addEventListener("click", () => {
      detailEl.style.display = "none";
      listEl.style.display = "flex";
      loadNotes();
    });
    $("notes-open-webapp").addEventListener("click", () => {
      chrome.tabs.create({ url: `${SITE_BASE()}/notes?note=${noteId}` });
    });
    $("notes-delete").addEventListener("click", async () => {
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

// ===== Polling note =====

let notesRefreshTimer = null;

function startNotesPolling() {
  stopNotesPolling();
  notesRefreshTimer = setInterval(() => {
    const detailEl = $("notes-detail");
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

// ===== Navigation =====

function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = {
    playground: $("section-playground"),
    notes: $("section-notes"),
    account: $("section-account"),
  };

  function activate(sectionName) {
    navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.section === sectionName);
    });

    Object.keys(sections).forEach((key) => {
      const el = sections[key];
      if (!el) return;
      el.classList.toggle("active", key === sectionName);
    });
  }

  navItems.forEach((item) => {
    // Theme/lang/tour hanno classe nav-item ma NON sono sezioni: non devono
    // sovrascrivere l'onclick impostato da initTheme()/initTour().
    if (!item.dataset.section) return;
    item.onclick = () => {
      const target = item.dataset.section;
      if (!target) return;
      activate(target);
      if (target === "playground") {
        if (!codeEditor && !$("code-editor-fallback")) {
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
    };
  });

  const initial = document.querySelector(".nav-item.active") || navItems[0];
  if (initial) {
    activate(initial.dataset.section || "playground");
  }
}

// ===== Account =====

function populateAccount() {
  const chip = $("user-chip");
  const userEmailEl = $("user-email");
  const logoutBtn = $("logout-btn");

  if (chip) chip.style.display = "inline-flex";
  if (userEmailEl) userEmailEl.textContent = currentUser?.email || "Ospite";
  if (logoutBtn) logoutBtn.style.display = currentUser ? "inline-flex" : "none";

  updateAccountSummary();
}

function initSettings() {
  const logoutBtn = $("logout-btn");

  const logout = async () => {
    await storage.remove(["token", "user"]);
    currentToken = null;
    currentUser = null;
    populateAccount();
    showAuth();
  };

  if (logoutBtn) logoutBtn.onclick = logout;
}

// ===== Main init =====

function enterApp() {
  showApp();
  initNavigation();
  initHubUi();
  initPlayground();
  loadSelectedCodeFromContextMenu(true);
  loadReviseTextFromStorage();
  initCodeEditor();
  initSettings();
  initTour();
  populateAccount();
  fetchAccountPlan();
}

async function init() {
  await initApiBase();
  await initTheme();
  initAuth();

  if (DEV_BYPASS_AUTH) {
    currentUser = { email: "dev@local" };
    enterApp();
    return;
  }

  // Flusso auth-first: senza sessione salvata l'estensione resta sulla
  // schermata di accesso (login con codice email).
  const saved = await storage.get(["token", "user"]);
  if (saved.token && saved.user) {
    currentToken = saved.token;
    currentUser = saved.user;
    enterApp();
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "start-analysis" && msg.code) {
    const apply = async () => {
      setEditorValue(msg.code);
      if (!codeEditor) await initCodeEditor();
      const nav = document.querySelector('.nav-item[data-section="playground"]');
      if (nav) nav.click();
      setTimeout(() => $("analyze-btn")?.click(), 500);
    };
    apply();
  }
  if (msg.action === "start-revision" && msg.text) {
    handleRevision(msg.text);
  }
});

init();