-- BookNest — Migração 0007: Views de relatório (dashboard admin)
-- security_invoker garante que a RLS de purchases seja respeitada por
-- quem consulta a view (um admin vê tudo; um usuário comum só veria
-- suas próprias compras, já que a policy purchases_select_own_or_admin
-- continua valendo por baixo da agregação).

create or replace view public.v_daily_revenue
with (security_invoker = true) as
select
  date_trunc('day', created_at)::date as day,
  count(*) as total_sales,
  sum(value) as total_revenue
from public.purchases
group by 1
order by 1 desc;

create or replace view public.v_monthly_revenue
with (security_invoker = true) as
select
  date_trunc('month', created_at)::date as month,
  count(*) as total_sales,
  sum(value) as total_revenue
from public.purchases
group by 1
order by 1 desc;
