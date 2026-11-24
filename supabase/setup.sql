-- =====================================================================
-- Setup do Supabase para o app "Meus Treinos"
-- Cole tudo no Supabase → SQL Editor → New query → Run.
-- Pode rodar mais de uma vez sem problema.
-- =====================================================================

-- 1) Tabela com todos os treinos (um único documento JSON)
create table if not exists public.app_data (
  id         int primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

-- Qualquer pessoa com o link do app pode LER os treinos
drop policy if exists "leitura publica" on public.app_data;
create policy "leitura publica" on public.app_data
  for select using (true);

-- Só usuários logados (o admin) podem criar/alterar
drop policy if exists "admin insere" on public.app_data;
create policy "admin insere" on public.app_data
  for insert to authenticated with check (true);

drop policy if exists "admin altera" on public.app_data;
create policy "admin altera" on public.app_data
  for update to authenticated using (true) with check (true);

-- 2) Bucket público para os vídeos e capas
insert into storage.buckets (id, name, public, file_size_limit)
values ('videos', 'videos', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = 52428800;

-- Leitura pública dos arquivos
drop policy if exists "videos leitura publica" on storage.objects;
create policy "videos leitura publica" on storage.objects
  for select using (bucket_id = 'videos');

-- Upload/alteração/remoção só para usuários logados
drop policy if exists "videos admin envia" on storage.objects;
create policy "videos admin envia" on storage.objects
  for insert to authenticated with check (bucket_id = 'videos');

drop policy if exists "videos admin altera" on storage.objects;
create policy "videos admin altera" on storage.objects
  for update to authenticated using (bucket_id = 'videos');

drop policy if exists "videos admin remove" on storage.objects;
create policy "videos admin remove" on storage.objects
  for delete to authenticated using (bucket_id = 'videos');

-- 3) IMPORTANTE: depois de criar o seu usuário admin em
--    Authentication → Users → Add user, desative novos cadastros em
--    Authentication → Sign In / Providers → "Allow new users to sign up" (desligado).
--    Assim ninguém além de você consegue criar conta e editar os treinos.
