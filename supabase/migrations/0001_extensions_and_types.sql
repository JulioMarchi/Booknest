-- BookNest — Migração 0001: Extensões e tipos
-- Habilita extensões necessárias e cria os tipos enumerados usados
-- pelo restante do schema. Idempotente (pode rodar mais de uma vez).

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('customer', 'author', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'discount_type') then
    create type public.discount_type as enum ('percentage', 'fixed');
  end if;
end
$$;
