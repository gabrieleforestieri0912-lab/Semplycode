# Feature: "Cassetto delle Note" — Design e Implementazione

> Stato: **implementato** (Fasi 0-3). Aggiornato: 2026-08-13.
> Setup richiesto: eseguire `supabase-notes-schema.sql` nel SQL Editor di
> Supabase e aggiungere `SUPABASE_SERVICE_ROLE_KEY` alle env.
> Nota: la categorizzazione/quiz richiedono l'AI configurata (OPENAI_API_KEY
> o Ollama), come per l'analisi codice.

---

## 1. Stato attuale del progetto (analisi)

### Stack confermato
- **Webapp**: Next.js 16 (App Router), React 19, TypeScript, Tailwind v4
- **Database**: Supabase (PostgreSQL) — tabelle `users`, `chat_history`, `shared_links`
- **Auth**: Supabase Auth (OAuth + email/password + magic link OTP), **sessioni a cookie** (`src/lib/supabase/server.ts`)
- **Identità utente de facto**: **email** (`getUserId()` in `db.ts`/`server.ts` restituisce `session.user.email`; `chat_history.user_id` = email)
- **AI**: `src/lib/ai-provider.ts` — OpenAI (default `gpt-4o`) oppure Ollama locale, non-stream via `chatWithAI()`
- **Rate limit**: Redis (`ioredis`) con fallback in-memory (`src/lib/rateLimiter.ts`)
- **Middleware**: `src/proxy.ts` — CORS `*` su tutte le `/api`, guard su pagine protette e su `/api/chat/history`, `/api/checkout`
- **Estensione Chrome**: MV3, sidepanel + context menu. `chrome-extension/sidepanel.js` usa `apiFetch()` con header `Authorization: Bearer <token>` + `credentials: include`

### ⚠️ Findings critici emersi dall'analisi
1. **L'autenticazione dell'estensione è di fatto disattivata**: `DEV_BYPASS_AUTH = true` in `sidepanel.js` → l'utente entra senza login.
2. **Il token Bearer dell'estensione non viene validato dal server**: il server autentica solo via cookie Supabase (`getSession()`). La route `verify-login-code` oggi verifica l'OTP ma **non emette più il JWT** che `ARCHITETTURA.md` descrive come previsto (`JWT_SECRET` esiste in `.env`, `jsonwebtoken` è in `dependencies`, ma non è usato da nessuna route).
3. **CORS incompatibile con i cookie cross-origin**: `Access-Control-Allow-Origin: *` impedisce `credentials: include` → l'estensione non può usare le sessioni a cookie dell'extensione web. Un'architettura Bearer-token risolve questo (con Bearer non servono cookie).
4. **Nessun migration file in repo**: lo schema Supabase (`supabase-schema.sql`) è citato in `ARCHITETTURA.md` ma non versionato. Va allineato a mano o creato un nuovo file di migration per le nuove tabelle.
5. **RLS con identità email**: le policy esistenti filtrano per `user_id` (= email). Le nuove tabelle devono replicare lo stesso pattern (RLS via `auth.jwt() ->> 'email'`), da verificare rispetto alle policy attuali in Supabase.

---

## 2. Decisioni chiave

| Decisione | Scelta | Motivazione |
|---|---|---|
| Chiave utente | **email** (`user_id TEXT`), come `chat_history` | Coerenza col pattern esistente; il refactor a UUID è fuori scope |
| Persistenza | **Supabase** (nuove tabelle) | Già in uso per tutto il resto |
| Autenticazione estensione | **JWT Bearer firmato** con `JWT_SECRET` | Coerente con quanto previsto da `ARCHITETTURA.md`; funziona con CORS `*` |
| Categorizzazione | **Asincrona, non bloccante**: nota salvata subito con stato `pending`, categorizzazione eseguita dal client dopo il salvataggio (fire-and-forget) + batch al caricamento del cassetto | Nessuna infra worker richiesta; rispetta il vincolo "salva subito, categorizza in background" |
| Normalizzazione categorie | Tabella **`categories` UNIQUE per user** + join `note_categories`; l'AI riceve l'elenco delle categorie esistenti e **riusa gli id** | Evita duplicati tipo "async" vs "async/await" |
| Lingua categorie | Italiano (default sito) | Coerente con le spiegazioni AI |
| Ospiti | **Niente note per ospiti** (richiesta login) | Le note devono sincronizzarsi cross-device; senza account non ha senso |

---

## 3. Schema dati completo (SQL)

```sql
-- ═══════════ NOTE (core) ═══════════
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,                -- email utente (pattern esistente)
  title         text not null default '',
  snippet_code  text not null,                -- codice originale selezionato
  explanation   text not null,                -- spiegazione generata dall'AI
  language      text not null default 'javascript',
  source_type   text not null default 'webapp' check (source_type in ('webapp', 'extension')),
  source_url    text,                         -- URL pagina (se da estensione)
  source_ref    text,                         -- chat_id / progetto (se da webapp)
  status        text not null default 'pending' check (status in ('pending', 'ready')),
  -- → fase 3 (spaced repetition, Leitner):
  leitner_box   int not null default 0 check (leitner_box between 0 and 4),
  next_review_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists notes_user_idx    on public.notes (user_id, created_at desc);
create index if not exists notes_status_idx  on public.notes (user_id, status);

-- ═══════════ CATEGORIE (normalizzate per utente) ═══════════
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  name       text not null,                   -- es. "async/await", "React hooks"
  created_at timestamptz not null default now(),
  unique (user_id, lower(name))
);

-- ═══════════ RELAZIONE NOTE ↔ CATEGORIE ═══════════
create table if not exists public.note_categories (
  note_id     uuid not null references public.notes(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (note_id, category_id)
);

-- ═══════════ PERCORSI DI APPRENDIMENTO (fase 2) ═══════════
create table if not exists public.learning_paths (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  title      text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_path_notes (
  path_id    uuid not null references public.learning_paths(id) on delete cascade,
  note_id    uuid not null references public.notes(id) on delete cascade,
  position   int not null default 0,
  primary key (path_id, note_id)
);

-- ═══════════ RLS (stesso pattern email di chat_history) ═══════════
alter table public.notes               enable row level security;
alter table public.categories          enable row level security;
alter table public.note_categories     enable row level security;
alter table public.learning_paths      enable row level security;
alter table public.learning_path_notes enable row level security;

-- Nota: verificare come sono fatte le policy esistenti di chat_history
-- in Supabase (probabilmente: auth.jwt() ->> 'email' = user_id).
create policy notes_select on public.notes for select
  using ((auth.jwt() ->> 'email') = user_id);
create policy notes_insert on public.notes for insert
  with check ((auth.jwt() ->> 'email') = user_id);
create policy notes_update on public.notes for update
  using ((auth.jwt() ->> 'email') = user_id);
create policy notes_delete on public.notes for delete
  using ((auth.jwt() ->> 'email') = user_id);

-- (stesse policy per categories / note_categories / learning_paths / learning_path_notes)
```

**Perché `status` e non fare la categorizzazione inline**: rispetta il vincolo "salva subito, categorizza in background". La UI mostra la nota come salvata; le categorie arrivano appena l'AI risponde.

---

## 4. API endpoints

### MVP

| Metodo | Route | Autenticazione | Descrizione |
|---|---|---|---|
| POST | `/api/notes` | cookie **o** Bearer | Crea nota (`status: pending`). Ritorna 201 subito, senza aspettare l'AI |
| GET | `/api/notes?category=&q=&status=` | cookie o Bearer | Lista note (filtri + ricerca full-text sui campi) |
| GET | `/api/notes/:id` | cookie o Bearer | Dettaglio nota (con categorie e percorsi) |
| PATCH | `/api/notes/:id` | cookie o Bearer | Modifica titolo / correzione manuale categorie |
| DELETE | `/api/notes/:id` | cookie o Bearer | Elimina nota |
| POST | `/api/notes/:id/categorize` | cookie o Bearer | Categorizzazione AI (idempotente), usa categorie esistenti |
| POST | `/api/notes/categorize-pending` | cookie o Bearer | Batch: categorizza tutte le note `pending` dell'utente (chiamato all'apertura del cassetto) |
| GET | `/api/categories` | cookie o Bearer | Elenco categorie dell'utente (per filtri) |

### Fase 2 (collegamenti)

| Metodo | Route | Descrizione |
|---|---|---|
| POST | `/api/notes/:id/related` | AI: trova note simili (stesse categorie) e propone collegamenti |
| POST | `/api/learning-paths` | Crea percorso con note |
| GET | `/api/learning-paths` | Elenco percorsi |
| GET | `/api/notes/:id/related` | Note correlate + percorsi associati |

### Fase 3 (ripetizione spaziata)

| Metodo | Route | Descrizione |
|---|---|---|
| GET | `/api/notes/due-reviews` | Note da ripassare (Leitner) |
| POST | `/api/notes/:id/quiz` | Genera mini-quiz AI sulla nota |
| POST | `/api/notes/:id/review` | Invia esito quiz → avanza/retrocede `leitner_box`, aggiorna `next_review_at` |

**Autenticazione** → nuovo helper condiviso `src/lib/api-auth.ts`:
1. Legge `Authorization: Bearer <jwt>` → `jwt.verify(jwt, JWT_SECRET)` → restituisce `{ email }`
2. Se assente, prova la sessione cookie Supabase (`getSession()`)
3. Ritorna `null` → 401

---

## 5. Criticità architetturali (e come risolverle)

### 5.1 🔴 Autenticazione estensione ↔ backend (il problema principale)
**Problema**: il server valida solo sessioni a cookie; l'estensione manda un Bearer non validato. Con `Access-Control-Allow-Origin: *` i cookie non possono viaggiare. Risultato: oggi l'estensione è un "guest anonimo" e qualsiasi API autenticata (come le note) le darebbe 401.

**Soluzione (prerequisito, Fase 0)**:
1. **Ripristinare l'emissione del JWT** in `POST /api/auth/verify-login-code`: dopo `supabase.auth.verifyOtp`, firmare `{ email, iat, exp }` con `JWT_SECRET` (via `jsonwebtoken`, già in `dependencies`) e restituire `{ token, user }`.
2. **Aggiungere l'helper `api-auth.ts`** (cookie → fallback Bearer) e usarlo in tutte le route nuove (e in `chat/history` per coerenza).
3. **Estensione**: rimuovere `DEV_BYPASS_AUTH`, completare il flusso login già presente (send-login-code → verify → token), salvare `token` in `chrome.storage.local`, inviarlo come `Authorization: Bearer`.
4. **CORS**: con Bearer token `*` va bene (non serve `credentials`). Se in futuro servisse cookie cross-origin, restringere CORS a origini note con `Access-Control-Allow-Credentials: true`.
5. **Scadenza token**: 30 giorni; a scadenza → richiedi nuovo magic link. Niente refresh server-side (stateless, semplice).

### 5.2 RLS con identità email vs UUID Supabase
`auth.uid()` è il UUID di `auth.users`; il codice usa l'email. Le policy vanno scritte con `auth.jwt() ->> 'email'` (coerenti con `chat_history`). **Da verificare**: leggere le policy attuali in Supabase prima di applicare le nuove, per replicare il pattern esatto.

### 5.3 Categorizzazione asincrona su serverless
Su Vercel/serverless, un "fire-and-forget" dentro la route dopo la `Response` può essere terminato. Soluzione pragmatica:
- La route `POST /api/notes` **non chiama l'AI**: inserisce e risponde 201.
- Il client, dopo il successo, lancia `POST /api/notes/:id/categorize` (non attende per la UX).
- All'apertura del cassetto, `POST /api/notes/categorize-pending` recupera le note in `pending` rimaste (robustezza anche se il client ha chiuso la pagina).
- In futuro, se serve, spostare la categorizzazione su un job/cron Vercel.

### 5.4 Duplicazione delle categorie
Risolta dallo schema: `categories` UNIQUE per `user_id` + join. Il prompt AI include l'elenco delle categorie esistenti (`id + name`) e istruisce a **riusare gli id esistenti** e a creare solo nomi nuovi (case-insensitive). Il server riconcilia comunque per `lower(name)`.

### 5.5 Dimensioni delle note
Snippet (fino a ~12KB) + spiegazione: campo `TEXT` va bene. Nel listato non si restituisce mai `explanation` intera (solo `title` + `snippet` troncato a ~200 char) per performance.

### 5.6 Ospiti
Le note richiedono account: nelle UI (webapp ed estensione) il click su "Salva nel cassetto" da utente anonimo mostra il prompt di login/registrazione.

### 5.7 Coerenza webapp ↔ estensione
Risolta da 5.1: stesso account (email) → stesso storage (Supabase). La nota salvata da un lato appare nell'altro. Il campo `source_type`/`source_url` permette di distinguere l'origine.

---

## 6. Piano di implementazione

### Fase 0 — Fondamenta auth estensione (prerequisito)
- [x] Emettere JWT in `verify-login-code` e restituirlo all'estensione
- [x] Creare `src/lib/api-auth.ts` (Bearer → fallback cookie)
- [x] Rimuovere `DEV_BYPASS_AUTH` dall'estensione e completare il flusso login
- [x] Proteggere `/api/chat/history` con il nuovo helper (cookie o Bearer)

### Fase 1 — MVP: salvataggio + categorizzazione + UI cassetto
- [x] Migration SQL: `supabase-notes-schema.sql` (tabelle + RLS)
- [x] Route: `POST/GET/PATCH/DELETE /api/notes`, `GET /api/categories`, `POST /api/notes/:id/categorize`, `POST /api/notes/categorize-pending`
- [x] Prompt AI di categorizzazione in `src/lib/notesPrompts.ts`
- [x] Pagina `/notes` (lista + filtro categoria + ricerca + dettaglio) con tema coerente
- [x] Bottone "Salva nel cassetto" in `Chat.tsx` (accanto a Esporta/Condividi) + azione rapida per messaggio
- [x] Bottone "Salva nel cassetto" nel sidepanel dell'estensione dopo l'analisi
- [x] Voce "Note" nella navbar (header + dropdown profilo)

### Fase 2 — Collegamenti tra note e learning path
- [x] `GET/POST /api/notes/:id/related` (match categorie + AI semantica)
- [x] Tabelle `learning_paths`, `learning_path_notes`
- [x] Banner **dismissibile** nel cassetto: "Hai N note su «categoria» — crea percorso?"
- [x] Vista "Percorsi" nel cassetto (sidebar)

### Fase 3 — Ripetizione spaziata (Leitner semplificato)
- [x] Campi `leitner_box`, `next_review_at` su `notes`
- [x] `GET /api/notes/due-reviews` + badge "da ripassare"
- [x] `POST /api/notes/:id/quiz` (mini-quiz AI)
- [x] `POST /api/notes/:id/review` (esito → box +1/-1, intervalli 3/7/14/30/60gg)

---

## 7. Prompt di categorizzazione (bozza)

```
Sei un esperto di programmazione. Assegna alla nota seguente 1-3 categorie
dal seguente elenco di categorie già esistenti dell'utente (riusa gli ID!):

[{ "id": "...", "name": "async/await" }, ...]

Se nessuna categoria esistente calza, proponi al massimo 1 nuova categoria
con un nome breve e già normalizzato (es. "React hooks", "regex").

Codice:
<code>

Spiegazione:
<explanation>

Rispondi SOLO con JSON: {"category_ids": [...], "new_categories": ["..."]}
```

Il server risolve `new_categories` contro `categories` (case-insensitive) e crea solo le mancanti, poi scrive in `note_categories` e aggiorna `status = 'ready'`.

---

## 8. Rischi e note finali
- **Auth estensione è il gate critico**: senza Fase 0 la feature "salva da estensione" non può esistere. È un lavoro autonomo e utile anche per la chat dall'estensione.
- **Costo AI**: categorizzare ogni nota costa token. Mitigazioni: modello piccolo/veloce, batch con una sola chiamata per più note pending, fallback "senza categoria" se l'AI fallisce (la nota resta salvata comunque).
- **Privacy**: snippet + spiegazione vengono inviati all'AI per la categorizzazione (come già avviene per l'analisi). Da citare nella privacy policy.
