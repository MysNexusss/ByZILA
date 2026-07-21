/**
 * debt.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "debts" no Supabase.
 * Não contém regras de negócio (isso pertence a services/debt.service.js).
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Busca todas as dívidas do usuário autenticado, ordenadas pelo
 * vencimento mais próximo primeiro (dívidas sem vencimento ficam no
 * final). O status (aberta/atrasada/quitada) não existe no banco — é
 * calculado em services/debt.service.js.
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

/**
 * Cria uma nova dívida.
 * @param {object} data
 * @returns {Promise<object>} a dívida criada
 */
export async function insert(data) {
  return handleResponse(
    await supabase.from('debts').insert(data).select('*').single()
  );
}

/**
 * Atualiza uma dívida existente.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>} a dívida atualizada
 */
export async function update(id, data) {
  return handleResponse(
    await supabase.from('debts').update(data).eq('id', id).select('*').single()
  );
}

/**
 * Remove uma dívida.
 * @param {string} id
 */
export async function remove(id) {
  return handleResponse(
    await supabase.from('debts').delete().eq('id', id)
  );
}
