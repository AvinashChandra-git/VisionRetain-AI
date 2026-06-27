create extension if not exists pgcrypto;

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
create index if not exists price_listings_scan_idx
  on public.price_listings(scan_id);
create index if not exists price_listings_owner_fetched_idx
  on public.price_listings(owner_id, fetched_at desc);
create index if not exists price_listings_title_idx
  on public.price_listings using gin(to_tsvector('simple', title));

alter table public.product_scans enable row level security;
alter table public.price_listings enable row level security;

drop policy if exists "Users can read their product scans" on public.product_scans;
create policy "Users can read their product scans"
  on public.product_scans for select
  using (auth.uid() = owner_id);

drop policy if exists "Users can read their price listings" on public.price_listings;
create policy "Users can read their price listings"
  on public.price_listings for select
  using (auth.uid() = owner_id);
