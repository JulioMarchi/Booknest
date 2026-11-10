-- BookNest — Migração 0010: Categorias iniciais
-- Taxonomia de referência (não depende de usuários, diferente de
-- ebooks/purchases) — por isso é seguro semear direto na migration.

insert into public.categories (name, slug) values
  ('Ficção', 'ficcao'),
  ('Não Ficção', 'nao-ficcao'),
  ('Negócios e Carreira', 'negocios-e-carreira'),
  ('Tecnologia', 'tecnologia'),
  ('Autoajuda e Bem-estar', 'autoajuda-e-bem-estar'),
  ('Romance', 'romance'),
  ('Fantasia e Ficção Científica', 'fantasia-e-ficcao-cientifica'),
  ('Biografias', 'biografias'),
  ('Infantil e Juvenil', 'infantil-e-juvenil'),
  ('Educação', 'educacao')
on conflict (slug) do nothing;
