-- BookNest — Migração 0004: Functions e triggers

-- updated_at genérico ------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_ebooks_updated_at
  before update on public.ebooks
  for each row execute function public.set_updated_at();

create trigger trg_reviews_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Helpers de autorização (usados em RLS e no middleware) -------------
create or replace function public.is_admin(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users where id = p_user and role = 'admin'
  );
$$;

create or replace function public.has_purchased(p_user uuid, p_ebook uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.purchases
    where user_id = p_user and ebook_id = p_ebook
  );
$$;

-- Cria o perfil público ao cadastrar (e-mail/senha ou Google OAuth) ---
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url',
    'customer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Impede que o próprio usuário eleve seu papel via update direto -----
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_admin(auth.uid()) then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger trg_prevent_role_escalation
  before update on public.users
  for each row execute function public.prevent_role_escalation();

-- Slug automático para eBooks -----------------------------------------
create or replace function public.slugify(p_text text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(unaccent(p_text)), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.ebooks_set_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  suffix int := 0;
begin
  if new.slug is null or btrim(new.slug) = '' then
    base_slug := public.slugify(new.title);
    final_slug := base_slug;
    while exists (
      select 1 from public.ebooks where slug = final_slug and id <> new.id
    ) loop
      suffix := suffix + 1;
      final_slug := base_slug || '-' || suffix;
    end loop;
    new.slug := final_slug;
  end if;
  return new;
end;
$$;

create trigger trg_ebooks_set_slug
  before insert or update of title, slug on public.ebooks
  for each row execute function public.ebooks_set_slug();

-- Contadores desnormalizados ------------------------------------------
create or replace function public.on_purchase_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.ebooks set sales_count = sales_count + 1 where id = new.ebook_id;

  if new.coupon_id is not null then
    update public.coupons set uses_count = uses_count + 1 where id = new.coupon_id;
  end if;

  return new;
end;
$$;

create trigger trg_on_purchase_created
  after insert on public.purchases
  for each row execute function public.on_purchase_created();

create or replace function public.refresh_ebook_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_ebook uuid;
begin
  target_ebook := coalesce(new.ebook_id, old.ebook_id);

  update public.ebooks e
  set
    rating_avg = coalesce(
      (select round(avg(rating)::numeric, 1) from public.reviews where ebook_id = target_ebook),
      0
    ),
    rating_count = (select count(*) from public.reviews where ebook_id = target_ebook)
  where e.id = target_ebook;

  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_refresh_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_ebook_rating();

-- Validação de cupom sem expor a tabela inteira -----------------------
create or replace function public.validate_coupon(p_code text)
returns table (
  id uuid,
  discount_type public.discount_type,
  discount_value numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.discount_type, c.discount_value
  from public.coupons c
  where c.code = p_code
    and c.active = true
    and c.valid_from <= now()
    and (c.valid_until is null or c.valid_until >= now())
    and (c.max_uses is null or c.uses_count < c.max_uses);
$$;

-- Rate limiting persistido no Postgres ---------------------------------
create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
  window_started_at timestamptz;
begin
  select count, window_start into current_count, window_started_at
  from public.rate_limits
  where key = p_key
  for update;

  if not found then
    insert into public.rate_limits (key, count, window_start) values (p_key, 1, now());
    return true;
  end if;

  if now() - window_started_at > make_interval(secs => p_window_seconds) then
    update public.rate_limits set count = 1, window_start = now() where key = p_key;
    return true;
  end if;

  if current_count >= p_max then
    return false;
  end if;

  update public.rate_limits set count = count + 1 where key = p_key;
  return true;
end;
$$;
