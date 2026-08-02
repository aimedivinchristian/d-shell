-- D>shell — Supabase schema for cross-device progress + session sync
-- Run this in the Supabase SQL editor (or `supabase db push` if using the CLI).

-- ── progress ───────────────────────────────────────────────
-- One row per signed-in user. completed_ids is the full list of
-- challenge IDs the learner has finished — small, low-frequency writes.
create table if not exists public.progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  completed_ids text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.progress enable row level security;

create policy "Users can read their own progress"
  on public.progress for select
  using (auth.uid() = user_id);

create policy "Users can insert their own progress"
  on public.progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own progress"
  on public.progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── sessions ───────────────────────────────────────────────
-- One row per signed-in user. filesystem_json is a serialized snapshot
-- of the learner's virtual filesystem tree, synced periodically (not on
-- every keystroke) so a returning user resumes where they left off.
create table if not exists public.sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  filesystem_json jsonb not null,
  schema_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.sessions enable row level security;

create policy "Users can read their own session"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own session"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own session"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── updated_at maintenance ────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger progress_set_updated_at
  before update on public.progress
  for each row execute function public.set_updated_at();

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();
