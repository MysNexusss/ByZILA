/**
 * debt.service.js
 * ============================================================================
 * Regras de negócio relacionadas a dívidas: cálculo de status (em
 * aberto/em atraso/quitada), progresso, valor restante e "vence em
 * breve"; resumo geral; listagem com filtro/ordenação/busca; validação
 * antes de criar/atualizar.
 * ============================================================================
 */

import * as debtRepository from '../repositories/debt.repository.js';
import { DEBT_STATUS } from '../models/debt.model.js';

const DUE_SOON_DAYS = 7;

/**
 * Lista as dívidas do usuário, já decoradas com status/progresso/dias até
 * o vencimento, com filtro de status, tipo, busca por nome/credor e
 * ordenação opcionais.
 * @param {Object} [filters]
 * @param {string} [filters.status] - "open" | "overdue" | "paid"
 * @param {string} [filters.type]
 * @param {string} [filters.search]
 * @param {string} [filters.sortBy] - "due_date" | "amount" | "status" (padrão "due_date")
 */
export async function list(filters = {}) {
  const debts = (await debtRepository.findAll()).map(decorate);

  let filtered = debts;
  if (filters.status) {
    filtered = filtered.filter((d) => d.status === filters.status);
  }
  if (filters.type) {
    filtered = filtered.filter((d) => d.type === filters.type);
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (d) => d.title.toLowerCase().includes(term) || (d.creditor ?? '').toLowerCase().includes(term)
    );
  }

  return sortDebts(filtered, filters.sortBy);
}

/**
 * Retorna as dívidas ainda não quitadas (abertas + atrasadas), usado
 * pelo Dashboard — limitadas a "limit" itens, ordenadas pelo vencimento
 * mais próximo (o que naturalmente traz as atrasadas primeiro).
 * @param {number} [limit=3]
 */
export async function getOpen(limit = 3) {
  const debts = await list({ sortBy: 'due_date' });
  return debts.filter((d) => d.status !== DEBT_STATUS.PAID).slice(0, limit);
}

/**
 * Resumo geral para o topo da tela de Dívidas: total devido, total
 * pago, quantidade de dívidas e a mais próxima do vencimento (entre as
 * ainda não quitadas).
 */
export async function getSummary() {
  const debts = (await debtRepository.findAll()).map(decorate);

  const totalOwed = debts.reduce((sum, d) => sum + d.remaining, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.paid_amount, 0);

  const upcoming = debts
    .filter((d) => d.status !== DEBT_STATUS.PAID && d.due_date)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  return {
    totalOwed,
    totalPaid,
    count: debts.length,
    nextDueDate: upcoming?.due_date ?? null,
    nextDueTitle: upcoming?.title ?? null,
  };
}

/**
 * Cria uma nova dívida para o usuário autenticado. "data" deve incluir
 * user_id (anexado pela página).
 * @param {object} data
 */
export async function create(data) {
  validate(data);

  return debtRepository.insert({
    user_id: data.user_id,
    title: data.title.trim(),
    type: data.type || null,
    creditor: data.creditor?.trim() || null,
    total_amount: Number(data.total_amount),
    paid_amount: Number(data.paid_amount) || 0,
    interest_rate: Number(data.interest_rate) || 0,
    due_date: data.due_date || null,
    installments_total: data.installments_total ? Number(data.installments_total) : null,
    installments_paid: data.installments_paid ? Number(data.installments_paid) : null,
    notes: data.notes?.trim() || null,
  });
}

/**
 * Atualiza uma dívida existente.
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  validate(data);

  return debtRepository.update(id, {
    title: data.title.trim(),
    type: data.type || null,
    creditor: data.creditor?.trim() || null,
    total_amount: Number(data.total_amount),
    paid_amount: Number(data.paid_amount) || 0,
    interest_rate: Number(data.interest_rate) || 0,
    due_date: data.due_date || null,
    installments_total: data.installments_total ? Number(data.installments_total) : null,
    installments_paid: data.installments_paid ? Number(data.installments_paid) : null,
    notes: data.notes?.trim() || null,
  });
}

/**
 * Remove uma dívida.
 * @param {string} id
 */
export async function remove(id) {
  return debtRepository.remove(id);
}

/* --------------------------------------------------------------------
   Cálculos derivados (status, progresso, valor restante, vencimento)
   -------------------------------------------------------------------- */

function decorate(debt) {
  const total = Number(debt.total_amount) || 0;
  const paid = Number(debt.paid_amount) || 0;
  const status = computeStatus(debt, total, paid);
  const daysUntilDue = debt.due_date ? daysUntil(debt.due_date) : null;

  return {
    ...debt,
    total_amount: total,
    paid_amount: paid,
    interest_rate: Number(debt.interest_rate) || 0,
    remaining: Math.max(0, total - paid),
    progress: total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0,
    status,
    daysUntilDue,
    isDueSoon: status === DEBT_STATUS.OPEN && daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= DUE_SOON_DAYS,
  };
}

/** Calculado sempre na leitura — é isso que identifica atraso/quitação automaticamente. */
function computeStatus(debt, total, paid) {
  if (total > 0 && paid >= total) return DEBT_STATUS.PAID;
  if (debt.due_date && debt.due_date < todayISO()) return DEBT_STATUS.OVERDUE;
  return DEBT_STATUS.OPEN;
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${dateStr}T00:00:00`);
  return Math.round((target - today) / 86400000);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function sortDebts(debts, sortBy = 'due_date') {
  const sorted = [...debts];
  const statusOrder = { overdue: 0, open: 1, paid: 2 };

  switch (sortBy) {
    case 'amount':
      sorted.sort((a, b) => b.remaining - a.remaining);
      break;
    case 'status':
      sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
      break;
    case 'due_date':
    default:
      sorted.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
  }

  return sorted;
}

/** Última linha de defesa antes de enviar dados ao Supabase. */
function validate(data) {
  if (!data.title?.trim()) {
    throw new Error('Informe o nome da dívida.');
  }
  if (!(Number(data.total_amount) > 0)) {
    throw new Error('O valor total deve ser maior que zero.');
  }
  if (data.paid_amount !== undefined && Number(data.paid_amount) < 0) {
    throw new Error('O valor pago não pode ser negativo.');
  }
  if (data.interest_rate !== undefined && Number(data.interest_rate) < 0) {
    throw new Error('A taxa de juros não pode ser negativa.');
  }
}
