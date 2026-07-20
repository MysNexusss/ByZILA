/**
 * report.service.js
 * ============================================================================
 * Agregação de dados para a tela de Estatísticas. Busca uma única vez as
 * transações que combinam com os filtros (categoria/tipo) e deriva, no
 * cliente, tudo o que os gráficos e indicadores precisam — evitando
 * múltiplas consultas ao Supabase.
 * ============================================================================
 */

import * as transactionRepository from '../repositories/transaction.repository.js';

/**
 * Monta o relatório completo: indicadores, série mensal de receitas x
 * despesas, evolução do saldo, e totais por categoria (despesas e
 * receitas), respeitando os filtros informados.
 *
 * @param {Object} [filters]
 * @param {string} [filters.period] - "3m" | "6m" | "12m" | "year" | "all" (padrão "3m")
 * @param {string} [filters.categoryId]
 * @param {string} [filters.type] - "income" | "expense"
 */
export async function getReport(filters = {}) {
  const { start, end } = resolvePeriod(filters.period);

  // Busca tudo que combina com categoria/tipo, sem limite de data — o
  // recorte por período é feito no cliente, o que permite calcular o
  // saldo de abertura (tudo antes de "start") sem uma segunda consulta.
  const transactions = await transactionRepository.findAll({
    categoryId: filters.categoryId || undefined,
    type: filters.type || undefined,
  });

  const openingBalance = start
    ? sumAmounts(transactions.filter((t) => t.date < start))
    : 0;

  const periodTransactions = transactions.filter(
    (t) => (!start || t.date >= start) && t.date <= end
  );

  const months = start
    ? getMonthsInRange(new Date(`${start}T00:00:00`), new Date(`${end}T00:00:00`))
    : inferMonthsFromData(periodTransactions, end);

  return {
    indicators: buildIndicators(periodTransactions, months.length),
    monthly: buildMonthlySeries(periodTransactions, months),
    balanceEvolution: buildBalanceEvolution(periodTransactions, months, openingBalance),
    expensesByCategory: buildCategoryTotals(periodTransactions, 'expense'),
    incomeByCategory: buildCategoryTotals(periodTransactions, 'income'),
  };
}

/* --------------------------------------------------------------------
   Período
   -------------------------------------------------------------------- */

function resolvePeriod(period = '3m') {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  let start;

  switch (period) {
    case '6m':
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case '12m':
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
      start = null;
      break;
    case '3m':
    default:
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  }

  return { start: start ? toISODate(start) : null, end: toISODate(end) };
}

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

/** Gera todos os meses "aaaa-mm" entre duas datas, inclusive. */
function getMonthsInRange(startDate, endDate) {
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const limit = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= limit) {
    months.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/** Usado quando period === "all": os meses vêm da própria data, não de um intervalo fixo. */
function inferMonthsFromData(transactions, endDateStr) {
  if (transactions.length === 0) return [endDateStr.slice(0, 7)];
  const earliest = [...transactions].sort((a, b) => a.date.localeCompare(b.date))[0].date;
  return getMonthsInRange(new Date(`${earliest}T00:00:00`), new Date(`${endDateStr}T00:00:00`));
}

/* --------------------------------------------------------------------
   Agregações
   -------------------------------------------------------------------- */

function buildIndicators(transactions, monthCount) {
  const totalIncome = sumByType(transactions, 'income');
  const totalExpenses = sumByType(transactions, 'expense');
  const balance = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    balance,
    savingsRate: totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : 0,
    monthlyAverage: monthCount > 0 ? balance / monthCount : 0,
  };
}

/** Receitas e despesas por mês, prontos para o Chart.js (arrays paralelos aos meses). */
function buildMonthlySeries(transactions, months) {
  return {
    labels: months.map(formatMonthLabel),
    income: months.map((m) => sumByType(transactions.filter((t) => t.date.startsWith(m)), 'income')),
    expenses: months.map((m) => sumByType(transactions.filter((t) => t.date.startsWith(m)), 'expense')),
  };
}

/** Saldo acumulado mês a mês, partindo do saldo de abertura do período. */
function buildBalanceEvolution(transactions, months, openingBalance) {
  let running = openingBalance;
  const values = months.map((m) => {
    running += sumAmounts(transactions.filter((t) => t.date.startsWith(m)));
    return running;
  });

  return { labels: months.map(formatMonthLabel), values };
}

/** Total de um tipo (receita/despesa), agrupado por categoria. */
function buildCategoryTotals(transactions, type) {
  const byCategory = new Map();

  transactions
    .filter((t) => t.type === type)
    .forEach((t) => {
      const key = t.category?.name ?? 'Sem categoria';
      const color = t.category?.color ?? '#9B9BA1';
      const current = byCategory.get(key) ?? { total: 0, color };
      current.total += Number(t.amount) || 0;
      byCategory.set(key, current);
    });

  const entries = [...byCategory.entries()].sort((a, b) => b[1].total - a[1].total);

  return {
    labels: entries.map(([name]) => name),
    values: entries.map(([, data]) => data.total),
    colors: entries.map(([, data]) => data.color),
  };
}

/* --------------------------------------------------------------------
   Helpers numéricos
   -------------------------------------------------------------------- */

function sumAmounts(transactions) {
  return transactions.reduce((total, t) => total + signedAmount(t), 0);
}

function signedAmount(t) {
  const amount = Number(t.amount) || 0;
  return t.type === 'income' ? amount : -amount;
}

function sumByType(transactions, type) {
  return transactions
    .filter((t) => t.type === type)
    .reduce((total, t) => total + (Number(t.amount) || 0), 0);
}

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1)
    .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    .replace('.', '');
}
