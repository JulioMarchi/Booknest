-- BookNest — Migração 0009: Hardening de performance
-- Resolve os achados do Supabase Performance Advisor.

-- 1) Índices de FK que faltavam ------------------------------------------
create index idx_favorites_ebook on public.favorites (ebook_id);
create index idx_reviews_user on public.reviews (user_id);

-- 2) RLS: (select auth.uid()) em vez de auth.uid() ------------------------
-- Sem o `select`, o Postgres reavalia a função para CADA linha da
-- tabela durante o planejamento da query. Com `(select auth.uid())`,
-- vira um InitPlan avaliado uma única vez por consulta.

drop policy "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users
  for select using ((select auth.uid()) = id or public.is_admin((select auth.uid())));

drop policy "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using ((select auth.uid()) = id);

drop policy "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories
  for insert with check (public.is_admin((select auth.uid())));

drop policy "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories
  for update using (public.is_admin((select auth.uid())));

drop policy "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories
  for delete using (public.is_admin((select auth.uid())));

drop policy "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons
  for all using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

drop policy "ebooks_public_read_published" on public.ebooks;
create policy "ebooks_public_read_published" on public.ebooks
  for select using (
    published = true
    or (select auth.uid()) = author_id
    or public.is_admin((select auth.uid()))
  );

drop policy "ebooks_author_admin_insert" on public.ebooks;
create policy "ebooks_author_admin_insert" on public.ebooks
  for insert with check (
    (select auth.uid()) = author_id or public.is_admin((select auth.uid()))
  );

drop policy "ebooks_author_admin_update" on public.ebooks;
create policy "ebooks_author_admin_update" on public.ebooks
  for update using (
    (select auth.uid()) = author_id or public.is_admin((select auth.uid()))
  );

drop policy "ebooks_author_admin_delete" on public.ebooks;
create policy "ebooks_author_admin_delete" on public.ebooks
  for delete using (
    (select auth.uid()) = author_id or public.is_admin((select auth.uid()))
  );

drop policy "purchases_select_own_or_admin" on public.purchases;
create policy "purchases_select_own_or_admin" on public.purchases
  for select using (
    (select auth.uid()) = user_id or public.is_admin((select auth.uid()))
  );

drop policy "purchases_admin_update" on public.purchases;
create policy "purchases_admin_update" on public.purchases
  for update using (public.is_admin((select auth.uid())));

drop policy "downloads_select_own_or_admin" on public.downloads;
create policy "downloads_select_own_or_admin" on public.downloads
  for select using (
    (select auth.uid()) = user_id or public.is_admin((select auth.uid()))
  );

drop policy "downloads_insert_if_purchased" on public.downloads;
create policy "downloads_insert_if_purchased" on public.downloads
  for insert with check (
    (select auth.uid()) = user_id
    and public.has_purchased((select auth.uid()), ebook_id)
  );

drop policy "reviews_insert_if_purchased" on public.reviews;
create policy "reviews_insert_if_purchased" on public.reviews
  for insert with check (
    (select auth.uid()) = user_id
    and public.has_purchased((select auth.uid()), ebook_id)
  );

drop policy "reviews_update_own" on public.reviews;
create policy "reviews_update_own" on public.reviews
  for update using ((select auth.uid()) = user_id);

drop policy "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews
  for delete using (
    (select auth.uid()) = user_id or public.is_admin((select auth.uid()))
  );

drop policy "favorites_all_own" on public.favorites;
create policy "favorites_all_own" on public.favorites
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- "unused_index" (INFO) nos demais índices é esperado: o banco está
-- vazio e ainda não recebeu nenhuma query real — não é uma ação a
-- tomar agora, apenas reflexo de não haver dados/tráfego ainda.
