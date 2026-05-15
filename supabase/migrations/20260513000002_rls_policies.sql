-- =============================================================================
-- Productivity OS — Row Level Security
-- Every table owned by a user. NEVER disable.
-- =============================================================================

alter table public.profiles           enable row level security;
alter table public.dashboards         enable row level security;
alter table public.widget_instances   enable row level security;
alter table public.tasks              enable row level security;
alter table public.notes              enable row level security;
alter table public.bookmarks          enable row level security;
alter table public.oauth_connections  enable row level security;

-- ---------- profiles -----------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- dashboards ---------------------------------------------------------
create policy "dashboards_all_own" on public.dashboards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- widget_instances : authorize via dashboard ownership ---------------
create policy "widgets_all_via_dashboard" on public.widget_instances
  for all using (
    exists (
      select 1 from public.dashboards d
      where d.id = dashboard_id and d.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.dashboards d
      where d.id = dashboard_id and d.user_id = auth.uid()
    )
  );

-- ---------- tasks --------------------------------------------------------------
create policy "tasks_all_own" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- notes --------------------------------------------------------------
create policy "notes_all_own" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- bookmarks ----------------------------------------------------------
create policy "bookmarks_all_own" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- oauth_connections --------------------------------------------------
create policy "oauth_all_own" on public.oauth_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
