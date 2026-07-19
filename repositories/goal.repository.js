/**
 * goal.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "goals" no Supabase.
 * Não contém regras de negócio (isso pertence a services/goal.service.js).
 *
 * Nesta fase, apenas leitura.
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Busca todas as metas do usuário autenticado, ordenadas pelo prazo mais
 * próximo primeiro (metas sem prazo ficam no final).
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

// TODO (fase futura — gestão completa de metas):
// export async function insert(dados) { ... }
// export async function update(id, dados) { ... }
// export async function remove(id) { ... }
