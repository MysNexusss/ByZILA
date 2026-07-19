/**
 * goal.service.js
 * ============================================================================
 * Regras de negócio relacionadas a metas financeiras.
 *
 * Nesta fase, apenas a seleção das metas em andamento para o Dashboard.
 * CRUD completo fica para uma fase futura.
 * ============================================================================
 */

import * as goalRepository from '../repositories/goal.repository.js';

/**
 * Retorna as metas ainda não concluídas (current_amount < target_amount),
 * já com o percentual de progresso calculado, limitadas a "limit" itens.
 * @param {number} [limit=3]
 */
export async function getInProgress(limit = 3) {
  const goals = await goalRepository.findAll();

  return goals
    .map((g) => ({
      ...g,
      target_amount: Number(g.target_amount) || 0,
      current_amount: Number(g.current_amount) || 0,
    }))
    .filter((g) => g.current_amount < g.target_amount)
    .slice(0, limit)
    .map((g) => ({
      ...g,
      progress: g.target_amount > 0
        ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
        : 0,
    }));
}
