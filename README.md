# Semplycode AI Co-Pilot

Semplycode è una webapp per l'analisi e la comprensione del codice tramite AI: scompone la logica complessa, trova i bug, spiega i pattern in linguaggio semplice e insegna a scrivere codice migliore. Include una **Chrome Extension** (sidepanel) che analizza il codice selezionato su qualsiasi pagina web.

> Principio guida: **stessa identità, stesso account, stesso "cervello" AI — esperienze diverse per contesti diversi.**

---

## Stack Tecnologico

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4 |
| Linguaggio | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password, OAuth Google/GitHub, OTP via email) |
| AI Engine | Google Gemini (default `gemini-2.0-flash`) |
| Pagamenti | Stripe (subscription model) |
| Email | SMTP (login code OTP), Nodemailer (password reset) |
| Rate Limiting | Redis (`ioredis`, fallback in-memory) |
| Editor | CodeMirror 6 |
| Animazioni | Framer Motion |
| Icone | Lucide React + FontAwesome (brand icons, es. Chrome) |

---

## Struttura delle Directory

```
.
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (font, metadata, providers, theme anti-FOUC)
│   │   ├── globals.css             # Tailwind + variabili tema light/dark + override dark
│   │   ├── page.tsx                # Landing page (Hero, Demo, Come Funziona, Prezzi, Estensione, FAQ)
│   │   ├── proxy.ts                # Middleware Next.js (auth guard + CORS su /api)
│   │   ├── components/
│   │   │   ├── Navbar.tsx          # Navigazione + toggle tema + lingua
│   │   │   ├── Hero.tsx            # Hero landing (CTA verde + CTA Chrome dark)
│   │   │   ├── Features.tsx · HowItWorks.tsx · WhyChoose.tsx
│   │   │   ├── Pricing.tsx         # Piani Free/Starter/Pro/Enterprise
│   │   │   ├── Demo.tsx            # Demo live landing (CodeMirror)
│   │   │   ├── ExtensionSection.tsx · ImportCodeSection.tsx · FAQ.tsx · Footer.tsx
│   │   │   ├── Chat.tsx            # Playground principale
│   │   │   ├── EditorWrapper.tsx   # CodeMirror dynamic import
│   │   │   ├── ChromeLogo.tsx      # Icona Chrome (FontAwesome faChrome)
│   │   │   ├── ThemeToggle.tsx · Onboarding.tsx · QuotaBadge.tsx
│   │   │   └── playground/CodeApplyModal.tsx
│   │   ├── api/
│   │   │   ├── chat/route.ts                    # Analisi AI (token budget + rate limit)
│   │   │   ├── chat/history/route.ts            # CRUD cronologia chat
│   │   │   ├── auth/*                           # register, signup, signout, callback, send/verify-login-code, forgot/reset-password, link-code
│   │   │   ├── notes/*                          # CRUD note, categorize, quiz, review, related, due-reviews
│   │   │   ├── categories/route.ts · learning-paths/route.ts
│   │   │   ├── checkout/route.ts · webhooks/stripe/route.ts
│   │   │   ├── usage/stats/route.ts · user/stats/route.ts · user/update/route.ts
│   │   │   ├── share/route.ts · share/[token]/route.ts
│   │   │   ├── github/fetch/route.ts · files/extract-zip/route.ts
│   │   ├── login/ · register/ · forgot-password/ · reset-password/ · extension-link/
│   │   ├── chat/ · dashboard/ · notes/ · settings/ · share/[token]/ · feedback/ · privacy/ · terms/
│   ├── lib/
│   │   ├── supabase/              # client.ts (browser) · server.ts · middleware.ts · db.ts · types.ts · service.ts
│   │   ├── ai-provider.ts         # chatWithAI() — Google Gemini, unico cervello
│   │   ├── api-auth.ts            # getAuthUser(): cookie session O Bearer JWT
│   │   ├── apiClient.ts           # Client tipizzato (webapp) + apiClient.extension.ts (bundle estensione)
│   │   ├── auth.tsx               # Context React per Supabase
│   │   ├── tokenBudget.ts         # Budget token mensili + stima
│   │   ├── usageLimits.ts · rateLimiter.ts · guestSession.ts · ensureEnv.ts
│   │   ├── notesDb.ts · notesAI.ts · notesPrompts.ts
│   │   ├── analysisPrompts.ts · playgroundApi.ts · chatTitle.ts
│   │   ├── linkCode.ts · githubFetch.ts · faq.ts · extension.ts
│   └── context/
│       └── LanguageContext.tsx    # Toggle lingua IT/EN
│       └── ThemeContext.tsx       # Tema light/dark
├── chrome-extension/
│   ├── manifest.json              # MV3, sidepanel + context menu, permessi minimi
│   ├── background.js              # Service worker (sidepanel, context menu)
│   ├── content-script.js · content-styles.css
│   ├── sidepanel.html · sidepanel.js · panel-layout.css
│   ├── codemirror-bundle.js       # CodeMirror 6 bundle
│   ├── api-client.js              # Bundle esbuild di src/lib/apiClient.extension.ts
│   └── icon.png
├── supabase-schema.sql            # Schema completo Supabase (token + note + RLS)
└── .env.example                   # Template variabili d'ambiente
```

---

## Autenticazione

### Webapp
- **Supabase Auth** con **sessione a cookie httpOnly** (`src/lib/supabase/server.ts`).
- Login: email/password, OAuth Google/GitHub, OTP via email (magic link a 6 cifre, expiry 10 min).
- Identità utente de facto: **email** (`chat_history.user_id`, `notes.user_id` = email).

### Estensione Chrome
- Login OTP via email → `POST /api/auth/verify-login-code` restituisce un **JWT Bearer custom** firmato con `JWT_SECRET` (scadenza 30gg), salvato in `chrome.storage.local` (mai `chrome.storage.sync`).
- Tutte le chiamate usano `Authorization: Bearer <jwt>`; sul server `getAuthUser()` accetta **cookie Supabase O Bearer JWT custom O access token Supabase**.
- **Link-code delegation**: pagina `/extension-link` genera un codice (2 min) → `POST /api/auth/link-code` → token estensione, senza ridigitare la password.
- Il token non viene mai esposto al content script (contesto pagina potenzialmente non fidato).

### Protezione route (middleware)
`src/proxy.ts`: pagine protette (`/dashboard`, `/settings`, `/chat`) → redirect a `/login`; API protette → 401; header CORS su `/api/*`.

---

## Database Supabase

Esegui `supabase-schema.sql` nel SQL Editor di Supabase (una sola volta). Lo script include:
1. **Sistema token**: `ALTER TABLE users` → `tokens_used_month`, `tokens_period_start`.
2. **Tabelle note**: `notes`, `categories`, `note_categories`, `learning_paths`, `learning_path_notes`.
3. **RLS** su tutte le tabelle (pattern `auth.jwt() ->> 'email' = user_id`).

### Tabella `users`

| Colonna | Tipo | Note |
|---------|------|------|
| id | UUID PK | gen_random_uuid() |
| email | TEXT UNIQUE NOT NULL | |
| first_name / last_name | TEXT | |
| password | TEXT | bcrypt hash, null per OAuth |
| google_id / github_id | TEXT UNIQUE | |
| image | TEXT | Avatar URL |
| stripe_customer_id | TEXT | |
| subscription_id / subscription_status / plan | TEXT | 'free', 'starter', 'pro', 'enterprise' |
| tokens_used_month | BIGINT | Budget mensile consumato |
| tokens_period_start | TIMESTAMPTZ | Inizio periodo mensile |
| reset_token / reset_token_expiry | TEXT / TIMESTAMPTZ | |
| login_code / login_code_expiry | TEXT / TIMESTAMPTZ | |

### Tabella `chat_history`

| Colonna | Tipo | Note |
|---------|------|------|
| id | UUID PK | |
| user_id | TEXT | email |
| title | TEXT | |
| messages | JSONB | Array di { role, content, timestamp } |
| language | TEXT | Default 'javascript' |
| created_at / updated_at | TIMESTAMPTZ | |

### Tabella `notes`

| Colonna | Tipo | Note |
|---------|------|------|
| id | UUID PK | |
| user_id | TEXT | email |
| title / snippet_code / explanation | TEXT | |
| language | TEXT | Default 'javascript' |
| source_type | TEXT | 'webapp' \| 'extension' |
| source_url / source_ref | TEXT | |
| status | TEXT | 'pending' \| 'ready' (categorizzazione async) |
| leitner_box | INT | 0-4 (ripetizione spaziata) |
| next_review_at | TIMESTAMPTZ | |
| created_at / updated_at | TIMESTAMPTZ | |

`categories` (UNIQUE per user + nome lower), `note_categories` (join), `learning_paths` e `learning_path_notes` (percorsi). Tutte con RLS per proprietario.

---

## Piani e Token

| Piano | Prezzo (Mensile / Annuale) | Budget crediti mensili | Display | Note |
|-------|----------------------------|------------------------|---------|------|
| Free | 0 € | 30K | 30.000 ≈ ~6 analisi | 1 credito = 1 token ≈ 4 char |
| Starter | 4.99 €/m (3.99 €/m ann.) | 1.5M | 1.500.000 ≈ ~300 analisi | — |
| Pro | 7.99 €/m (6.39 €/m ann.) | 3M | 3.000.000 ≈ ~600 analisi | — |
| Team | Su richiesta (lista d’attesa) | Su volumi concordati | — | Fino a 20 file, pool condiviso |

- Ospiti (senza account): budget giornaliero di 30K crediti gestito lato server via Redis (`GUEST_DAILY_TOKEN_BUDGET`).
- Il display mostra i crediti con stima analisi (~5k crediti/analisi); i budget reali in `src/lib/tokenBudget.ts`.
- **Flusso checkout**: `POST /api/checkout` con `{ priceId, planId, interval }` → sessione Stripe → webhook `checkout.session.completed` aggiorna `subscription_status` e `plan`.

---

## API Routes

### Chat / AI
| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/chat` | Analisi AI con controllo token budget + rate limit |

### Auth
| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/auth/register` · `/api/auth/signup` | Registrazione |
| POST | `/api/auth/signout` | Logout |
| GET | `/api/auth/callback` | Callback OAuth (Google/GitHub) |
| POST | `/api/auth/send-login-code` · `/api/auth/verify-login-code` | OTP email → JWT |
| POST | `/api/auth/forgot-password` · `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/link-code` · `/api/auth/link-code/create` | Link-code delegation (webapp → estensione) |

### Note (Cassetto)
| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/notes` | Crea nota (status pending) |
| GET | `/api/notes?category=&q=&status=` | Lista note con filtri |
| GET/PATCH/DELETE | `/api/notes/[id]` | Dettaglio / modifica / elimina |
| POST | `/api/notes/[id]/categorize` · `/api/notes/categorize-pending` | Categorizzazione AI (idempotente / batch) |
| POST | `/api/notes/[id]/quiz` · `/api/notes/[id]/review` | Quiz AI + avanzamento Leitner |
| GET | `/api/notes/due-reviews` | Note da ripassare |
| GET/POST | `/api/notes/[id]/related` | Note correlate (categorie + AI semantica) |
| GET | `/api/categories` | Categorie dell'utente |
| GET/POST | `/api/learning-paths` · `/api/learning-paths/[id]` | Percorsi di apprendimento |

### User / Usage / Pagamenti
| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/user/update` | Aggiorna nome/cognome |
| GET | `/api/usage/stats` · `/api/user/stats` | Statistiche utilizzo (token, piano) |
| POST | `/api/checkout` | Sessione Stripe checkout |
| POST | `/api/webhooks/stripe` | Webhook: completed/updated/deleted/payment_failed |

### Share / File
| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/share` · GET `/api/share/[token]` | Link di condivisione |
| POST | `/api/github/fetch` | Fetch file da GitHub raw URL |
| POST | `/api/files/extract-zip` | Estrazione ZIP (max 5 file, 100KB cad.) |

---

## Tipi di Analisi AI

Il prompt system viene costruito in `analysisPrompts.ts`:

| Tipo | Focus |
|------|-------|
| `full` | Analisi completa: errori, struttura, logica, miglioramenti |
| `debug` | Diagnosi errori e bug |
| `security` | Vulnerabilità di sicurezza |
| `performance` | Ottimizzazione performance |
| `refactor` | Suggerimenti di refactoring |

---

## Cassetto delle Note

- **Salvataggio**: nota salvata subito con stato `pending`; la categorizzazione AI è asincrona (fire-and-forget + batch `categorize-pending` all'apertura del cassetto).
- **Categorie**: normalizzate per utente (`categories` UNIQUE su `lower(name)`); l'AI riusa gli id esistenti e crea solo nomi nuovi.
- **Percorsi**: `learning_paths` + `learning_path_notes` per raggruppare note correlate.
- **Ripetizione spaziata (Leitner)**: `leitner_box` 0-4, intervalli 3/7/14/30/60gg; `POST /api/notes/[id]/review` avanza/retrocede il box.
- **Sincronizzazione**: polling 30s + refetch su `visibilitychange`/focus (webapp ed estensione); Supabase Realtime come miglioramento progressivo sulla webapp.
- **Stesso DB per entrambe**: una nota salvata dall'estensione è lo stesso record visibile nella webapp (stesso account via email). Nessuna sincronizzazione manuale.
- **Ospiti**: le note richiedono account (prompt di login/registrazione).

---

## Chrome Extension

- **MV3**, permessi minimi: `activeTab`, `contextMenus`, `sidePanel`, `storage` (+ `scripting` rimosso, non usato). `host_permissions` ristretti a `localhost:3000` e `semplycode.vercel.app`. Content script su `<all_urls>` per l'highlight della selezione (mai accede al token).
- **Sidepanel**: Playground (editor CodeMirror + chat AI), Cassetto note (lista + dettaglio), hub Webapp (account/piani, impostazioni, login).
- **Tour guidato**: overlay con spotlight su 5 step (Playground, Cassetto, Webapp, guida, tema), auto-avvio al primo uso, replay dal pulsante `?`.
- **Sezione account**: piani di abbonamento identici al Pricing webapp (Gratis/Starter/Pro/Enterprise), piano corrente evidenziato via `/api/usage/stats`.
- **Micro-azioni**: Salva nel cassetto / Copia risposta / Apri nella webapp (deep link `/notes?note=<id>`).
- **Dark theme di default** con toggle; persistenza in `chrome.storage.local`.
- **Build API client**: `npm run build:extension-api` → esbuild produce `chrome-extension/api-client.js` da `src/lib/apiClient.extension.ts` (unica fonte di verità per URL, errori, shape).

---

## Rate Limiting

- **Ospiti**: 30K token/giorno (via Redis + cookie guest).
- **Free**: 30K token/mese (≈ ~6 analisi).
- **Starter**: 1.5M token/mese · **Pro**: 3M token/mese · **Enterprise**: illimitato.
- **Login code**: max 3 richieste/minuto.

---

## Variabili d'Ambiente

```env
# Obbligatorie
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key   # richiesta dalle API note

# SMTP (login code OTP). Se assente i codici sono loggati in console.
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
SMTP_FROM="Semplycode <no-reply@example.com>"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Provider (OpenAI-compatible / xKiro)
AI_API_KEY=your_ai_api_key
AI_BASE_URL=https://api.xkiro.com/v1
AI_MODEL=qwen/qwen3-coder-plus:free

# Opzionale Redis (rate limiting multi-instanza)
REDIS_URL=redis://localhost:6379
```

---

## Setup e Sviluppo

```bash
npm install
cp .env.example .env.local   # compila le variabili
npm run dev                  # http://localhost:3000
npm run build:extension-api  # rigenera chrome-extension/api-client.js
npm run build                # build di produzione
npm run lint                 # eslint
npx tsc --noEmit             # typecheck (obbligatorio prima di ogni commit)
```

**Setup Supabase**: esegui `supabase-schema.sql` nel SQL Editor (una volta) e aggiungi `SUPABASE_SERVICE_ROLE_KEY` alle env.

**Lingue**: supporto bilingue IT/EN tramite `LanguageContext.tsx` con persistenza in localStorage (usato in Pricing, Settings, Navbar).

**Tema**: light/dark via `ThemeContext.tsx` + classe `.dark` su `<html>`. Per evitare il flash bianco al refresh, `layout.tsx` include uno script inline nel `<head>` che applica la classe `dark` prima del paint leggendo `localStorage.theme`.