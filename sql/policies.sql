-- ============================================================================
-- NEXORA FINANCIAL — ROW LEVEL SECURITY (RLS) E POLICIES
-- ============================================================================
-- Execute este arquivo DEPOIS de sql/schema.sql. Ele garante que, mesmo
-- usando a chave pública "anon" no client (ver js/config.js), cada usuário
-- só consegue ler e escrever os próprios dados — a proteção acontece no
-- banco, não no código JavaScript.
--
-- Padrão usado em todas as policies: auth.uid() é o id do usuário
-- autenticado na requisição atual (extraído do JWT enviado pelo Supabase
-- Auth). Comparamos sempre contra a coluna user_id (ou id, em profiles).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HABILITA RLS EM TODAS AS TABELAS
-- ----------------------------------------------------------------------------
-- Sem isso, as policies abaixo não têm efeito nenhum: por padrão, com RLS
-- desligada, qualquer requisição com a anon key acessa a tabela inteira,
-- o que seria uma falha grave de segurança.
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.goals        enable row level security;
alter table public.debts        enable row level security;

-- ----------------------------------------------------------------------------
-- 2. PROFILES
-- ----------------------------------------------------------------------------
-- Sem policy de DELETE: o registro é removido automaticamente via
-- "on delete cascade" quando a conta em auth.users é excluída.
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 3. CATEGORIES
-- ----------------------------------------------------------------------------
create policy "categories_select_own"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "categories_insert_own"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "categories_update_own"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "categories_delete_own"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 4. TRANSACTIONS
-- ----------------------------------------------------------------------------
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 5. GOALS
-- ----------------------------------------------------------------------------
create policy "goals_select_own"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "goals_insert_own"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "goals_update_own"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "goals_delete_own"
  on public.goals for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. DEBTS
-- ----------------------------------------------------------------------------
create policy "debts_select_own"
  on public.debts for select
  using (auth.uid() = user_id);

create policy "debts_insert_own"
  on public.debts for insert
  with check (auth.uid() = user_id);

create policy "debts_update_own"
  on public.debts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "debts_delete_own"
  on public.debts for delete
  using (auth.uid() = user_id);
