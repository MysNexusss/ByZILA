/**
 * dashboard.js
 * ============================================================================
 * Controlador da tela de Dashboard. router.js chama init() logo depois de
 * injetar pages/dashboard.html em #route-outlet.
 *
 * Cada seção (resumo, transações, metas, dívidas) carrega e falha de
 * forma independente — um problema em uma não derruba as outras.
 * ============================================================================
 */

import { getSummary, getRecent as getRecentTransactions } from '../services/transaction.service.js';
import { getInProgress as getGoalsInProgress } from '../services/goal.service.js';
import { getOpen as getOpenDebts } from '../services/debt.service.js';
import { formatCurrency, formatDate, escapeHtml } from '../js/utils.js';
import { getCurrentUser } from '../js/auth.js';

function renderGreeting() {
  const user = getCurrentUser();
  const name = user?.email?.split('@')[0];
  const titleEl = document.querySelector('.dashboard-title');
  if (titleEl && name) titleEl.textContent = `Olá, ${name}!`;
}

function renderSkeletons() {
  const summaryEl = document.getElementById('dashboard-summary');
  summaryEl.innerHTML = Array.from({ length: 4 }, () => `
    <div class="card">
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
      <div class="skeleton skeleton-text" style="width: 40%; height: 28px; margin-top: var(--space-4);"></div>
    </div>
  `).join('');

  const listSkeleton = `
    <div class="stack" style="--stack-gap: var(--space-3); padding-top: var(--space-2);">
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
    </div>
  `;
  document.getElementById('dashboard-transactions-body').innerHTML = listSkeleton;
  document.getElementById('dashboard-goals-body').innerHTML = listSkeleton;
  document.getElementById('dashboard-debts-body').innerHTML = listSkeleton;
}

async function loadSummary() {
  const container = document.getElementById('dashboard-summary');
  try {
    const summary = await getSummary();
    container.innerHTML = `
      <div class="card card--accent">
        <div class="card-subtitle">Saldo atual</div>
        <div class="amount amount--display ${summary.balance >= 0 ? 'amount--positive' : 'amount--negative'}">${formatCurrency(summary.balance)}</div>
      </div>
      <div class="card">
        <div class="card-subtitle">Receitas do mês</div>
        <div class="amount amount--lg amount--positive">${formatCurrency(summary.monthIncome)}</div>
      </div>
      <div class="card">
        <div class="card-subtitle">Despesas do mês</div>
        <div class="amount amount--lg amount--negative">${formatCurrency(summary.monthExpenses)}</div>
      </div>
      <div class="card">
        <div class="card-subtitle">Economia do mês</div>
        <div class="amount amount--lg ${summary.monthSavings >= 0 ? 'amount--positive' : 'amount--negative'}">${formatCurrency(summary.monthSavings)}</div>
      </div>
    `;
  } catch (error) {
    console.error('[dashboard] Falha ao carregar resumo:', error);
    container.innerHTML = `
      <div class="card" style="grid-column: 1 / -1;">
        <p class="empty-state-desc" style="margin: 0;">Não foi possível carregar o resumo financeiro.</p>
      </div>
    `;
  }
}

async function loadRecentTransactions() {
  const container = document.getElementById('dashboard-transactions-body');
  try {
    const transactions = await getRecentTransactions(5);

    if (transactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state empty-state--compact">
          <h3 class="empty-state-title">Nenhuma transação ainda</h3>
          <p class="empty-state-desc">Suas transações mais recentes vão aparecer aqui.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = transactions.map((t) => `
      <div class="dashboard-list-item">
        <div class="dashboard-list-item-main">
          <div class="dashboard-list-item-title">${escapeHtml(t.description || t.category?.name || 'Transação')}</div>
          <div class="dashboard-list-item-meta">${formatDate(t.date)}${t.category?.name ? ` · ${escapeHtml(t.category.name)}` : ''}</div>
        </div>
        <div class="amount amount--sm ${t.type === 'income' ? 'amount--positive' : 'amount--negative'}">
          ${t.type === 'income' ? '+' : '−'} ${formatCurrency(t.amount)}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('[dashboard] Falha ao carregar transações:', error);
    container.innerHTML = '<p class="empty-state-desc">Não foi possível carregar as transações.</p>';
  }
}

async function loadGoals() {
  const container = document.getElementById('dashboard-goals-body');
  try {
    const goals = await getGoalsInProgress(3);

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="empty-state empty-state--compact">
          <h3 class="empty-state-title">Nenhuma meta em andamento</h3>
          <p class="empty-state-desc">Metas criadas vão aparecer aqui.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = goals.map((g) => `
      <div class="dashboard-list-item dashboard-list-item--stacked">
        <div class="dashboard-list-item-main">
          <div class="dashboard-list-item-title">${escapeHtml(g.title)}</div>
          <div class="dashboard-list-item-meta">${formatCurrency(g.current_amount)} de ${formatCurrency(g.target_amount)}</div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width: ${g.progress}%;"></div></div>
        </div>
        <span class="badge badge--gold">${g.progress}%</span>
      </div>
    `).join('');
  } catch (error) {
    console.error('[dashboard] Falha ao carregar metas:', error);
    container.innerHTML = '<p class="empty-state-desc">Não foi possível carregar as metas.</p>';
  }
}

async function loadDebts() {
  const container = document.getElementById('dashboard-debts-body');
  try {
    const debts = await getOpenDebts(3);

    if (debts.length === 0) {
      container.innerHTML = `
        <div class="empty-state empty-state--compact">
          <h3 class="empty-state-title">Nenhuma dívida em aberto</h3>
          <p class="empty-state-desc">Dívidas cadastradas vão aparecer aqui.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = debts.map((d) => `
      <div class="dashboard-list-item">
        <div class="dashboard-list-item-main">
          <div class="dashboard-list-item-title">${escapeHtml(d.title)}</div>
          <div class="dashboard-list-item-meta">${d.remainingInstallments} de ${d.installments_total} parcelas restantes</div>
        </div>
        <div class="amount amount--sm">${formatCurrency(d.total_amount)}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('[dashboard] Falha ao carregar dívidas:', error);
    container.innerHTML = '<p class="empty-state-desc">Não foi possível carregar as dívidas.</p>';
  }
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  renderGreeting();
  renderSkeletons();

  // Disparadas em paralelo, sem aguardar umas às outras — cada seção
  // aparece assim que sua própria consulta terminar.
  loadSummary();
  loadRecentTransactions();
  loadGoals();
  loadDebts();
}
