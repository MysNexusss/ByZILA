/**
 * transaction.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "transactions" no
 * Supabase. Não contém regras de negócio (isso pertence a
 * services/transaction.service.js).
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

const LIST_COLUMNS = 'id, type, amount, description, date, category_id, category:categories(id, name, color)';

/**
 * Busca campos mínimos (tipo, valor, data) de todas as transações do
 * usuário autenticado — usado para calcular saldo e resumo mensal no
 * Dashboard. A RLS garante que só retornam linhas do próprio usuário.
 * @returns {Promise<Array<{ type: string, amount: string, date: string }>>}
 */
export async function findAllForSummary() {
  return handleResponse(
    await supabase
      .from('transactions')
      .select('type, amount, date')
  );
}

/**
 * Busca as transações mais recentes, com detalhes completos — usado pelo
 * Dashboard.
 * @param {number} [limit=5]
 */
export async function findRecent(limit = 5) {
  return handleResponse(
    await supabase
      .from('transactions')
      .select(LIST_COLUMNS)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
  );
}

/**
 * Busca transações com filtros opcionais, ordenadas por data (mais
 * recentes primeiro) — usado pela tela de Transações.
 * @param {Object} [filters]
 * @param {string} [filters.startDate] - "aaaa-mm-dd", inclusive
 * @param {string} [filters.endDate]   - "aaaa-mm-dd", inclusive
 * @param {string} [filters.categoryId]
 * @param {string} [filters.type]      - "income" | "expense"
 * @param {string} [filters.search]    - busca em description (case-insensitive)
 * @returns {Promise<Array<object>>}
 */
export async function findAll(filters = {}) {
  let query = supabase
    .from('transactions')
    .select(LIST_COLUMNS)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters.startDate) query = query.gte('date', filters.startDate);
  if (filters.endDate) query = query.lte('date', filters.endDate);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.search) query = query.ilike('description', `%${filters.search}%`);

  return handleResponse(await query);
}

/**
 * Cria uma nova transação.
 * @param {object} data - deve incluir user_id, type, amount, date (category_id e description são opcionais)
 * @returns {Promise<object>} a transação criada
 */
export async function insert(data) {
  return handleResponse(
    await supabase
      .from('transactions')
      .insert(data)
      .select(LIST_COLUMNS)
      .single()
  );
}

/**
 * Atualiza uma transação existente.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>} a transação atualizada
 */
export async function update(id, data) {
  return handleResponse(
    await supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .select(LIST_COLUMNS)
      .single()
  );
}

/**
 * Remove uma transação.
 * @param {string} id
 */
export async function remove(id) {
  return handleResponse(
    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
  );
}
