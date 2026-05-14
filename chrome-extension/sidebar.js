const API_BASE = "http://localhost:3000/api";
const EXTENSION_LOGIN_FLOW = true;

// ============================================
// DOM Elements
// ============================================

const authScreen = document.getElementById("authScreen");
const appScreen = document.getElementById("appScreen");

const authTabs = document.querySelectorAll(".auth-tab");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
// Google login removed; googleLoginBtn intentionally undefined
const googleLoginBtn = null;
const regFirstName = document.getElementById("regFirstName");
const regLastName = document.getElementById("regLastName");
const regEmail = document.getElementById("regEmail");
const regPassword = document.getElementById("regPassword");
const registerBtn = document.getElementById("registerBtn");
const registerError = document.getElementById("registerError");
const registerSuccess = document.getElementById("registerSuccess");

const userGreeting = document.getElementById("userGreeting");
const dashboardUserName = document.getElementById("dashboardUserName");
const logoutBtn = document.getElementById("logoutBtn");
const logoutBtnPricing = document.getElementById("logoutBtnPricing");
const codeInput = document.getElementById("codeInput");
const langBadge = document.getElementById("langBadge");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const analysisContent = document.getElementById("analysisContent");
const loadingIndicator = document.getElementById("loadingIndicator");

// ============================================
// Auth Tab Switching
// ============================================

authTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    authTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const target = tab.dataset.tab;
    if (target === "login") {
      loginForm.classList.remove("hidden");
      registerForm.classList.add("hidden");
    } else {
      loginForm.classList.add("hidden");
      registerForm.classList.remove("hidden");
    }

    hideMessages();
  });
});

function hideMessages() {
  loginError.classList.add("hidden");
  registerError.classList.add("hidden");
  registerSuccess.classList.add("hidden");
}

// ============================================
// Section Navigation
// ============================================

const navIcons = document.querySelectorAll(".nav-icon");
const appSections = document.querySelectorAll(".app-section");

navIcons.forEach((icon) => {
  icon.addEventListener('click', () => {
    const section = icon.dataset.section;
    
    // Update nav icons
    navIcons.forEach((i) => i.classList.remove('active'));
    icon.classList.add('active');
    
    // Update sections
    appSections.forEach((sec) => {
      sec.classList.remove('active');
      if (sec.id === section + 'Section') {
        sec.classList.add('active');
      }
    });
  });
});

// Quick Actions navigation
const actionCards = document.querySelectorAll('.action-card[data-section]');
actionCards.forEach((card) => {
  card.addEventListener('click', () => {
    const section = card.dataset.section;
    const targetIcon = document.querySelector(`.nav-icon[data-section="${section}"]`);
    if (targetIcon) {
      targetIcon.click();
    }
  });
});

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove("hidden");
}

// ============================================
// API Helper
// ============================================

async function apiCall(endpoint, body) {
  const url = `${API_BASE}${endpoint}`;
  console.log("[Semplycode] API call:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("[Semplycode] Response status:", res.status);

  const text = await res.text();
  console.log("[Semplycode] Response body:", text);

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Il server ha risposto con un formato non valido.");
  }

  return { ok: res.ok, status: res.status, data };
}

// ============================================
// Login
// ============================================

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessages();

  const email = loginEmail.value.trim();
  const password = loginPassword.value;

  if (EXTENSION_LOGIN_FLOW) {
    // New flow: request a one-time code sent to email (modal UI)
    if (!email) {
      showError(loginError, "Inserisci email.");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Invio codice...";

      try {
      const { ok, data } = await apiCall("/auth/send-login-code", { email });
      if (!ok) throw new Error(data.error || "Errore durante l'invio del codice.");

      // Persist rate limit info so modal can show remaining/reset even after reopen
      try {
        if (data?.reset) {
          chrome.storage.local.set({ resendCooldownReset: data.reset });
        }
        if (typeof data?.remaining !== 'undefined') {
          chrome.storage.local.set({ resendRemaining: data.remaining });
        }
      } catch (e) {
        console.warn('Could not persist rate limit info:', e);
      }

      // show modal
      const codeModal = document.getElementById('codeModal');
      const codeInputModal = document.getElementById('codeInputModal');
      const verifyCodeBtn = document.getElementById('verifyCodeBtn');
      const resendCodeBtn = document.getElementById('resendCodeBtn');
      const codeError = document.getElementById('codeError');

      codeInputModal.value = '';
      codeError.classList.add('hidden');
      codeModal.classList.remove('hidden');

      verifyCodeBtn.onclick = async () => {
        const code = codeInputModal.value.trim();
        if (!code) {
          codeError.textContent = 'Inserisci il codice';
          codeError.classList.remove('hidden');
          return;
        }
        verifyCodeBtn.disabled = true;
        try {
          const verify = await apiCall('/auth/verify-login-code', { email, code });
          if (!verify.ok) throw new Error(verify.data.error || 'Verifica fallita');

          await chrome.storage.local.set({ token: verify.data.token, user: verify.data.user });
          chrome.runtime.sendMessage({ type: 'AUTH_STATE_CHANGED', payload: { authenticated: true, user: verify.data.user } });
          codeModal.classList.add('hidden');
          showApp(verify.data.user);
        } catch (err) {
          codeError.textContent = err.message || 'Verifica fallita';
          codeError.classList.remove('hidden');
        } finally {
          verifyCodeBtn.disabled = false;
        }
      };

      // Resend with countdown, disable and attempts remaining display
      let resendCooldown = 30; // seconds
      let resendTimer = null;
      const attemptsInfo = document.createElement('div');
      attemptsInfo.id = 'attemptsInfo';
      attemptsInfo.style.fontSize = '12px';
      attemptsInfo.style.color = '#94a3b8';
      attemptsInfo.style.marginTop = '6px';
      attemptsInfo.textContent = '';
      const modalInner = codeModal.querySelector('.code-modal-inner');
      if (modalInner && !document.getElementById('attemptsInfo')) modalInner.appendChild(attemptsInfo);

      const formatMsToMMSS = (ms) => {
        const s = Math.max(0, Math.ceil(ms / 1000));
        const mm = String(Math.floor(s / 60)).padStart(2, '0');
        const ss = String(s % 60).padStart(2, '0');
        return `${mm}:${ss}`;
      };

      const startResendCooldown = (seconds, remaining) => {
        resendCooldown = seconds;
        resendCodeBtn.disabled = true;
        resendCodeBtn.textContent = `Invia di nuovo (${resendCooldown}s)`;
        // persist cooldown end time
        const resetAt = Date.now() + resendCooldown * 1000;
        chrome.storage.local.set({ resendCooldownReset: resetAt });
        // show attempts + human friendly reset
        const updateAttemptsText = (secsLeft, rem) => {
          const timeText = formatMsToMMSS(secsLeft * 1000);
          if (rem != null) {
            attemptsInfo.textContent = `Tentativi rimanenti: ${rem} • Riprova tra ${timeText}`;
          } else {
            attemptsInfo.textContent = `Riprova tra ${timeText}`;
          }
        };

        updateAttemptsText(resendCooldown, remaining);

        resendTimer = setInterval(() => {
          resendCooldown -= 1;
          if (resendCooldown <= 0) {
            clearInterval(resendTimer);
            resendTimer = null;
            resendCodeBtn.disabled = false;
            resendCodeBtn.textContent = 'Invia di nuovo';
            attemptsInfo.textContent = '';
            chrome.storage.local.remove('resendCooldownReset');
          } else {
            resendCodeBtn.textContent = `Invia di nuovo (${resendCooldown}s)`;
            updateAttemptsText(resendCooldown, remaining);
          }
        }, 1000);
      };

      // Expose RATE_LIMIT_MAX from server-side default if available (best-effort)
      const RATE_LIMIT_MAX = 3;

      resendCodeBtn.onclick = async () => {
        // If already cooling down, ignore
        if (resendCodeBtn.disabled) return;
        try {
          const again = await apiCall('/auth/send-login-code', { email });
          if (!again.ok) {
            // Persist remaining/reset if present in error response
            const errRem = again.data?.remaining;
            const errReset = again.data?.reset;
            if (errReset) chrome.storage.local.set({ resendCooldownReset: errReset });
            if (typeof errRem !== 'undefined') chrome.storage.local.set({ resendRemaining: errRem });
            throw new Error(again.data.error || 'Impossibile inviare codice');
          }

          // If server returns remaining/reset, persist and use it to set cooldown
          const remaining = again.data?.remaining;
          const reset = again.data?.reset;
          try {
            if (reset) {
              chrome.storage.local.set({ resendCooldownReset: reset });
            }
            if (typeof remaining !== 'undefined') {
              chrome.storage.local.set({ resendRemaining: remaining });
            }
          } catch (e) {
            console.warn('Could not persist rate limit info on resend:', e);
          }

          if (reset) {
            const msLeft = Math.max(0, reset - Date.now());
            startResendCooldown(Math.ceil(msLeft / 1000), remaining);
          } else {
            startResendCooldown(30, remaining);
          }
        } catch (err) {
          // show inline error instead of alert
          const codeError = document.getElementById('codeError');
          codeError.textContent = err.message || 'Errore durante l\'invio.';
          codeError.classList.remove('hidden');
        }
      };

      // On modal open, check persisted cooldown
      chrome.storage.local.get(['resendCooldownReset', 'resendRemaining'], (items) => {
        const resetAt = items?.resendCooldownReset;
        const rem = typeof items?.resendRemaining !== 'undefined' ? items.resendRemaining : null;
        if (resetAt) {
          const msLeft = resetAt - Date.now();
          if (msLeft > 0) {
            startResendCooldown(Math.ceil(msLeft / 1000), rem);
          } else {
            chrome.storage.local.remove(['resendCooldownReset', 'resendRemaining']);
          }
        }
      });

    } catch (err) {
      showError(loginError, err.message);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Accedi';
    }
    return;
  }
});

// Google login removed from extension

// ============================================
// Register
// ============================================

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessages();

  const firstName = regFirstName.value.trim();
  const lastName = regLastName.value.trim();
  const email = regEmail.value.trim();
  const password = regPassword.value;

  if (!firstName || !lastName || !email || !password) {
    showError(registerError, "Compila tutti i campi.");
    return;
  }

  if (password.length < 6) {
    showError(registerError, "La password deve avere almeno 6 caratteri.");
    return;
  }

    registerBtn.disabled = true;
    registerBtn.textContent = "Creazione account...";

    try {
      // Use unified register endpoint
      const { ok, data } = await apiCall("/auth/register", {
        firstName,
        lastName,
        email,
        password,
      });

      if (!ok) {
        throw new Error(data.error || "Errore durante la registrazione.");
      }

      registerSuccess.textContent = "Account creato! Effettua il login per continuare.";
      registerSuccess.classList.remove("hidden");
      registerForm.reset();

      setTimeout(() => {
        authTabs.forEach((t) => t.classList.remove("active"));
        authTabs[0].classList.add("active");
        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");
        hideMessages();
        loginEmail.value = email;
        loginPassword.value = "";
        loginPassword.focus();
      }, 2000);
    } catch (error) {
      showError(registerError, error.message);
    } finally {
      registerBtn.disabled = false;
      registerBtn.textContent = "Crea Account";
    }
});

// ============================================
// Logout
// ============================================

logoutBtn.addEventListener("click", async () => {
  await chrome.storage.local.remove(["token", "user"]);
  showAuth();
});

if (logoutBtnPricing) {
  logoutBtnPricing.addEventListener("click", async () => {
    await chrome.storage.local.remove(["token", "user"]);
    showAuth();
  });
}

// ============================================
// Code Analysis
// ============================================

analyzeBtn.addEventListener("click", analyzeCode);

clearBtn.addEventListener("click", () => {
  codeInput.value = "";
  langBadge.textContent = "";
  langBadge.classList.add("hidden");
  analysisContent.innerHTML = `
    <div class="empty-state">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
      <p>Inserisci del codice e clicca "Analizza"<br/>per ricevere suggerimenti dall'AI</p>
    </div>
  `;
  codeInput.focus();
});

codeInput.addEventListener("input", () => {
  const code = codeEditor ? codeEditor.getValue() : codeInput.value;
  if (code.trim().length > 3) {
    const lang = detectLanguage(code);
    langBadge.textContent = lang;
    langBadge.classList.remove("hidden");
  } else {
    langBadge.textContent = "";
    langBadge.classList.add("hidden");
  }
});

// Auto-completion and indentation
codeInput.addEventListener("keydown", (e) => {
  const start = codeInput.selectionStart;
  const end = codeInput.selectionEnd;
  const value = codeInput.value;

  // Tab → indent
  if (e.key === "Tab") {
    e.preventDefault();
    if (e.shiftKey) {
      // Outdent: remove 2 spaces before cursor
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const linePrefix = value.substring(lineStart, start);
      if (linePrefix.startsWith("  ")) {
        codeInput.value = value.substring(0, lineStart) + value.substring(lineStart + 2);
        codeInput.selectionStart = codeInput.selectionEnd = start - 2;
      }
    } else {
      codeInput.value = value.substring(0, start) + "  " + value.substring(end);
      codeInput.selectionStart = codeInput.selectionEnd = start + 2;
    }
    return;
  }

  // Auto-close brackets
  const pairs = { "(": ")", "[": "]", "{": "}" };
  if (pairs[e.key]) {
    e.preventDefault();
    const close = pairs[e.key];
    // If text is selected, wrap it
    if (start !== end) {
      const selected = value.substring(start, end);
      codeInput.value = value.substring(0, start) + e.key + selected + close + value.substring(end);
      codeInput.selectionStart = start + 1;
      codeInput.selectionEnd = end + 1;
    } else {
      codeInput.value = value.substring(0, start) + e.key + close + value.substring(end);
      codeInput.selectionStart = codeInput.selectionEnd = start + 1;
    }
    return;
  }

  // Auto-close quotes
  const quotes = ["'", '"', "`"];
  if (quotes.includes(e.key)) {
    // If next char is the same quote, skip over it
    if (value[start] === e.key) {
      e.preventDefault();
      codeInput.selectionStart = codeInput.selectionEnd = start + 1;
      return;
    }
    e.preventDefault();
    if (start !== end) {
      const selected = value.substring(start, end);
      codeInput.value = value.substring(0, start) + e.key + selected + e.key + value.substring(end);
      codeInput.selectionStart = start + 1;
      codeInput.selectionEnd = end + 1;
    } else {
      codeInput.value = value.substring(0, start) + e.key + e.key + value.substring(end);
      codeInput.selectionStart = codeInput.selectionEnd = start + 1;
    }
    return;
  }

  // Skip over closing bracket if already present
  const closers = [")", "]", "}"];
  if (closers.includes(e.key) && value[start] === e.key) {
    e.preventDefault();
    codeInput.selectionStart = codeInput.selectionEnd = start + 1;
    return;
  }

  // Enter → auto-indent
  if (e.key === "Enter") {
    e.preventDefault();
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const currentLine = value.substring(lineStart, start);
    const indent = currentLine.match(/^\s*/)[0];
    const charBefore = value[start - 1];
    const charAfter = value[start];

    // After {, [, (: extra indent + closing on next line
    if (["{", "(", "["].includes(charBefore)) {
      const closer = { "{": "}", "(": ")", "[": "]" }[charBefore];
      codeInput.value =
        value.substring(0, start) +
        "\n" + indent + "  " +
        "\n" + indent +
        value.substring(start);
      codeInput.selectionStart = codeInput.selectionEnd = start + indent.length + 3;
    } else {
      codeInput.value = value.substring(0, start) + "\n" + indent + value.substring(end);
      codeInput.selectionStart = codeInput.selectionEnd = start + indent.length + 1;
    }
    return;
  }
});

// Password toggle
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const input = document.getElementById(targetId);
    const eyeIcon = btn.querySelector(".eye-icon");
    const eyeOffIcon = btn.querySelector(".eye-off-icon");

    if (input.type === "password") {
      input.type = "text";
      eyeIcon.classList.add("hidden");
      eyeOffIcon.classList.remove("hidden");
    } else {
      input.type = "password";
      eyeIcon.classList.remove("hidden");
      eyeOffIcon.classList.add("hidden");
    }
  });
});

function detectLanguage(code) {
  if (/^\s*import\s+.*\s+from\s+['"].*['"]/.test(code) || /const |let |var |function |=>\s*{/.test(code))
    return "javascript";
  if (/def\s+\w+\(.*\):|import\s+\w+|print\(.*\)/.test(code)) return "python";
  if (/<[a-z][\s\S]*>/i.test(code)) return "html";
  if (/[a-z-]+\s*:\s*[^;]+;/.test(code) && /[{}]/.test(code)) return "css";
  if (/public\s+(static\s+)?void|System\.out\./.test(code)) return "java";
  if (/#include|printf|scanf|int\s+main/.test(code)) return "c";
  if (/func\s+\w+\(|package\s+main/.test(code)) return "go";
  if (/fn\s+\w+|let\s+mut|println!/.test(code)) return "rust";
  return "javascript";
}

async function analyzeCode() {
  const code = codeInput.value.trim();

  if (!code) {
    analysisContent.innerHTML =
      '<div class="analysis-error">Inserisci del codice da analizzare.</div>';
    return;
  }

  const { token } = await chrome.storage.local.get("token");

  if (!token) {
    analysisContent.innerHTML =
      '<div class="analysis-error">Sessione scaduta. Effettua nuovamente il login.</div>';
    showAuth();
    return;
  }

  analyzeBtn.disabled = true;
  loadingIndicator.classList.remove("hidden");

  try {
    const detectedLang = detectLanguage(code);

    const response = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'llama3',
        messages: [
          {
            role: "system",
            content:
              "Sei un esperto programmatore e code reviewer. Analizza il codice fornito in modo conciso e strutturato. Fornisci: 1) Problemi o bug trovati, 2) Suggerimenti di ottimizzazione, 3) Best practices applicabili, 4) Se necessario, una versione ottimizzata del codice. Usa markdown per formattare la risposta.",
          },
          {
            role: "user",
            content: `Analizza questo codice ${detectedLang}:\n\n\`\`\`${detectedLang}\n${code}\n\`\`\``,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await chrome.storage.local.remove(["token", "user"]);
        showAuth();
        throw new Error("Sessione scaduta. Effettua nuovamente il login.");
      }
      throw new Error(data.error || "Errore durante l'analisi.");
    }

    analysisContent.innerHTML = renderMarkdown(data.message.content);
  } catch (error) {
    analysisContent.innerHTML = `<div class="analysis-error">${escapeHtml(error.message)}</div>`;
  } finally {
    analyzeBtn.disabled = false;
    loadingIndicator.classList.add("hidden");
  }
}

// ============================================
// Markdown Renderer
// ============================================

function renderMarkdown(text) {
  if (!text) return "";

  let html = escapeHtml(text);

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
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

  return `<div class="response-content">${html}</div>`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ============================================
// Screen Management
// ============================================

function showAuth() {
  authScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
  loginEmail.value = "";
  loginPassword.value = "";
  hideMessages();
  
  // Clear stored token to force fresh login
  chrome.storage.local.remove(["token", "user"]);
}

function showApp(user) {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");

  if (user) {
    const name = user.firstName || user.email.split("@")[0];
    userGreeting.textContent = `Ciao, ${name}`;
    if (dashboardUserName) {
      dashboardUserName.textContent = name;
    }
  }
}

// ============================================
// JWT Utilities
// ============================================

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// ============================================
// Init
// ============================================

async function init() {
  try {
    // Check for pending OAuth result first
    const { token, user: storedUser } = await chrome.storage.local.get(['token', 'user']);

    if (token && storedUser && !isTokenExpired(token)) {
      showApp(storedUser);
    } else {
      if (token) {
        await chrome.storage.local.remove(['token', 'user']);
      }
      showAuth();
    }
  } catch {
    showAuth();
  }
}

// No extension-side OAuth flows. Keep message listener for auth state updates only.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'AUTH_UPDATE') {
    // The background may relay auth updates; re-init to refresh UI state
    init();
  }
});

init();
