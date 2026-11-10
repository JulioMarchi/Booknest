-- BookNest — Migração 0006: Storage (buckets e policies)

-- COVERS — bucket PÚBLICO (capa é material de vitrine, como numa loja).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- EBOOKS — bucket PRIVADO. Os PDFs nunca ficam acessíveis por URL
-- pública: todo download passa por uma Signed URL de curta duração,
-- gerada no servidor (service role) somente após confirmar a compra.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 209715200, array['application/pdf'])
on conflict (id) do nothing;

-- Policies — COVERS: leitura pública (o bucket público já permite via
-- URL direta, mas a policy de SELECT documenta a intenção e cobre
-- leituras autenticadas). Escrita restrita a admin.
create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'covers');

create policy "covers_admin_insert" on storage.objects
  for insert with check (bucket_id = 'covers' and public.is_admin(auth.uid()));

create policy "covers_admin_update" on storage.objects
  for update using (bucket_id = 'covers' and public.is_admin(auth.uid()));

create policy "covers_admin_delete" on storage.objects
  for delete using (bucket_id = 'covers' and public.is_admin(auth.uid()));

-- Policies — EBOOKS: nenhuma policy de SELECT (leitura só via Signed
-- URL, criada com a service role, que ignora RLS). Escrita admin-only.
create policy "ebooks_bucket_admin_insert" on storage.objects
  for insert with check (bucket_id = 'ebooks' and public.is_admin(auth.uid()));

create policy "ebooks_bucket_admin_update" on storage.objects
  for update using (bucket_id = 'ebooks' and public.is_admin(auth.uid()));

create policy "ebooks_bucket_admin_delete" on storage.objects
  for delete using (bucket_id = 'ebooks' and public.is_admin(auth.uid()));
