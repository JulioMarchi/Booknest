-- BookNest — Migração 0008: Hardening de segurança
-- Resolve os achados do Supabase Security Advisor rodado após 0001-0007.

-- 1) search_path fixo (mitiga search_path hijacking) --------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) unaccent para fora do schema public ---------------------------------
create schema if not exists extensions;
drop extension if exists unaccent;
create extension unaccent with schema extensions;

create or replace function public.slugify(p_text text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select trim(both '-' from regexp_replace(lower(extensions.unaccent(p_text)), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.ebooks_set_slug()
returns trigger
language plpgsql
set search_path = public
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

-- 3) bucket público não precisa de policy ampla de leitura/listagem ------
drop policy if exists "covers_public_read" on storage.objects;

-- 4) funções de trigger não devem ser RPC pública -------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.on_purchase_created() from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation() from public, anon, authenticated;
revoke execute on function public.refresh_ebook_rating() from public, anon, authenticated;

-- 5) check_rate_limit só deve ser chamada pelo servidor (service role) ----
-- o middleware passa a usar o client com a service role para esta chamada.
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- is_admin, has_purchased e validate_coupon permanecem executáveis por
-- anon/authenticated de propósito: as duas primeiras são avaliadas
-- dentro de policies de RLS no papel de quem faz a consulta (revogar
-- quebraria a checagem), e validate_coupon precisa ser chamável
-- publicamente pelo fluxo de checkout antes do login/pagamento.
