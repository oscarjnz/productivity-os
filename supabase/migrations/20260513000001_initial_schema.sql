-- =============================================================================
-- Productivity OS — Initial schema
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =============================================================================
-- profiles : 1:1 extension of auth.users
-- =============================================================================
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique,
  display_name  text,
  avatar_url    text,
  preferences   jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =============================================================================
-- dashboards : a user may own multiple
-- =============================================================================
create table public.dashboards (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  name         text not null,
  is_default   boolean not null default false,
  grid_config  jsonb not null default '{"cols":12,"rowHeight":80,"gap":12}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_dashboards_user on public.dashboards(user_id);

-- =============================================================================
-- widget_instances : placed widgets within a dashboard
-- =============================================================================
create table public.widget_instances (
  id            uuid primary key default gen_random_uuid(),
  dashboard_id  uuid not null references public.dashboards(id) on delete cascade,
  type          text not null,
  pos_x         int not null,
  pos_y         int not null,
  width         int not null,
  height        int not null,
  config        jsonb not null default '{}'::jsonb,
  z_order       int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_widgets_dashboard on public.widget_instances(dashboard_id);

-- =============================================================================
-- tasks
-- =============================================================================
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null,
  completed   boolean not null default false,
  priority    smallint not null default 0,
  due_at      timestamptz,
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_tasks_user_completed on public.tasks(user_id, completed);

-- =============================================================================
-- notes : sticky notes
-- =============================================================================
create table public.notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  content       text not null default '',
  color_index   smallint not null default 0,
  pos_x         int not null default 0,
  pos_y         int not null default 0,
  pinned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_notes_user on public.notes(user_id);

-- =============================================================================
-- bookmarks
-- =============================================================================
create table public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  label       text not null,
  url         text not null,
  icon        text,
  group_name  text,
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create index idx_bookmarks_user on public.bookmarks(user_id);

-- =============================================================================
-- oauth_connections : 3rd-party access tokens (Spotify, GitHub extra, etc.)
-- =============================================================================
create table public.oauth_connections (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  provider       text not null,
  access_token   text not null,
  refresh_token  text,
  expires_at     timestamptz,
  scopes         text[],
  created_at     timestamptz not null default now(),
  unique (user_id, provider)
);

-- =============================================================================
-- updated_at trigger
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at        before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_dashboards_updated_at      before update on public.dashboards
  for each row execute function public.set_updated_at();
create trigger trg_widget_instances_updated_at before update on public.widget_instances
  for each row execute function public.set_updated_at();
create trigger trg_tasks_updated_at           before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger trg_notes_updated_at           before update on public.notes
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Auto-create profile + default dashboard on signup
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_dashboard_id uuid;
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.dashboards (user_id, name, is_default)
  values (new.id, 'Home', true)
  returning id into v_dashboard_id;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
