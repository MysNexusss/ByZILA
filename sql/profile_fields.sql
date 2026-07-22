-- ============================================================================
-- NEXORA FINANCIAL — MIGRAÇÃO: campos de perfil + Storage de avatares
-- ============================================================================
-- Execute UMA ÚNICA VEZ no SQL Editor do Supabase (projeto já existente).
-- Não apaga nem altera dados existentes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Novos campos em profiles
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone text,
  add column if not exists language text not null default 'pt-BR',
  add column if not exists theme text not null default 'system';

alter table public.profiles
  add constraint profiles_theme_valid check (theme in ('light', 'dark', 'system'));

comment on column public.profiles.phone is 'Telefone opcional do usuário.';
comment on column public.profiles.language is 'Idioma preferido da interface (ex.: pt-BR, en-US, es-ES).';
comment on column public.profiles.theme is 'Preferência de tema: light, dark ou system.';

-- ----------------------------------------------------------------------------
-- 2. Bucket de Storage para fotos de perfil
-- ----------------------------------------------------------------------------
-- Público para leitura (a foto precisa aparecer no <img> sem URL assinada);
-- escrita restrita ao próprio usuário via policies abaixo. Limite de 2MB e
-- apenas os formatos de imagem usados pelo formulário.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Não é preciso habilitar RLS aqui: o Supabase já habilita por padrão em
-- storage.objects, e o usuário do SQL Editor não é "dono" dessa tabela
-- (só a própria Supabase é) — tentar fazer isso dá erro 42501.

-- Cada usuário grava dentro de uma "pasta" com o próprio id
-- (ex.: 3f2e.../avatar) — storage.foldername(name) extrai esse prefixo.
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_update_own"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars_delete_own"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
