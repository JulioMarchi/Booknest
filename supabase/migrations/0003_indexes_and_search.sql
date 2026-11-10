-- BookNest — Migração 0003: Índices e busca instantânea

create index idx_ebooks_category on public.ebooks (category_id);
create index idx_ebooks_author on public.ebooks (author_id);
create index idx_ebooks_featured on public.ebooks (featured) where featured = true;
create index idx_ebooks_published on public.ebooks (published) where published = true;
create index idx_ebooks_created_at on public.ebooks (created_at desc);
create index idx_ebooks_sales_count on public.ebooks (sales_count desc);

create index idx_purchases_user on public.purchases (user_id);
create index idx_purchases_ebook on public.purchases (ebook_id);
create index idx_purchases_coupon on public.purchases (coupon_id);

create index idx_downloads_user on public.downloads (user_id);
create index idx_downloads_ebook on public.downloads (ebook_id);

create index idx_reviews_ebook on public.reviews (ebook_id);
create index idx_favorites_user on public.favorites (user_id);

-- Busca instantânea: coluna gerada com pesos (título > descrição) e
-- índice GIN, evitando ILIKE em texto livre a cada tecla digitada.
alter table public.ebooks
add column search_vector tsvector generated always as (
  setweight(to_tsvector('portuguese', coalesce(title, '')), 'A')
  || setweight(to_tsvector('portuguese', coalesce(description, '')), 'B')
) stored;

create index idx_ebooks_search on public.ebooks using gin (search_vector);
