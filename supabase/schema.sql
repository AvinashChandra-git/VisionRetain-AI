create extension if not exists pgcrypto;

create table if not exists public.dashboard_metrics (
  key text primary key,
  label text not null,
  value numeric not null,
  delta text,
  color text,
  icon text,
  format text,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  plan text not null,
  spend numeric not null default 0,
  churn numeric not null default 0 check (churn between 0 and 100),
  risk text not null,
  segment text,
  ltv numeric not null default 0,
  nps integer,
  tenure integer not null default 0,
  last_active text,
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;
create index if not exists customers_owner_updated_idx
  on public.customers(owner_id, updated_at desc);

create table if not exists public.product_scans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  image_sha256 text not null,
  product_name text not null,
  brand text,
  model text,
  category text,
  confidence numeric(5,2) check (confidence between 0 and 100),
  identity_status text not null default 'category_only'
    check (identity_status in ('exact', 'probable', 'category_only', 'unknown')),
  objects jsonb not null default '[]'::jsonb,
  features jsonb not null default '[]'::jsonb,
  ocr_text text,
  price_min numeric,
  price_max numeric,
  currency text,
  prices_fetched_at timestamptz,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.price_listings (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references public.product_scans(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete set null,
  store text not null,
  title text not null,
  price numeric not null check (price >= 0),
  currency text not null,
  product_url text not null,
  source_url text,
  availability text,
  rating numeric,
  relevance numeric(5,4),
  fetched_at timestamptz not null default now()
);

create index if not exists product_scans_owner_created_idx
  on public.product_scans(owner_id, created_at desc);
create index if not exists price_listings_scan_idx on public.price_listings(scan_id);
create index if not exists price_listings_title_idx on public.price_listings using gin(to_tsvector('simple', title));

alter table public.product_scans enable row level security;
alter table public.price_listings enable row level security;
alter table public.dashboard_metrics enable row level security;
alter table public.customers enable row level security;

drop policy if exists "Users can read their product scans" on public.product_scans;
create policy "Users can read their product scans"
  on public.product_scans for select
  using (auth.uid() = owner_id);
drop policy if exists "Users can read their price listings" on public.price_listings;
create policy "Users can read their price listings"
  on public.price_listings for select
  using (auth.uid() = owner_id);
drop policy if exists "Users can read their customers" on public.customers;
create policy "Users can read their customers"
  on public.customers for select
  using (auth.uid() = owner_id);
drop policy if exists "Users can create their customers" on public.customers;
create policy "Users can create their customers"
  on public.customers for insert
  with check (auth.uid() = owner_id);
drop policy if exists "Users can update their customers" on public.customers;
create policy "Users can update their customers"
  on public.customers for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
drop policy if exists "Users can delete their customers" on public.customers;
create policy "Users can delete their customers"
  on public.customers for delete
  using (auth.uid() = owner_id);
