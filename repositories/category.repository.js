/**
 * category.repository.js
 * ============================================================================
 * Camada de acesso a dados — consultas cruas à tabela "categories" no
 * Supabase.
 *
 * Nesta fase, apenas leitura (usada para popular o campo "Categoria" do
 * formulário de transações). Criação/edição de categorias fica para uma
 * fase futura.
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Busca todas as categorias do usuário autenticado.
 * @returns {Promise<Array<{ id: string, name: string, type: string, color: string }>>}
 */
export async function findAll() {
  return handleResponse(
    await supabase
      .from('categories')
      .select('id, name, type, color')
      .order('name', { ascending: true })
  );
}

// TODO (fase futura — gestão completa de categorias):
// export async function insert(dados) { ... }
// export async function update(id, dados) { ... }
// export async function remove(id) { ... }
