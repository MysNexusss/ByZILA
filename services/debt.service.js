/**
 * debt.service.js
 * ============================================================================
 * Regras de negócio relacionadas a dívidas e parcelamentos.
 *
 * Nesta fase, apenas a seleção das dívidas em aberto para o Dashboard.
 * CRUD completo fica para uma fase futura.
 * ============================================================================
 */

import * as debtRepository from '../repositories/debt.repository.js';

/**
 * Retorna as dívidas ainda não quitadas (installments_paid <
 * installments_total), limitadas a "limit" itens, com o número de
 * parcelas restantes já calculado.
 * @param {number} [limit=3]
 */
export async function getOpen(limit = 3) {
  const debts = await debtRepository.findAll();

  return debts
    .filter((d) => d.installments_paid < d.installments_total)
    .slice(0, limit)
    .map((d) => ({
      ...d,
      total_amount: Number(d.total_amount) || 0,
      remainingInstallments: d.installments_total - d.installments_paid,
    }));
}
