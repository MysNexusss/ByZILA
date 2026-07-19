/**
 * debt.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "debts" no Supabase.
 * Não contém regras de negócio (isso pertence a services/debt.service.js).
 *
 * Nesta fase, apenas leitura.
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Busca todas as dívidas do usuário autenticado, ordenadas pelo
 * vencimento mais próximo primeiro (dívidas sem vencimento ficam no
 * final).
 * @returns {Promise<Array<object>>}
 */
export async function findAll() {
  return handleResponse(
    await supabase
      .from('debts')
      .select('*')
      .order('due_date', { ascending: true, nullsFirst: false })
  );
}

// TODO (fase futura — gestão completa de dívidas):
// export async function insert(dados) { ... }
// export async function update(id, dados) { ... }
// export async function remove(id) { ... }
