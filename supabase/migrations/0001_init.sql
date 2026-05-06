-- OER-Dashboard — Initiales Schema
--
-- Anwendung: im Supabase-Dashboard → SQL Editor → New query → Inhalt einfügen → Run.
-- Das Skript ist idempotent: nochmaliges Ausführen verändert nichts (außer Updates).
--
-- Was hier passiert:
--  1. zwei Tabellen: `categories` (10 Fachbereiche) und `resources` (die Einträge)
--  2. ein Storage-Bucket `resource-images` für hochgeladene Bilder
--  3. Row Level Security (RLS) so eingestellt, dass:
--       - jede:r lesen darf (anon + authenticated)
--       - nur eingeloggte Admins schreiben/ändern/löschen dürfen
--  4. Trigger, der bei jedem UPDATE automatisch `updated_at` setzt

-- ─────────────────────────────────────────────────────────────────────
-- 1. Hilfsfunktion: updated_at automatisch fortschreiben
-- ─────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Tabelle: categories
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          text primary key
              check (id ~ '^[a-z0-9_-]{1,32}$'),  -- nur kleinbuchstaben/zahlen/-_
  label       text not null,                      -- Langform z. B. "Berufspraktische Ausbildung"
  short       text not null,                      -- Kurzform z. B. "Berufspraxis"
  color       text not null
              check (color ~ '^#[0-9a-fA-F]{6}$'),-- Hex-Farbcode
  sort_order  int  not null default 0,            -- Reihenfolge in der Pillen-Nav
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 3. Tabelle: resources
-- ─────────────────────────────────────────────────────────────────────
create table if not exists public.resources (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  category_id  text not null references public.categories(id) on delete restrict,
  url          text not null
               check (url ~* '^https://'),        -- nur https erlaubt
  tags         text[] not null default array['Material'],
  image_path   text,                              -- null = Placeholder-SVG
  featured     boolean not null default false,
  created_by   uuid references auth.users on delete set null,
  updated_by   uuid references auth.users on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists resources_category_id_idx on public.resources(category_id);
create index if not exists resources_featured_idx    on public.resources(featured) where featured;

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
  before update on public.resources
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────
-- 4. Row Level Security
--    Default in Postgres: keine Policy = kein Zugriff. Wir machen
--    SELECT explizit für alle auf, und Schreib-Operationen nur für
--    authenticated User.
-- ─────────────────────────────────────────────────────────────────────
alter table public.categories enable row level security;
alter table public.resources  enable row level security;

-- categories: lesen für alle
drop policy if exists "categories_select" on public.categories;
create policy "categories_select"
  on public.categories for select
  to anon, authenticated
  using (true);

-- categories: schreiben nur für eingeloggte User
drop policy if exists "categories_insert" on public.categories;
create policy "categories_insert"
  on public.categories for insert
  to authenticated
  with check (true);

drop policy if exists "categories_update" on public.categories;
create policy "categories_update"
  on public.categories for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "categories_delete" on public.categories;
create policy "categories_delete"
  on public.categories for delete
  to authenticated
  using (true);

-- resources: lesen für alle
drop policy if exists "resources_select" on public.resources;
create policy "resources_select"
  on public.resources for select
  to anon, authenticated
  using (true);

-- resources: schreiben nur für eingeloggte User
drop policy if exists "resources_insert" on public.resources;
create policy "resources_insert"
  on public.resources for insert
  to authenticated
  with check (true);

drop policy if exists "resources_update" on public.resources;
create policy "resources_update"
  on public.resources for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "resources_delete" on public.resources;
create policy "resources_delete"
  on public.resources for delete
  to authenticated
  using (true);

-- ─────────────────────────────────────────────────────────────────────
-- 5. Storage-Bucket für Ressourcen-Bilder
--    public = true → Bilder sind über die public-URL direkt im Browser
--    abrufbar (das brauchen wir für den Katalog).
-- ─────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('resource-images', 'resource-images', true)
on conflict (id) do update set public = excluded.public;

-- Storage-Policies: lesen für alle, schreiben nur für authenticated
drop policy if exists "resource_images_select" on storage.objects;
create policy "resource_images_select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'resource-images');

drop policy if exists "resource_images_insert" on storage.objects;
create policy "resource_images_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'resource-images');

drop policy if exists "resource_images_update" on storage.objects;
create policy "resource_images_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'resource-images')
  with check (bucket_id = 'resource-images');

drop policy if exists "resource_images_delete" on storage.objects;
create policy "resource_images_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'resource-images');
