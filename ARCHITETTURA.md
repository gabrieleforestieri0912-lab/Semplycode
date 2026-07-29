# Architettura di Semplycode

## Panoramica

Semplycode è un'applicazione web per l'analisi del codice tramite AI, costruita con **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4** e **Supabase** (database + auth). Include una Chrome Extension per analizzare codice da qualsiasi pagina web.

---

## Stack Tecnologico

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16.1.6 (App Router) |
| UI | React 19.2.3, Tailwind CSS v4 |
| Linguaggio | TypeScript 6 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (OAuth Google/GitHub + email/password) |
| AI Engine | Ollama (locale, default `llama3` su `localhost:11434`) |
| Pagamenti | Stripe (subscription model) |
| Email | Resend (login code), Nodemailer (password reset) |
| Rate Limiting | Redis (con fallback in-memory) |
| Editor | CodeMirror 6 |
| Animazioni | Framer Motion |
| Icone | Lucide React |

---

## Struttura delle Directory

```
src/
├── app/
│   ├── layout.tsx              # Root layout (font, metadata, providers)
│   ├── globals.css              # Tailwind + stili globali
│   ├── page.tsx                 # Landing page
│   ├── error.tsx / not-found.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx       # Login (password + OAuth Google/GitHub)
│   │   └── register/page.tsx    # Registrazione
│   ├── chat/page.tsx            # Playground principale
│   ├── dashboard/page.tsx       # Dashboard utente
│   ├── settings/page.tsx        # Impostazioni profilo
│   ├── share/[token]/page.tsx   # Analisi condivisa
│   ├── feedback/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── components/
│   │   ├── Chat.tsx             # Playground (2053 righe)
│   │   ├── Navbar.tsx           # Navigazione
│   │   ├── Hero.tsx             # Hero landing
│   │   ├── Features.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── Pricing.tsx          # Piani Free/Pro/Enterprise
│   │   ├── Demo.tsx             # Demo live landing
│   │   ├── Footer.tsx
│   │   ├── EditorWrapper.tsx    # CodeMirror dynamic import
│   │   ├── Onboarding.tsx       # Modal primo accesso
│   │   ├── QuotaBadge.tsx       # Badge utilizzo
│   │   ├── ImportCodeSection.tsx
│   │   ├── CTA.tsx
│   │   └── playground/
│   │       └── CodeApplyModal.tsx
│   └── api/
│       ├── chat/route.ts                  # Analisi AI (Ollama + limiti)
│       ├── chat/history/route.ts           # CRUD cronologia chat
│       ├── auth/register/route.ts          # Registrazione
│       ├── auth/send-login-code/route.ts   # Codice magic link
│       ├── auth/verify-login-code/route.ts # Verifica codice
│       ├── auth/forgot-password/route.ts   # Reset password
│       ├── auth/reset-password/route.ts    # Nuova password
│       ├── auth/callback/route.ts          # Callback OAuth
│       ├── auth/signout/route.ts           # Logout
│       ├── checkout/route.ts              # Stripe checkout
│       ├── webhooks/stripe/route.ts       # Webhook Stripe
│       ├── user/update/route.ts           # Modifica profilo
│       ├── usage/stats/route.ts           # Statistiche utilizzo
│       ├── share/route.ts                 # Crea link condivisione
│       ├── share/[token]/route.ts         # Ottieni link
│       ├── github/fetch/route.ts          # Fetch file GitHub
│       └── files/extract-zip/route.ts     # Estrazione ZIP
├── lib/
│   ├── auth.tsx                  # Context React per Supabase
│   ├── supabase/
│   │   ├── client.ts             # Client lato browser
│   │   ├── server.ts             # Client lato server
│   │   ├── middleware.ts         # Middleware (refresh session + auth check)
│   │   ├── db.ts                 # Funzioni CRUD tipizzate
│   │   └── types.ts              # Interfacce TypeScript
│   ├── analysisPrompts.ts        # Prompt AI (5 tipi analisi)
│   ├── playgroundApi.ts          # Wrapper fetch per /api/chat
│   ├── chatTitle.ts              # Generazione titolo chat via AI
│   ├── ensureEnv.ts              # Validazione env vars
│   ├── guestSession.ts           # Gestione cookie ospite
│   ├── rateLimiter.ts            # Rate limiter (Redis/in-memory)
│   ├── usageLimits.ts            # Costanti limiti utilizzo
│   └── githubFetch.ts            # Parsing URL GitHub
├── context/
│   └── LanguageContext.tsx        # Toggle lingua IT/EN
└── proxy.ts                      # Middleware Next.js (auth + CORS)
```

---

## Flusso di Autenticazione

### 1. OAuth (Google / GitHub)

```
Utente clicca "Continua con Google"
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Redirect a Supabase Auth UI
  → Utente autorizza
  → Supabase redirect a /api/auth/callback?code=...
  → Callback scambia il codice per una sessione
  → Crea/aggiorna record utente nella tabella users
  → Redirect a pagina originaria
```

### 2. Email / Password

```
Registrazione:
  → POST /api/auth/register { email, password, firstName, lastName }
  → supabase.auth.signUp() + bcrypt(password) → users table

Login:
  → supabase.auth.signInWithPassword({ email, password })
```

### 3. Magic Link (codice monouso)

```
  → POST /api/auth/send-login-code { email }
  → Genera codice 6 cifre, salva con expiry 10 min
  → Invia via Resend email
  → POST /api/auth/verify-login-code { email, code }
  → Verifica, firma JWT, restituisce token
```

### 4. Protezione Route (Middleware)

`src/proxy.ts`:
- Pagine protette: `/dashboard`, `/settings` → redirect a `/login`
- API protette: `/api/chat/history`, `/api/checkout` → 401
- Usa `getAuthenticatedUser()` da `@/lib/supabase/middleware`

---

## Database Supabase

Esegui `supabase-schema.sql` nel SQL Editor di Supabase.

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
| subscription_id / subscription_status / plan | TEXT | 'free', 'pro', 'enterprise' |
| daily_analyses_count / daily_analyses_last_reset | INT / TIMESTAMPTZ | |
| reset_token / reset_token_expiry | TEXT / TIMESTAMPTZ | |
| login_code / login_code_expiry | TEXT / TIMESTAMPTZ | |

RLS: lettura/scrittura solo propri dati, inserimento libero.

### Tabella `chat_history`

| Colonna | Tipo | Note |
|---------|------|------|
| id | UUID PK | |
| user_id | TEXT | email o UUID |
| title | TEXT | |
| messages | JSONB | Array di { role, content, timestamp } |
| language | TEXT | Default 'javascript' |
| created_at / updated_at | TIMESTAMPTZ | |

RLS: CRUD completo solo propri record.

### Tabella `shared_links`

| Colonna | Tipo | Note |
|---------|------|------|
| id | UUID PK | |
| token | TEXT UNIQUE | UUID casuale |
| user_id | TEXT | |
| payload | JSONB | Contenuto condiviso |
| expires_at | TIMESTAMPTZ | Auto-eliminazione |

RLS: lettura pubblica per token, inserimento libero, cancellazione solo proprietario.

---

## API Routes

### Chat / AI

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/chat` | Invia messaggi a Ollama, controlla limiti (guest 3/giorno, free 10/giorno, pro illimitato) |

### Auth

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/auth/register` | Registrazione con Supabase Auth + salvataggio in users |
| POST | `/api/auth/signout` | Logout Supabase |
| GET | `/api/auth/callback` | Callback OAuth (Google/GitHub), crea/aggiorna utente |
| POST | `/api/auth/send-login-code` | Invia codice 6 cifre via Resend |
| POST | `/api/auth/verify-login-code` | Verifica codice, restituisce JWT |
| POST | `/api/auth/forgot-password` | Invia link reset via SMTP |
| POST | `/api/auth/reset-password` | Reset password con token |

### User

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/user/update` | Aggiorna nome/cognome |
| GET | `/api/usage/stats` | Statistiche utilizzo (analisi rimanenti, piano) |

### Stripe

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/checkout` | Crea sessione Stripe checkout |
| POST | `/api/webhooks/stripe` | Webhook: completed/updated/deleted/payment_failed |

### Share

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/share` | Crea link condiviso con payload |
| GET | `/api/share/[token]` | Recupera payload condiviso |

### File

| Metodo | Route | Descrizione |
|--------|-------|-------------|
| POST | `/api/files/extract-zip` | Estrai file da ZIP (max 5 file, 100KB cad.) |
| POST | `/api/github/fetch` | Fetch file da GitHub raw URL |

---

## Tipi di Analisi AI

Il prompt system viene costruito da `buildAnalysisSystemPrompt()` in `analysisPrompts.ts`:

| Tipo | Focus |
|------|-------|
| `full` | Analisi completa: errori, struttura, logica, miglioramenti |
| `debug` | Diagnosi errori e bug |
| `security` | Vulnerabilità di sicurezza |
| `performance` | Ottimizzazione performance |
| `refactor` | Suggerimenti di refactoring |

---

## Pagamenti (Stripe)

### Piani

| Piano | Prezzo | Limiti |
|-------|--------|--------|
| Free | 0 €/mese | 10 analisi/giorno, solo analisi completa |
| Pro | 19.99 €/mese | Analisi illimitate, tutti i tipi, export/share, ZIP |
| Enterprise | 49.99 €/mese | Training AI custom, collaborazione team, API |

### Flusso Checkout

1. Utente clicca "Inizia Ora" su un piano a pagamento
2. `POST /api/checkout` con `{ priceId, planId }`
3. Crea sessione Stripe (subscription mode)
4. Redirect a Stripe Checkout
5. Webhook `checkout.session.completed` → aggiorna subscription_status e plan

---

## Middleware (`src/proxy.ts`)

- **Matcher**: `/chat/*`, `/dashboard/*`, `/settings/*`, `/api/*`
- **Auth guard**: usa `getAuthenticatedUser()` da Supabase
- **CORS**: aggiunge header CORS su tutte le route `/api/*`
- **Rate limiting**: Redis (con fallback in-memory)

---

## Chrome Extension

Struttura in `chrome-extension/`:

```
chrome-extension/
├── manifest.json        # MV3, sidepanel + context menu
├── background.js        # Service worker (sidepanel, context menu)
├── content-script.js    # Rileva selezione codice, mostra pulsante
├── content-styles.css
├── sidepanel.html       # Interfaccia completa (auth, editor, chat)
├── sidepanel.js         # Logica sidepanel
├── sidepanel.css
├── codemirror-bundle.js # CodeMirror 6 bundle
├── panel-layout.css
└── icon.png
```

La extension:
- Apre un sidepanel con editor CodeMirror completo
- Mostra pulsante "Analyze with Semplycode" sul codice selezionato
- Supporta login/registrazione, analisi, cronologia
- Comunica con l'API configurata (default localhost:3000)

---

## Variabili d'Ambiente

```env
# Obbligatorie
NEXT_PUBLIC_SUPABASE_URL=https://ebmhyrzfuexqhdmqgsbz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
JWT_SECRET=your_jwt_secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...                                         # Magic link
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS                # Password reset

# Opzionali
REDIS_URL=redis://localhost:6379                              # Rate limiting
OLLAMA_URL=http://localhost:11434                             # AI engine
OLLAMA_MODEL=llama3                                           # AI model
```

---

## Rate Limiting

- **Ospiti**: 3 analisi/giorno (tracciato da cookie HttpOnly `guest_session`)
- **Free**: 10 analisi/giorno (tracciato da `daily_analyses_count` su Supabase)
- **Pro/Enterprise**: illimitate
- **Login code**: max 3 richieste/minuto

---

## Lingue

Supporto bilingue IT/EN tramite `LanguageContext.tsx` con persistenza in localStorage. Usato in componenti: Pricing, Settings, Navbar.
