-- BookNest — Migração 0012: View de totais para o dashboard
-- Agregação feita no Postgres em vez de somar no JS a cada carregamento
-- do /admin — mesmo padrão de v_daily_revenue / v_monthly_revenue.

create or replace view public.v_dashboard_totals
with (security_invoker = true) as
select
  coalesce(sum(value), 0) as total_revenue,
  count(*) as total_sales
from public.purchases;
