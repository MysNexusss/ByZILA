-- ============================================================================
-- BYZIFA — SCHEMA DO BANCO DE DADOS (Supabase / PostgreSQL)
-- ============================================================================
-- Execute este arquivo uma única vez no SQL Editor do Supabase, ANTES de
-- sql/policies.sql.
--
-- Convenções adotadas:
--  - Toda tabela usa "id uuid" como chave primária (gen_random_uuid()).
--  - Toda tabela de domínio do usuário tem "user_id uuid" referenciando
--    auth.users(id) — é essa coluna que as policies de RLS (policies.sql)
--    usam para isolar os dados de cada usuário.
--  - Toda tabela tem "created_at" e "updated_at" (timestamptz), com
--    "updated_at" mantido automaticamente por trigger.
--  - Valores monetários usam numeric(14,2) — nunca float, para evitar
--    erros de arredondamento em dinheiro.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSÕES
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TIPOS
-- ----------------------------------------------------------------------------
-- Compartilhado entre categories.type e transactions.type, garantindo que
-- os dois só aceitem os mesmos dois valores.
create type public.transaction_type as enum ('income', 'expense');

-- ----------------------------------------------------------------------------
-- 2. PROFILES
-- ----------------------------------------------------------------------------
-- Estende auth.users (tabela interna do Supabase Auth, que não deve ser
-- alterada diretamente) com dados públicos do usuário. Um registro é criado
-- automaticamente para cada novo usuário pelo trigger on_auth_user_created
-- definido na seção 8.
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  phone       text,
  currency    text not null default 'BRL',
  language    text not null default 'pt-BR',
  theme       text not null default 'system',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint profiles_theme_valid check (theme in ('light', 'dark', 'system'))
);

comment on table public.profiles is 'Dados públicos do usuário, espelhando auth.users.';

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES
-- ----------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  type        public.transaction_type not null,
  color       text not null default '#C7A667',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint categories_name_not_empty check (char_length(trim(name)) > 0),
  constraint categories_unique_name_per_type unique (user_id, name, type)
);

comment on table public.categories is 'Categorias de transações, definidas por usuário.';

-- ----------------------------------------------------------------------------
-- 4. TRANSACTIONS
-- ----------------------------------------------------------------------------
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type        public.transaction_type not null,
  amount      numeric(14,2) not null,
  description text,
  date        date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint transactions_amount_positive check (amount > 0)
);

comment on table public.transactions is 'Lançamentos financeiros (receitas e despesas) do usuário.';

-- ----------------------------------------------------------------------------
-- 5. GOALS
-- ----------------------------------------------------------------------------
create table public.goals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  target_amount   numeric(14,2) not null,
  current_amount  numeric(14,2) not null default 0,
  deadline        date,
  category        text,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint goals_title_not_empty check (char_length(trim(title)) > 0),
  constraint goals_target_amount_positive check (target_amount > 0),
  constraint goals_current_amount_non_negative check (current_amount >= 0)
);

comment on table public.goals is 'Metas financeiras definidas pelo usuário.';

-- ----------------------------------------------------------------------------
-- 6. DEBTS
-- ----------------------------------------------------------------------------
create table public.debts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  type                text,
  creditor            text,
  total_amount        numeric(14,2) not null,
  paid_amount         numeric(14,2) not null default 0,
  installments_total  integer,
  installments_paid   integer,
  interest_rate       numeric(6,3) not null default 0,
  due_date            date,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint debts_title_not_empty check (char_length(trim(title)) > 0),
  constraint debts_total_amount_positive check (total_amount > 0),
  constraint debts_paid_amount_non_negative check (paid_amount >= 0),
  constraint debts_installments_total_positive check (installments_total is null or installments_total > 0),
  constraint debts_installments_paid_range check (
    installments_paid is null or installments_total is null
    or (installments_paid >= 0 and installments_paid <= installments_total)
  ),
  constraint debts_interest_rate_non_negative check (interest_rate >= 0)
);

comment on table public.debts is 'Dívidas e parcelamentos do usuário. interest_rate em %% (ex.: 2.5 = 2,5%% ao mês).';

-- ----------------------------------------------------------------------------
-- 7. ÍNDICES
-- ----------------------------------------------------------------------------
-- user_id em todas as tabelas: acelera tanto as consultas normais quanto
-- as policies de RLS (que filtram por user_id em toda leitura).
create index idx_categories_user_id   on public.categories(user_id);
create index idx_categories_user_type on public.categories(user_id, type);

create index idx_transactions_user_id     on public.transactions(user_id);
create index idx_transactions_category_id on public.transactions(category_id);
create index idx_transactions_user_date   on public.transactions(user_id, date desc);

create index idx_goals_user_id  on public.goals(user_id);
create index idx_goals_deadline on public.goals(deadline);

create index idx_debts_user_id  on public.debts(user_id);
create index idx_debts_due_date on public.debts(due_date);

-- ----------------------------------------------------------------------------
-- 8. FUNÇÕES E TRIGGERS
-- ----------------------------------------------------------------------------

-- 8.1 Mantém "updated_at" sempre atualizado em qualquer UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger trg_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create trigger trg_goals_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

create trigger trg_debts_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

-- 8.2 Cria automaticamente um profile ao nascer um novo usuário no
-- Supabase Auth. "security definer" é necessário porque o trigger roda
-- no contexto de auth.users, fora do alcance normal do usuário comum.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
