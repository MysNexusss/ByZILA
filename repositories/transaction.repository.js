/**
 * transaction.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "transactions" no
 * Supabase. Não contém regras de negócio (isso pertence a
 * services/transaction.service.js).
 *
 * Nesta fase, apenas leitura: criação/edição/remoção ficam para uma fase
 * futura (ver TODOs no fim do arquivo).
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Busca campos mínimos (tipo, valor, data) de todas as transações do
 * usuário autenticado — usado para calcular saldo e resumo mensal. A RLS
 * (ver sql/policies.sql) garante que só retornam linhas do próprio
 * usuário; não é preciso filtrar por user_id aqui.
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
 * Busca as transações mais recentes, com detalhes completos (incluindo a
 * categoria relacionada), para exibição em listas.
 * @param {number} [limit=5]
 * @returns {Promise<Array<object>>}
 */
export async function findRecent(limit = 5) {
  return handleResponse(
    await supabase
      .from('transactions')
      .select('id, type, amount, description, date, category:categories(name, color)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
  );
}

// TODO (fase futura — cadastro de transações):
// export async function insert(dados) { ... }
// export async function update(id, dados) { ... }
// export async function remove(id) { ... }
