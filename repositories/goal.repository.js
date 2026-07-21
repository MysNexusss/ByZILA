/**
 * goal.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "goals" no Supabase.
 * Não contém regras de negócio (isso pertence a services/goal.service.js).
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Busca todas as metas do usuário autenticado, ordenadas pelo prazo mais
 * próximo primeiro (metas sem prazo ficam no final). O status
 * (ativa/concluída/vencida) não existe no banco — é calculado em
 * services/goal.service.js a partir de current_amount/target_amount/deadline.
 * @returns {Promise<Array<object>>}
 */
export async function findAll() {
  return handleResponse(
    await supabase
      .from('goals')
      .select('*')
      .order('deadline', { ascending: true, nullsFirst: false })
  );
}

/**
 * Cria uma nova meta.
 * @param {object} data
 * @returns {Promise<object>} a meta criada
 */
export async function insert(data) {
  return handleResponse(
    await supabase.from('goals').insert(data).select('*').single()
  );
}

/**
 * Atualiza uma meta existente.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>} a meta atualizada
 */
export async function update(id, data) {
  return handleResponse(
    await supabase.from('goals').update(data).eq('id', id).select('*').single()
  );
}

/**
 * Remove uma meta.
 * @param {string} id
 */
export async function remove(id) {
  return handleResponse(
    await supabase.from('goals').delete().eq('id', id)
  );
}
