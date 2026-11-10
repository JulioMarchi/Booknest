-- BookNest — Migração 0005: Row Level Security
-- Princípio: negar por padrão. Cada tabela só recebe as policies
-- estritamente necessárias; onde não há policy de INSERT/UPDATE, a
-- operação fica bloqueada para "authenticated"/"anon" por padrão.

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.coupons enable row level security;
alter table public.ebooks enable row level security;
alter table public.purchases enable row level security;
alter table public.downloads enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;
alter table public.rate_limits enable row level security;

-- USERS ----------------------------------------------------------------
create policy "users_select_own_or_admin" on public.users
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);
-- Sem policy de INSERT/DELETE: o perfil é criado pelo trigger
-- handle_new_user (security definer) e a exclusão segue auth.users.

-- CATEGORIES -------------------------------------------------------------
create policy "categories_public_read" on public.categories
  for select using (true);

create policy "categories_admin_insert" on public.categories
  for insert with check (public.is_admin(auth.uid()));

create policy "categories_admin_update" on public.categories
  for update using (public.is_admin(auth.uid()));

create policy "categories_admin_delete" on public.categories
  for delete using (public.is_admin(auth.uid()));

-- COUPONS ------------------------------------------------------------------
-- Tabela inteira restrita a admin. Validação pública passa pela função
-- validate_coupon() (security definer), que nunca expõe a tabela crua.
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- EBOOKS -----------------------------------------------------------------
create policy "ebooks_public_read_published" on public.ebooks
  for select using (
    published = true or auth.uid() = author_id or public.is_admin(auth.uid())
  );

create policy "ebooks_author_admin_insert" on public.ebooks
  for insert with check (auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "ebooks_author_admin_update" on public.ebooks
  for update using (auth.uid() = author_id or public.is_admin(auth.uid()));

create policy "ebooks_author_admin_delete" on public.ebooks
  for delete using (auth.uid() = author_id or public.is_admin(auth.uid()));

-- PURCHASES ----------------------------------------------------------------
-- Sem policy de INSERT para authenticated/anon: só o webhook do Stripe,
-- usando a service role (que ignora RLS), grava uma compra. Isso
-- impede que um cliente forje uma compra diretamente pelo client SDK.
create policy "purchases_select_own_or_admin" on public.purchases
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "purchases_admin_update" on public.purchases
  for update using (public.is_admin(auth.uid()));

-- DOWNLOADS ------------------------------------------------------------------
create policy "downloads_select_own_or_admin" on public.downloads
  for select using (auth.uid() = user_id or public.is_admin(auth.uid()));

create policy "downloads_insert_if_purchased" on public.downloads
  for insert with check (
    auth.uid() = user_id and public.has_purchased(auth.uid(), ebook_id)
  );

-- REVIEWS ------------------------------------------------------------------
create policy "reviews_public_read" on public.reviews
  for select using (true);

create policy "reviews_insert_if_purchased" on public.reviews
  for insert with check (
    auth.uid() = user_id and public.has_purchased(auth.uid(), ebook_id)
  );

create policy "reviews_update_own" on public.reviews
  for update using (auth.uid() = user_id);

create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (auth.uid() = user_id or public.is_admin(auth.uid()));

-- FAVORITES ------------------------------------------------------------------
create policy "favorites_all_own" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RATE_LIMITS ------------------------------------------------------------------
-- Nenhuma policy: acesso total bloqueado para authenticated/anon.
-- Só a função check_rate_limit (security definer) toca esta tabela.
