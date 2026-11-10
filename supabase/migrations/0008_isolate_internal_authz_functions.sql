-- BookNest — Migração 0008: Isolamento de funções internas de autorização
--
-- is_admin() e has_purchased() só devem ser usadas DENTRO de RLS
-- policies e de outras functions — nunca como RPC pública. O advisor
-- de segurança acusou ambas expostas em /rest/v1/rpc/is_admin e
-- /rest/v1/rpc/has_purchased para os papéis anon/authenticated (uma
-- delas permitia checar se um UUID arbitrário era admin).
--
-- Movidas para o schema "private", que não é exposto pelo PostgREST.
-- RLS pode referenciar funções de qualquer schema pelo nome
-- qualificado, então as policies continuam funcionando.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_admin(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users where id = p_user and role = 'admin');
$$;

create or replace function private.has_purchased(p_user uuid, p_ebook uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.purchases where user_id = p_user and ebook_id = p_ebook);
$$;

create or replace function public.prevent_role_escalation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role <> old.role and not private.is_admin(auth.uid()) then
    new.role = old.role;
  end if;
  return new;
end;
$$;

drop policy "users_select_own_or_admin" on public.users;
create policy "users_select_own_or_admin" on public.users for select
  using (auth.uid() = id or private.is_admin(auth.uid()));

drop policy "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories for insert
  with check (private.is_admin(auth.uid()));
drop policy "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories for update
  using (private.is_admin(auth.uid()));
drop policy "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories for delete
  using (private.is_admin(auth.uid()));

drop policy "coupons_admin_all" on public.coupons;
create policy "coupons_admin_all" on public.coupons for all
  using (private.is_admin(auth.uid())) with check (private.is_admin(auth.uid()));

drop policy "ebooks_public_read_published" on public.ebooks;
create policy "ebooks_public_read_published" on public.ebooks for select
  using (published = true or auth.uid() = author_id or private.is_admin(auth.uid()));
drop policy "ebooks_author_admin_insert" on public.ebooks;
create policy "ebooks_author_admin_insert" on public.ebooks for insert
  with check (auth.uid() = author_id or private.is_admin(auth.uid()));
drop policy "ebooks_author_admin_update" on public.ebooks;
create policy "ebooks_author_admin_update" on public.ebooks for update
  using (auth.uid() = author_id or private.is_admin(auth.uid()));
drop policy "ebooks_author_admin_delete" on public.ebooks;
create policy "ebooks_author_admin_delete" on public.ebooks for delete
  using (auth.uid() = author_id or private.is_admin(auth.uid()));

drop policy "purchases_select_own_or_admin" on public.purchases;
create policy "purchases_select_own_or_admin" on public.purchases for select
  using (auth.uid() = user_id or private.is_admin(auth.uid()));
drop policy "purchases_admin_update" on public.purchases;
create policy "purchases_admin_update" on public.purchases for update
  using (private.is_admin(auth.uid()));

drop policy "downloads_select_own_or_admin" on public.downloads;
create policy "downloads_select_own_or_admin" on public.downloads for select
  using (auth.uid() = user_id or private.is_admin(auth.uid()));
drop policy "downloads_insert_if_purchased" on public.downloads;
create policy "downloads_insert_if_purchased" on public.downloads for insert
  with check (auth.uid() = user_id and private.has_purchased(auth.uid(), ebook_id));

drop policy "reviews_insert_if_purchased" on public.reviews;
create policy "reviews_insert_if_purchased" on public.reviews for insert
  with check (auth.uid() = user_id and private.has_purchased(auth.uid(), ebook_id));
drop policy "reviews_delete_own_or_admin" on public.reviews;
create policy "reviews_delete_own_or_admin" on public.reviews for delete
  using (auth.uid() = user_id or private.is_admin(auth.uid()));

drop policy "covers_admin_insert" on storage.objects;
create policy "covers_admin_insert" on storage.objects for insert
  with check (bucket_id = 'covers' and private.is_admin(auth.uid()));
drop policy "covers_admin_update" on storage.objects;
create policy "covers_admin_update" on storage.objects for update
  using (bucket_id = 'covers' and private.is_admin(auth.uid()));
drop policy "covers_admin_delete" on storage.objects;
create policy "covers_admin_delete" on storage.objects for delete
  using (bucket_id = 'covers' and private.is_admin(auth.uid()));

drop policy "ebooks_bucket_admin_insert" on storage.objects;
create policy "ebooks_bucket_admin_insert" on storage.objects for insert
  with check (bucket_id = 'ebooks' and private.is_admin(auth.uid()));
drop policy "ebooks_bucket_admin_update" on storage.objects;
create policy "ebooks_bucket_admin_update" on storage.objects for update
  using (bucket_id = 'ebooks' and private.is_admin(auth.uid()));
drop policy "ebooks_bucket_admin_delete" on storage.objects;
create policy "ebooks_bucket_admin_delete" on storage.objects for delete
  using (bucket_id = 'ebooks' and private.is_admin(auth.uid()));

drop function if exists public.is_admin(uuid);
drop function if exists public.has_purchased(uuid, uuid);

-- Policy explícita deixa claro no dashboard que o bloqueio total a
-- rate_limits é intencional (silencia o advisor "RLS enabled no policy").
create policy "rate_limits_deny_all" on public.rate_limits for all using (false);

comment on function public.validate_coupon(text) is
  'RPC pública intencional (chamada pelo checkout). Não expõe uses_count/max_uses/datas, só id/tipo/valor de um cupom já validado. Mitigada por rate limiting na rota de checkout.';
