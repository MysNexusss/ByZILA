/**
 * transaction.service.js
 * ============================================================================
 * Regras de negócio relacionadas a transações financeiras.
 *
 * Nesta fase, apenas os cálculos necessários para o Dashboard (saldo e
 * resumo mensal, últimas transações). Criação/edição/remoção ficam para
 * uma fase futura.
 * ============================================================================
 */

import * as transactionRepository from '../repositories/transaction.repository.js';

/**
 * Retorna o resumo financeiro do usuário: saldo atual (todas as
 * transações) e receitas/despesas/economia do mês de referência.
 * @param {Date} [referenceDate] - padrão: data atual
 * @returns {Promise<{ balance: number, monthIncome: number, monthExpenses: number, monthSavings: number }>}
 */
export async function getSummary(referenceDate = new Date()) {
  const transactions = await transactionRepository.findAllForSummary();

  const balance = transactions.reduce((total, t) => total + signedAmount(t), 0);

  const { start, end } = getMonthRange(referenceDate);
  const monthly = transactions.filter((t) => t.date >= start && t.date <= end);

  const monthIncome = sumByType(monthly, 'income');
  const monthExpenses = sumByType(monthly, 'expense');

  return {
    balance,
    monthIncome,
    monthExpenses,
    monthSavings: monthIncome - monthExpenses,
  };
}

/**
 * Retorna as transações mais recentes do usuário.
 * @param {number} [limit=5]
 */
export async function getRecent(limit = 5) {
  return transactionRepository.findRecent(limit);
}

/** Valores "numeric" do Supabase chegam como string — converte com sinal. */
function signedAmount(transaction) {
  const amount = Number(transaction.amount) || 0;
  return transaction.type === 'income' ? amount : -amount;
}

function sumByType(transactions, type) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((total, t) => total + (Number(t.amount) || 0), 0);
}

function getMonthRange(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}
