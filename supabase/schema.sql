-- Pollster database schema
-- Run this in the Supabase SQL editor once to set up your database.

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text,
  status text not null default 'open' check (status in ('open', 'closed')),
  audience_groups text[],
  survey_id text,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Upgrade path for existing databases (safe to run multiple times)
alter table public.sessions add column if not exists audience_groups text[];
alter table public.sessions add column if not exists survey_id text;

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  answers jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists responses_session_idx on public.responses(session_id);
create index if not exists sessions_code_idx on public.sessions(code);

-- Row-level security
alter table public.sessions enable row level security;
alter table public.responses enable row level security;

-- Anyone can read session info (needed to look up by code)
drop policy if exists "sessions_read_all" on public.sessions;
create policy "sessions_read_all" on public.sessions
  for select using (true);

-- Anyone can create a session (admin page is gated client-side by VITE_ADMIN_PASSWORD;
-- for stronger protection, replace this with Supabase Auth + a role check).
drop policy if exists "sessions_insert_all" on public.sessions;
create policy "sessions_insert_all" on public.sessions
  for insert with check (true);

drop policy if exists "sessions_update_all" on public.sessions;
create policy "sessions_update_all" on public.sessions
  for update using (true) with check (true);

drop policy if exists "sessions_delete_all" on public.sessions;
create policy "sessions_delete_all" on public.sessions
  for delete using (true);

-- Anyone can insert responses to an OPEN session (anonymous audience submits)
drop policy if exists "responses_insert_open" on public.responses;
create policy "responses_insert_open" on public.responses
  for insert with check (
    exists (
      select 1 from public.sessions s
      where s.id = session_id and s.status = 'open'
    )
  );

-- Anyone can read aggregated responses (results are public)
drop policy if exists "responses_read_all" on public.responses;
create policy "responses_read_all" on public.responses
  for select using (true);

-- Enable Realtime on responses so live updates work
-- (In Supabase Dashboard: Database → Replication → enable for `responses` table)
alter publication supabase_realtime add table public.responses;
