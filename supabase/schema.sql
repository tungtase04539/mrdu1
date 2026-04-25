create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short text,
  subtitle text,
  tagline text,
  description text,
  accent text,
  accent_ink text,
  hero_image text,
  knowledge jsonb default '[]'::jsonb,
  sort_order integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  slug text not null,
  name text not null,
  sort_order integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (category_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  name text not null,
  brand text not null,
  short_description text not null,
  description text not null,
  ingredients text[],
  usage text[],
  origin text,
  image text,
  gallery text[] default '{}',
  badge text,
  price integer,
  stock integer default 0,
  commitment text,
  is_featured boolean default false,
  is_published boolean default true,
  sort_order integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (category_id, slug)
);

alter table public.products
  add column if not exists price integer,
  add column if not exists stock integer default 0,
  add column if not exists commitment text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_price_nonnegative'
  ) then
    alter table public.products add constraint products_price_nonnegative check (price is null or price >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_stock_nonnegative'
  ) then
    alter table public.products add constraint products_stock_nonnegative check (stock is null or stock >= 0);
  end if;
end $$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  interest text,
  message text,
  status text default 'new',
  note text,
  handled_at timestamptz,
  handled_by text,
  created_at timestamptz default now()
);

alter table public.leads
  add column if not exists status text default 'new',
  add column if not exists note text,
  add column if not exists handled_at timestamptz,
  add column if not exists handled_by text;

update public.leads set status = 'new' where status is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leads_status_valid') then
    alter table public.leads
      add constraint leads_status_valid check (status in ('new', 'contacted', 'converted', 'archived'));
  end if;
end $$;

create index if not exists idx_leads_status_created
  on public.leads(status, created_at desc);

alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.products enable row level security;
alter table public.leads enable row level security;

create index if not exists idx_products_public_listing
  on public.products(category_id, sort_order, name)
  where is_published = true;

create index if not exists idx_products_featured_public
  on public.products(sort_order, name)
  where is_published = true and is_featured = true;

create index if not exists idx_subcategories_category_sort
  on public.subcategories(category_id, sort_order, name);

create index if not exists idx_leads_created_at
  on public.leads(created_at desc);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select
  using (true);

drop policy if exists "Public can read subcategories" on public.subcategories;
create policy "Public can read subcategories"
  on public.subcategories for select
  using (true);

drop policy if exists "Public can read published products" on public.products;
create policy "Public can read published products"
  on public.products for select
  using (is_published = true);

-- Inserts/updates/deletes are performed only by Next.js route handlers using
-- SUPABASE_SERVICE_ROLE_KEY. Do not add public write policies for CMS tables.
