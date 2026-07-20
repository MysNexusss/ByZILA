/**
 * category.service.js
 * ============================================================================
 * Regras de negócio relacionadas a categorias de transações.
 *
 * Nesta fase, apenas a listagem usada para popular o formulário e os
 * filtros de transações. CRUD completo fica para uma fase futura.
 * ============================================================================
 */

import * as categoryRepository from '../repositories/category.repository.js';

/**
 * Retorna as categorias do usuário, opcionalmente filtradas por tipo.
 * @param {'income'|'expense'} [type]
 */
export async function list(type) {
  const categories = await categoryRepository.findAll();
  return type ? categories.filter((c) => c.type === type) : categories;
}
