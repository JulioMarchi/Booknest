-- BookNest — Migração 0009: Otimização de auth.uid() nas RLS policies
--
-- O advisor de performance acusou "Auth RLS Initialization Plan" nas
-- policies recriadas pela migração 0008: auth.uid() sem SELECT em volta
-- é reavaliado LINHA A LINHA pelo Postgres. Envolver em (select ...)
-- faz o planner tratar como InitPlan, avaliado uma única vez por query.
-- Ver: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

drop policy "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users for select
  using ((select auth.uid()) = id or private.is_admin((select auth.uid())));

drop policy "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories for insert
  with check (private.is_admin((select auth.uid())));
drop policy "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories for update
  using (private.is_admin((select auth.uid())));
drop policy "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories for delete
  using (private.is_admin((select auth.uid())));

drop policy "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons for all
  using (private.is_admin((select auth.uid()))) with check (private.is_admin((select auth.uid())));

drop policy "ebooks_public_read_published" on public.ebooks;
create policy "ebooks_public_read_published" on public.ebooks for select
  using (published = true or (select auth.uid()) = author_id or private.is_admin((select auth.uid())));
drop policy "ebooks_author_admin_insert" on public.ebooks;
create policy "ebooks_author_admin_insert" on public.ebooks for insert
  with check ((select auth.uid()) = author_id or private.is_admin((select auth.uid())));
drop policy "ebooks_author_admin_update" on public.ebooks;
create policy "ebooks_author_admin_update" on public.ebooks for update
  using ((select auth.uid()) = author_id or private.is_admin((select auth.uid())));
drop policy "ebooks_author_admin_delete" on public.ebooks;
create policy "ebooks_author_admin_delete" on public.ebooks for delete
  using ((select auth.uid()) = author_id or private.is_admin((select auth.uid())));

drop policy "purchases_select_own_or_admin" on public.purchases;
create policy "purchases_select_own_or_admin" on public.purchases for select
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
drop policy "purchases_admin_update" on public.purchases;
create policy "purchases_admin_update" on public.purchases for update
  using (private.is_admin((select auth.uid())));

drop policy "downloads_select_own_or_admin" on public.downloads;
create policy "downloads_select_own_or_admin" on public.downloads for select
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));
drop policy "downloads_insert_if_purchased" on public.downloads;
create policy "downloads_insert_if_purchased" on public.downloads for insert
  with check ((select auth.uid()) = user_id and private.has_purchased((select auth.uid()), ebook_id));

drop policy "reviews_insert_if_purchased" on public.reviews;
create policy "reviews_insert_if_purchased" on public.reviews for insert
  with check ((select auth.uid()) = user_id and private.has_purchased((select auth.uid()), ebook_id));
drop policy "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews for delete
  using ((select auth.uid()) = user_id or private.is_admin((select auth.uid())));

drop policy "covers_admin_insert" on storage.objects;
create policy "covers_admin_insert" on storage.objects for insert
  with check (bucket_id = 'covers' and private.is_admin((select auth.uid())));
drop policy "covers_admin_update" on storage.objects;
create policy "covers_admin_update" on storage.objects for update
  using (bucket_id = 'covers' and private.is_admin((select auth.uid())));
drop policy "covers_admin_delete" on storage.objects;
create policy "covers_admin_delete" on storage.objects for delete
  using (bucket_id = 'covers' and private.is_admin((select auth.uid())));

drop policy "ebooks_bucket_admin_insert" on storage.objects;
create policy "ebooks_bucket_admin_insert" on storage.objects for insert
  with check (bucket_id = 'ebooks' and private.is_admin((select auth.uid())));
drop policy "ebooks_bucket_admin_update" on storage.objects;
create policy "ebooks_bucket_admin_update" on storage.objects for update
  using (bucket_id = 'ebooks' and private.is_admin((select auth.uid())));
drop policy "ebooks_bucket_admin_delete" on storage.objects;
create policy "ebooks_bucket_admin_delete" on storage.objects for delete
  using (bucket_id = 'ebooks' and private.is_admin((select auth.uid())));
