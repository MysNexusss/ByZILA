/**
 * statistics.js
 * ============================================================================
 * Controlador da tela de Estatísticas. router.js chama init() logo
 * depois de injetar pages/statistics.html em #route-outlet.
 * ============================================================================
 */

import * as reportService from '../services/report.service.js';
import * as categoryService from '../services/category.service.js';
import { formatCurrency } from '../js/utils.js';
import { populateOptions } from '../components/select/select.js';
import { renderChart, cssVar } from '../components/chart-card/chart-card.js';
import { showToast } from '../components/toast/toast.js';

const EMPTY_STATE_HTML = `
  <div class="empty-state empty-state--compact">
    <h3 class="empty-state-title">Sem dados suficientes</h3>
    <p class="empty-state-desc">Adicione transações para ver este gráfico.</p>
  </div>
`;

/* --------------------------------------------------------------------
   Skeletons
   -------------------------------------------------------------------- */

function renderIndicatorSkeletons() {
  document.getElementById('statistics-indicators').innerHTML = Array.from({ length: 5 }, () => `
    <div class="card">
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
      <div class="skeleton skeleton-text" style="width: 40%; height: 24px; margin-top: var(--space-4);"></div>
    </div>
  `).join('');
}

function renderChartSkeletons() {
  document.querySelectorAll('.chart-card-canvas').forEach((el) => {
    el.innerHTML = '<div class="skeleton skeleton-card" style="height: 100%; width: 100%; margin: 0;"></div>';
  });
}

/* --------------------------------------------------------------------
   Indicadores
   -------------------------------------------------------------------- */

function renderIndicators(indicators) {
  document.getElementById('statistics-indicators').innerHTML = `
    <div class="card">
      <div class="card-subtitle">Total de receitas</div>
      <div class="amount amount--lg amount--positive">${formatCurrency(indicators.totalIncome)}</div>
    </div>
    <div class="card">
      <div class="card-subtitle">Total de despesas</div>
      <div class="amount amount--lg amount--negative">${formatCurrency(indicators.totalExpenses)}</div>
    </div>
    <div class="card">
      <div class="card-subtitle">Saldo</div>
      <div class="amount amount--lg ${indicators.balance >= 0 ? 'amount--positive' : 'amount--negative'}">${formatCurrency(indicators.balance)}</div>
    </div>
    <div class="card">
      <div class="card-subtitle">Economia</div>
      <div class="amount amount--lg ${indicators.savingsRate >= 0 ? 'amount--positive' : 'amount--negative'}">${indicators.savingsRate}%</div>
    </div>
    <div class="card">
      <div class="card-subtitle">Média mensal</div>
      <div class="amount amount--lg ${indicators.monthlyAverage >= 0 ? 'amount--positive' : 'amount--negative'}">${formatCurrency(indicators.monthlyAverage)}</div>
    </div>
  `;
}

/* --------------------------------------------------------------------
   Gráficos
   -------------------------------------------------------------------- */

/** Garante um <canvas> limpo dentro do card antes de desenhar/checar dados. */
function resetCanvas(cardId) {
  const wrapper = document.querySelector(`#${cardId} .chart-card-canvas`);
  wrapper.innerHTML = '<canvas></canvas>';
  return wrapper;
}

function renderMonthlyChart(monthly) {
  const wrapper = resetCanvas('chart-monthly');
  const hasData = monthly.income.some((v) => v > 0) || monthly.expenses.some((v) => v > 0);
  if (!hasData) {
    wrapper.innerHTML = EMPTY_STATE_HTML;
    return;
  }

  renderChart(wrapper.querySelector('canvas'), {
    type: 'bar',
    data: {
      labels: monthly.labels,
      datasets: [
        { label: 'Receitas', data: monthly.income, backgroundColor: cssVar('--color-success'), borderRadius: 4 },
        { label: 'Despesas', data: monthly.expenses, backgroundColor: cssVar('--color-danger'), borderRadius: 4 },
      ],
    },
    options: {
      plugins: { legend: { position: 'bottom' } },
      scales: { y: { ticks: { callback: (value) => formatCurrency(value) } } },
    },
  });
}

function renderBalanceChart(balanceEvolution) {
  const wrapper = resetCanvas('chart-balance');
  if (balanceEvolution.values.every((v) => v === 0)) {
    wrapper.innerHTML = EMPTY_STATE_HTML;
    return;
  }

  renderChart(wrapper.querySelector('canvas'), {
    type: 'line',
    data: {
      labels: balanceEvolution.labels,
      datasets: [{
        label: 'Saldo',
        data: balanceEvolution.values,
        borderColor: cssVar('--color-gold'),
        backgroundColor: 'rgba(199, 166, 103, 0.15)',
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { callback: (value) => formatCurrency(value) } } },
    },
  });
}

function renderCategoryChart(cardId, categoryTotals) {
  const wrapper = resetCanvas(cardId);
  if (categoryTotals.labels.length === 0) {
    wrapper.innerHTML = EMPTY_STATE_HTML;
    return;
  }

  renderChart(wrapper.querySelector('canvas'), {
    type: 'doughnut',
    data: {
      labels: categoryTotals.labels,
      datasets: [{ data: categoryTotals.values, backgroundColor: categoryTotals.colors }],
    },
    options: {
      plugins: {
        legend: { position: 'bottom' },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}` } },
      },
    },
  });
}

/* --------------------------------------------------------------------
   Carregamento
   -------------------------------------------------------------------- */

function getFilters() {
  return {
    period: document.getElementById('stats-period').value,
    type: document.getElementById('stats-type').value || undefined,
    categoryId: document.getElementById('stats-category').value || undefined,
  };
}

function renderErrorState() {
  document.getElementById('statistics-indicators').innerHTML = `
    <div class="card" style="grid-column: 1 / -1;">
      <p class="empty-state-desc" style="margin: 0;">Não foi possível carregar os indicadores.</p>
    </div>
  `;
  document.querySelectorAll('.chart-card-canvas').forEach((el) => {
    el.innerHTML = '<p class="empty-state-desc">Não foi possível carregar este gráfico.</p>';
  });
}

async function loadReport() {
  renderIndicatorSkeletons();
  renderChartSkeletons();

  try {
    const report = await reportService.getReport(getFilters());

    renderIndicators(report.indicators);
    renderMonthlyChart(report.monthly);
    renderBalanceChart(report.balanceEvolution);
    renderCategoryChart('chart-expenses-category', report.expensesByCategory);
    renderCategoryChart('chart-income-category', report.incomeByCategory);
  } catch (error) {
    console.error('[statistics] Falha ao carregar relatório:', error);
    showToast('Não foi possível carregar as estatísticas.', 'danger');
    renderErrorState();
  }
}

async function loadCategories() {
  try {
    const categories = await categoryService.list();
    populateOptions(document.getElementById('stats-category'), categories, { placeholder: 'Todas' });
  } catch (error) {
    console.error('[statistics] Falha ao carregar categorias:', error);
    // Não bloqueia a tela — o filtro de categoria só fica vazio.
  }
}

function bindEvents() {
  ['stats-period', 'stats-type', 'stats-category'].forEach((id) => {
    document.getElementById(id).addEventListener('change', loadReport);
  });
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  bindEvents();
  loadCategories();
  loadReport();
}
