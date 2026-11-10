-- BookNest — Migração 0002: Tabelas principais
-- Ordem respeita as dependências de foreign key.

-- USERS — perfil público, espelha auth.users 1:1 (criado via trigger
-- handle_new_user, ver migração 0004).
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  avatar text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.users is 'Perfil público de cada usuário autenticado.';

-- CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- COUPONS (precisa existir antes de purchases, que referencia coupon_id)
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type public.discount_type not null,
  discount_value numeric(10, 2) not null check (discount_value > 0),
  max_uses integer check (max_uses is null or max_uses > 0),
  uses_count integer not null default 0,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint valid_period check (valid_until is null or valid_until > valid_from)
);

-- EBOOKS
create table public.ebooks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  category_id uuid references public.categories (id) on delete set null,
  cover text,
  pdf text not null,
  author_id uuid not null references public.users (id) on delete restrict,
  price numeric(10, 2) not null check (price >= 0),
  featured boolean not null default false,
  published boolean not null default false,
  sales_count integer not null default 0,
  rating_avg numeric(2, 1) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.ebooks.cover is 'Caminho do objeto no bucket público "covers".';
comment on column public.ebooks.pdf is 'Caminho do objeto no bucket privado "ebooks" (nunca público — apenas via Signed URL).';
comment on column public.ebooks.sales_count is 'Desnormalizado via trigger on_purchase_created, para ordenar "mais vendidos" sem agregação em tempo real.';
comment on column public.ebooks.rating_avg is 'Desnormalizado via trigger refresh_ebook_rating.';

-- PURCHASES
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  ebook_id uuid not null references public.ebooks (id) on delete restrict,
  payment_id text not null unique,
  coupon_id uuid references public.coupons (id) on delete set null,
  value numeric(10, 2) not null check (value >= 0),
  created_at timestamptz not null default now()
);
comment on table public.purchases is 'Gravada exclusivamente pelo webhook do Stripe (service role) — sem policy de INSERT para authenticated/anon.';
comment on column public.purchases.payment_id is 'ID do Checkout Session / Payment Intent do Stripe. UNIQUE garante idempotência do webhook.';

-- DOWNLOADS
create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  ebook_id uuid not null references public.ebooks (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  rating smallint not null check (rating between 1 and 5),
  comment text,
  ebook_id uuid not null references public.ebooks (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ebook_id, user_id)
);

-- FAVORITES
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  ebook_id uuid not null references public.ebooks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, ebook_id)
);

-- RATE_LIMITS — sem relação com o domínio de negócio; suporta o
-- middleware de rate limiting (ver migração 0004).
create table public.rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);
