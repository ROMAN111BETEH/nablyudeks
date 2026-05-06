create extension if not exists "pgcrypto";

create table if not exists public.site_content (
  locale text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_slug text null,
  sort_order int not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_slug text not null,
  title text not null,
  price numeric(12, 2) not null,
  description text not null,
  specs text not null,
  article text not null,
  images text[] not null default '{}',
  sort_order int not null default 1,
  updated_at timestamptz not null default now()
);

create index if not exists idx_categories_sort_order on public.categories(sort_order);
create index if not exists idx_products_category on public.products(category_slug);
create index if not exists idx_products_sort_order on public.products(sort_order);

alter table public.site_content enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;

create policy if not exists "Public read site content" on public.site_content
for select to anon, authenticated using (true);

create policy if not exists "Public read categories" on public.categories
for select to anon, authenticated using (true);

create policy if not exists "Public read products" on public.products
for select to anon, authenticated using (true);

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy if not exists "Public read product images" on storage.objects
for select using (bucket_id = 'products');
