-- BookNest — Migração 0011: Nome de exibição do autor
--
-- author_id continua existindo como "responsável/publicador" na
-- plataforma (quem tem permissão de editar/excluir), mas nem todo
-- autor real tem conta na BookNest — o fluxo real é o admin publicando
-- em nome de terceiros. author_name cobre a exibição pública; quando
-- nulo, a loja usa o nome de author_id como fallback.

alter table public.ebooks add column author_name text;
comment on column public.ebooks.author_name is
  'Nome de exibicao do autor. Se nulo, a loja usa o nome do usuario em author_id como fallback.';
