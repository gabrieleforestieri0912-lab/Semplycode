# Architettura: Estensione Chrome ↔ Webapp — SemplyCode

> Principio guida: **stessa identità, stesso account, stesso "cervello" AI —
> esperienze diverse per contesti diversi.**
> Stato: **Fasi 1-4 implementate**. Data: 2026-08-13.

---

## 1. Stato attuale (analisi basata sul codice esistente)

### Webapp — Next.js 16 (App Router) + Supabase
- **Auth**: Supabase Auth (password, OAuth, OTP email) con **sessione a cookie httpOnly**. Identità utente = **email**.
- **Hub completo**: `/chat` (ora **protetto** — solo utenti autenticati), `/dashboard`, `/settings`, `/notes` (Cassetto completo: CRUD, categorizzazione AI, quiz di ripasso, learning path, Leitner).
- **API**: `/api/chat`, `/api/chat/history`, `/api/notes*`, `/api/categories`, `/api/learning-paths`, `/api/usage/stats`, `/api/auth/*`, `/api/checkout`. Tutte le API di dati utente accettano **cookie O Bearer** tramite `getAuthUser()`.
- AI: `src/lib/ai-provider.ts` (OpenAI o Ollama), unico cervello, mai duplicato client-side.

### Estensione Chrome — MV3, sidepanel
- **Permessi manifest (già minimi)**: `activeTab`, `contextMenus`, `sidePanel`, `storage`, `scripting`. `host_permissions` ristretti a `localhost:3000` e `semplycode.com`. Content script su `<all_urls>` (serve per l'highlight del codice selezionato).
- **Auth**: login OTP via email → `POST /api/auth/verify-login-code` restituisce un **JWT Bearer custom** (firmato con `JWT_SECRET`, scadenza 30gg) salvato in `chrome.storage.local`. Tutte le chiamate usano `Authorization: Bearer`.
- **UI attuale**: Playground (editor + chat), Dashboard, Account, Impostazioni, Note (lista + dettaglio).

### ⚠️ Gap rispetto al principio guida
1. **L'estensione replica troppa webapp**: Dashboard con statistiche, sezione Account con piani/pricing. Il brief chiede 1-2 stati (cattura → spiegazione) + micro-azioni.
2. **Nessun deep link dalla nota dell'estensione alla webapp**: manca "apri nel cassetto webapp" con contesto precaricato.
3. **Login separato**: il login dell'estensione è indipendente da quello della webapp (stessa email, ma due sessioni distinte).

---

## 2. Schema dell'architettura condivisa

```
┌──────────────────────────────────────────────────────────┐
│                        SUPABASE                          │
│   DB: users, chat_history, notes, categories,            │
│   note_categories, learning_paths, learning_path_notes   │
│   + Supabase Auth (email/password/OAuth/OTP)             │
└───────────────────────┬──────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────┐
│              BACKEND Next.js — /api/*                    │
│   auth: getAuthUser(req) → cookie session O Bearer JWT   │
│   /api/chat · /api/chat/history · /api/notes*            │
│   /api/categories · /api/learning-paths                  │
│   /api/usage/stats · /api/auth/* · /api/checkout         │
│   AI: chatWithAI() (OpenAI/Ollama) — unico cervello      │
└──────────┬─────────────────────────────┬─────────────────┘
           │ cookie session (httpOnly)   │ Bearer JWT custom (30gg)
┌──────────▼───────────┐        ┌────────▼──────────────────┐
│    WEBAPP (React)     │        │   ESTENSIONE (sidepanel)  │
│ · login/registrazione │        │ · login OTP rapido        │
│ · chat approfondita   │        │ · selezione contestuale   │
│ · cassetto completo   │        │ · spiegazione rapida      │
│ · account/abbonamento │        │ · salva nel cassetto      │
│ · impostazioni        │        │ · deep link → webapp      │
└───────────────────────┘        └───────────────────────────┘
        stessi dati, stesso account, stesso cervello AI
```

**Chi chiama cosa** (unico flusso):
- Webapp: browser → `/api/*` con **cookie** (auto inviato) → Supabase service-role + filtro `user_id` nel codice per le note.
- Estensione: `apiFetch(path)` → `/api/*` con **`Authorization: Bearer <jwt>`** → stessa logica server.
- Il DB delle note è **un unico set di tabelle**: una nota salvata dall'estensione è lo stesso record che appare nella webapp. Nessuna sincronizzazione manuale.

---

## 3. Autenticazione condivisa e sicura (domanda 1)

### Come funziona oggi
| | Webapp | Estensione |
|---|---|---|
| Meccanismo | Cookie Supabase (httpOnly, SameSite=Lax) | JWT Bearer custom firmato `JWT_SECRET` (30gg) |
| Rilascio | Supabase Auth | `POST /api/auth/verify-login-code` → `{ token, user }` |
| Storage | Cookie (server-side) | `chrome.storage.local` |
| Validazione | `getSession()` (cookie) | `jwt.verify(token, JWT_SECRET)` in `getAuthUser()` |

### Sicurezza — regole da rispettare
1. **`chrome.storage.local`, mai `chrome.storage.sync`**: `sync` replicherebbe il token sul cloud Chrome di Google (fuori dal nostro controllo). `local` è isolato all'estensione.
2. **Scadenza 30gg, stateless**: nessun refresh server-side. A scadenza → nuovo magic link. Il client deve gestire il **401 → prompt di login** senza perdere il codice/draft in lavorazione.
3. **Non esporre il token al content script**: il content script gira nel contesto della pagina (potenzialmente malevola) e non deve mai ricevere il token. Le chiamate AI avvengono solo dal sidepanel (contesto estensione).
4. **JWT custom ≠ token Supabase**: non è valido per RLS/Realtime Supabase. Per le note il server usa la service-role key + filtro `user_id` nel codice (già implementato). È un tradeoff documentato: accettabile finché tutte le letture passano dal backend.
5. **Login una volta sola**: oggi webapp ed estensione hanno due login indipendenti (stessa email). Con l'OTP email l'utente fa due click, ma con la stessa identità → stesso cassetto. Un "sign-in delegation" (la webapp emette un token per l'estensione) è possibile ma complesso — rimandato a Fase 4.

### Alternativa futura (Fase 4, solo se serve Realtime/RLS nativi)
Sessione Supabase **completa dentro l'estensione** via flusso PKCE (OAuth in finestra dedicata + `@supabase/supabase-js`). Abiliterebbe Realtime e policy RLS dirette, al costo di più complessità di build e onboarding.

---

## 4. Nota salvata "istantanea" nella webapp (domanda 2)

**Stato attuale**: nessuna sincronizzazione in tempo reale. `/notes` ricarica al mount e dopo le azioni; l'estensione carica la lista quando apre la sezione Note.

**Raccomandazione pragmatica**:
- **Polling leggero** (30s) + **refetch su `visibilitychange`/focus tab** sia su webapp sia su estensione.
- Il cassetto **non è una chat**: 30s + focus danno la percezione di "istantaneo" senza infra aggiuntiva.
- **Opzionale (Fase 3)**: Supabase Realtime (`postgres_changes` su un canale per utente) **solo per la webapp** — funziona col cookie; l'estensione col JWT custom non può subscribare e resta su polling. Servirebbe il refactor della Fase 4 per il realtime anche lì.

---

## 5. Layer API condiviso senza duplicare codice (domanda 3)

**Stato attuale**: la webapp usa `fetch` diretti (es. `playgroundApi.ts` per `/api/chat`), l'estensione ha il suo `apiFetch()` in JS puro. La logica AI non è duplicata (tutto passa da `/api/chat`), ma la **gestione errori e le shape delle risposte** lo sono.

**Proposta (Fase 1)**:
1. Creare `src/lib/apiClient.ts` (TS) — unico modulo con:
   - `apiFetch(path, options)` tipizzato (aggiunge Content-Type, gestisce 401 come "sessione scaduta")
   - helper `notesApi`, `chatApi`, `authApi` con i tipi condivisi (già in `src/lib/supabase/types.ts`)
2. **Bundle per l'estensione**: esbuild (già usato per `codemirror-bundle.js`) produce `chrome-extension/api-client.js` incluso nel sidepanel. Unica fonte di verità per URL, errori e shape.
3. La webapp importa lo stesso modulo direttamente (TS).

---

## 6. Permessi minimi del manifest (domanda 4)

**Stato attuale (già buono)**: `activeTab`, `contextMenus`, `sidePanel`, `storage`, `scripting` + host_permissions solo per i nostri domini.

**Raccomandazioni**:
- ✅ `activeTab` — selezione/analisi sulla tab attiva senza host_permissions globali.
- ✅ `contextMenus` — bottone "Spiega con Semplycode AI".
- ✅ `sidePanel` — pannello laterale.
- ✅ `storage` — token + bozze.
- ⚠️ `scripting` — verificare che sia davvero usato dal content script; se serve solo per l'highlight della selezione, **`activeTab` è sufficiente** e si può rimuovere.
- ⚠️ Content script su `<all_urls>`: serve per intercettare la selezione ovunque, ma il CSS va tenuto **inline/isolato** (già `content-styles.css`) e il content script non deve mai accedere al token.
- ❌ Da NON aggiungere mai: `tabs` (lettura URL), `cookies`, `downloads`, `notifications` — non servono al modello attuale.

---

## 7. Piano di implementazione a fasi

### Fase 1 — Allineamento API e identità ✅
- [x] `getAuthUser()` (cookie O Bearer) su tutte le API di dati utente
- [x] JWT emesso da `verify-login-code`, flusso OTP completo nell'estensione
- [x] Cassetto note condiviso (stesse tabelle, stesse API)
- [x] **`src/lib/apiClient.ts`** + bundle esbuild (`npm run build:extension-api` → `chrome-extension/api-client.js`)
- [x] **Deep link nota → webapp**: bottone "Apri nel cassetto (webapp)" → `/notes?note=<id>`; la pagina `/notes` apre la nota dal query param
- [x] Rimosso il permesso `scripting` (non usato)

### Fase 2 — Estensione "rapida" ✅
- [x] **UI semplificata**: Playground (cattura → spiegazione) + Note + Webapp hub + Impostazioni
- [x] Dashboard e Account sostituite da **hub Webapp** con link (dashboard, cassetto, impostazioni, prezzi)
- [x] **Onboarding minimo**: guest-first — si analizza subito; il login serve solo per salvare/note
- [x] **Micro-azioni**: Salva nel cassetto / Copia risposta / Apri nel webapp (dettaglio nota)
- [x] **401 centralizzato** nel client condiviso (`onUnauthorized` → login senza perdere il contesto)

### Fase 3 — Sincronizzazione ✅
- [x] Polling note 30s + refetch su `visibilitychange` (webapp `/notes` ed estensione)
- [x] Supabase Realtime sulla webapp (miglioramento progressivo; il polling copre senza RLS)

### Fase 4 — Auth avanzata ✅
- [x] `getAuthUser()` accetta anche **access token Supabase** (oltre al JWT custom)
- [x] **Link-code delegation**: pagina `/extension-link` → codice 2 min → `POST /api/auth/link-code` → token estensione (login dalla webapp, senza ridigitare la password)
- [ ] (Futuro) Sessione Supabase PKCE completa nell'estensione — solo se serve Realtime/RLS nativi lato estensione

---

## 8. Setup richiesto (lato Supabase)
- Applicare `supabase-notes-schema.sql` (tabelle + RLS) e aggiungere `SUPABASE_SERVICE_ROLE_KEY` per le API note.
- Per il Realtime webapp servono le policy RLS del file (altrimenti il polling compensa).

## 9. Rischi e note
- **Non introdurre tecnologia per moda**: polling > realtime finché il cassetto non diventa collaborativo.
- **Il JWT custom è il vincolo architetturale attuale**: tutto passa dal backend (giusto), ma qualsiasi feature che richieda accesso diretto a Supabase dall'estensione richiede la Fase 4.
- **La semplificazione dell'estensione (Fase 2) va fatta con attenzione**: il Playground dell'estensione (editor+chat) è utile per analisi contestuali; il taglio riguarda Dashboard/Account, non il Playground.
