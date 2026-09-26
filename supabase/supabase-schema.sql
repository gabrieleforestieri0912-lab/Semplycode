-- ═══════════════════════════════════════════════════════════════
-- SemplyCode — SCHEMA COMPLETO SUPABASE
-- Esegui questo script nel SQL Editor di Supabase UNA sola volta.
-- Contiene: sistema token (chat AI) + Cassetto delle Note + RLS.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 1) SISTEMA A TOKEN PER LA CHAT AI
-- Budget mensili: Free 30K · Starter 1,5M · Pro 3M · Enterprise illimitati.
-- Gli ospiti (no account) hanno un budget giornaliero di 30K token
-- gestito lato server via Redis (nessuna colonna necessaria).
-- ─────────────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tokens_used_month BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_period_start TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────
-- 2) CASSETTO DELLE NOTE
-- Richiesto dalle API /api/notes* e dalla pagina /notes.
-- ─────────────────────────────────────────────────────────────

-- ── NOTE (core) ─────────────────────────────────────────────────
create table if not exists public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,                 -- email utente (pattern chat_history)
  title         text not null default '',
  snippet_code  text not null,                 -- codice originale selezionato
  explanation   text not null,                 -- spiegazione generata dall'AI
  language      text not null default 'javascript',
  source_type   text not null default 'webapp' check (source_type in ('webapp', 'extension')),
  source_url    text,                          -- URL pagina (se salvata da estensione)
  source_ref    text,                          -- chat_id / riferimento (se da webapp)
  status        text not null default 'pending' check (status in ('pending', 'ready')),
  -- Fase 3: spaced repetition (Leitner semplificato)
  leitner_box   int not null default 0 check (leitner_box between 0 and 4),
  next_review_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists notes_user_idx   on public.notes (user_id, created_at desc);
create index if not exists notes_status_idx on public.notes (user_id, status);
create index if not exists notes_review_idx on public.notes (user_id, next_review_at)
  where next_review_at is not null;

-- ── CATEGORIE (normalizzate per utente) ─────────────────────────
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  name       text not null,
  created_at timestamptz not null default now()
);

-- Unicità case-insensitive per utente (le constraint UNIQUE inline non
-- accettano espressioni come lower(name), serve un indice unico).
create unique index if not exists categories_user_name_uq
  on public.categories (user_id, lower(name));

-- ── RELAZIONE NOTE ↔ CATEGORIE ──────────────────────────────────
create table if not exists public.note_categories (
  note_id     uuid not null references public.notes(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (note_id, category_id)
);

create index if not exists note_categories_cat_idx on public.note_categories (category_id);

-- ── PERCORSI DI APPRENDIMENTO (Fase 2) ──────────────────────────
create table if not exists public.learning_paths (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  title      text not null,
  created_at timestamptz not null default now()
);

create index if not exists learning_paths_user_idx on public.learning_paths (user_id, created_at desc);

create table if not exists public.learning_path_notes (
  path_id  uuid not null references public.learning_paths(id) on delete cascade,
  note_id  uuid not null references public.notes(id) on delete cascade,
  position int not null default 0,
  primary key (path_id, note_id)
);

-- ─────────────────────────────────────────────────────────────
-- 3) ROW LEVEL SECURITY (difesa in profondità)
-- Nota: le API usano la service role key e filtrano sempre
-- per user_id nel codice. L'RLS qui sotto impedisce comunque
-- l'accesso diretto via anon key a chi non possiede i dati.
-- ─────────────────────────────────────────────────────────────
alter table public.notes               enable row level security;
alter table public.categories          enable row level security;
alter table public.note_categories     enable row level security;
alter table public.learning_paths      enable row level security;
alter table public.learning_path_notes enable row level security;

drop policy if exists notes_select on public.notes;
drop policy if exists notes_insert on public.notes;
drop policy if exists notes_update on public.notes;
drop policy if exists notes_delete on public.notes;

create policy notes_select on public.notes for select
  using ((auth.jwt() ->> 'email') = user_id);
create policy notes_insert on public.notes for insert
  with check ((auth.jwt() ->> 'email') = user_id);
create policy notes_update on public.notes for update
  using ((auth.jwt() ->> 'email') = user_id);
create policy notes_delete on public.notes for delete
  using ((auth.jwt() ->> 'email') = user_id);

drop policy if exists categories_select on public.categories;
drop policy if exists categories_insert on public.categories;
drop policy if exists categories_update on public.categories;
drop policy if exists categories_delete on public.categories;

create policy categories_select on public.categories for select
  using ((auth.jwt() ->> 'email') = user_id);
create policy categories_insert on public.categories for insert
  with check ((auth.jwt() ->> 'email') = user_id);
create policy categories_update on public.categories for update
  using ((auth.jwt() ->> 'email') = user_id);
create policy categories_delete on public.categories for delete
  using ((auth.jwt() ->> 'email') = user_id);

drop policy if exists note_categories_select on public.note_categories;
drop policy if exists note_categories_insert on public.note_categories;
drop policy if exists note_categories_delete on public.note_categories;

create policy note_categories_select on public.note_categories for select
  using (
    exists (
      select 1 from public.notes n
      where n.id = note_id and (auth.jwt() ->> 'email') = n.user_id
    )
  );
create policy note_categories_insert on public.note_categories for insert
  with check (
    exists (
      select 1 from public.notes n
      where n.id = note_id and (auth.jwt() ->> 'email') = n.user_id
    )
  );
create policy note_categories_delete on public.note_categories for delete
  using (
    exists (
      select 1 from public.notes n
      where n.id = note_id and (auth.jwt() ->> 'email') = n.user_id
    )
  );

drop policy if exists learning_paths_select on public.learning_paths;
drop policy if exists learning_paths_insert on public.learning_paths;
drop policy if exists learning_paths_delete on public.learning_paths;

create policy learning_paths_select on public.learning_paths for select
  using ((auth.jwt() ->> 'email') = user_id);
create policy learning_paths_insert on public.learning_paths for insert
  with check ((auth.jwt() ->> 'email') = user_id);
create policy learning_paths_delete on public.learning_paths for delete
  using ((auth.jwt() ->> 'email') = user_id);

drop policy if exists learning_path_notes_select on public.learning_path_notes;
drop policy if exists learning_path_notes_insert on public.learning_path_notes;
drop policy if exists learning_path_notes_delete on public.learning_path_notes;

create policy learning_path_notes_select on public.learning_path_notes for select
  using (
    exists (
      select 1 from public.learning_paths p
      where p.id = path_id and (auth.jwt() ->> 'email') = p.user_id
    )
  );
create policy learning_path_notes_insert on public.learning_path_notes for insert
  with check (
    exists (
      select 1 from public.learning_paths p
      where p.id = path_id and (auth.jwt() ->> 'email') = p.user_id
    )
  );
create policy learning_path_notes_delete on public.learning_path_notes for delete
  using (
    exists (
      select 1 from public.learning_paths p
      where p.id = path_id and (auth.jwt() ->> 'email') = p.user_id
    )
  );
