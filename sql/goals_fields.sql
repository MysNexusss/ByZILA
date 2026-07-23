-- ============================================================================
-- BYZIFA — MIGRAÇÃO: campos adicionais em "goals"
-- ============================================================================
-- Execute UMA ÚNICA VEZ no SQL Editor do Supabase (projeto já existente).
-- Adiciona "category" e "description" à tabela goals, usados pela tela de
-- Metas (Fase 9). Não apaga nem altera nenhum dado existente.
-- ============================================================================

alter table public.goals
  add column if not exists category text,
  add column if not exists description text;

comment on column public.goals.category is 'Categoria livre da meta (ex.: Viagem, Emergência) — não é uma FK.';
comment on column public.goals.description is 'Descrição opcional da meta.';
