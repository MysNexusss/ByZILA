/**
 * transaction.service.js
 * ============================================================================
 * Regras de negócio relacionadas a transações financeiras: cálculos para
 * o Dashboard, listagem com filtros e validação antes de criar/atualizar.
 * ============================================================================
 */

import * as transactionRepository from '../repositories/transaction.repository.js';
import { TRANSACTION_TYPES } from '../models/transaction.model.js';

/**
 * Retorna o resumo financeiro do usuário: saldo atual (todas as
 * transações) e receitas/despesas/economia do mês de referência.
 * @param {Date} [referenceDate] - padrão: data atual
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
 * Retorna as transações mais recentes do usuário (Dashboard).
 * @param {number} [limit=5]
 */
export async function getRecent(limit = 5) {
  return transactionRepository.findRecent(limit);
}

/**
 * Lista as transações do usuário, com filtros opcionais (tela de
 * Transações). "month" no formato "aaaa-mm" é resolvido para um
 * intervalo de datas antes de chegar ao repository.
 * @param {Object} [filters]
 * @param {string} [filters.month] - "aaaa-mm"
 * @param {string} [filters.categoryId]
 * @param {string} [filters.type]
 * @param {string} [filters.search]
 */
export async function list(filters = {}) {
  const range = filters.month ? getMonthRange(parseMonthString(filters.month)) : null;

  return transactionRepository.findAll({
    startDate: range?.start,
    endDate: range?.end,
    categoryId: filters.categoryId || undefined,
    type: filters.type || undefined,
    search: filters.search?.trim() || undefined,
  });
}

/**
 * Cria uma nova transação. "data" deve incluir user_id (anexado pela
 * página, que tem acesso ao usuário autenticado — este service não
 * depende de js/auth.js).
 * @param {object} data
 */
export async function create(data) {
  validate(data);

  return transactionRepository.insert({
    user_id: data.user_id,
    type: data.type,
    amount: Number(data.amount),
    description: data.description?.trim() || null,
    date: data.date,
    category_id: data.category_id || null,
  });
}

/**
 * Atualiza uma transação existente.
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  validate(data);

  return transactionRepository.update(id, {
    type: data.type,
    amount: Number(data.amount),
    description: data.description?.trim() || null,
    date: data.date,
    category_id: data.category_id || null,
  });
}

/**
 * Remove uma transação.
 * @param {string} id
 */
export async function remove(id) {
  return transactionRepository.remove(id);
}

/** Última linha de defesa antes de enviar dados ao Supabase. */
function validate(data) {
  if (!Object.values(TRANSACTION_TYPES).includes(data.type)) {
    throw new Error('Tipo de transação inválido.');
  }
  if (!(Number(data.amount) > 0)) {
    throw new Error('O valor deve ser maior que zero.');
  }
  if (!data.date) {
    throw new Error('Informe a data da transação.');
  }
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

function parseMonthString(month) {
  const [year, m] = month.split('-').map(Number);
  return new Date(year, m - 1, 1);
}
