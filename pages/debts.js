/**
 * debts.js
 * ============================================================================
 * Controlador da tela de Dívidas. router.js chama init() logo depois de
 * injetar pages/debts.html em #route-outlet.
 * ============================================================================
 */

import * as debtService from '../services/debt.service.js';
import { createEmptyDebt, DEBT_TYPES } from '../models/debt.model.js';
import { formatCurrency, formatDate, escapeHtml } from '../js/utils.js';
import { getCurrentUser } from '../js/auth.js';
import { showToast } from '../components/toast/toast.js';
import { setFieldError, clearFieldError } from '../components/input/input.js';
import { setButtonLoading } from '../components/button/button.js';
import { openModal, closeModal, bindModalDismiss } from '../components/modal/modal.js';
import { populateOptions } from '../components/select/select.js';

let currentDebts = [];
let pendingDeleteId = null;

const STATUS_LABEL = { open: 'Em aberto', overdue: 'Em atraso', paid: 'Quitada' };

/* --------------------------------------------------------------------
   Resumo do topo
   -------------------------------------------------------------------- */

function renderSummarySkeletons() {
  document.getElementById('debts-summary').innerHTML = Array.from({ length: 4 }, () => `
    <div class="card">
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
      <div class="skeleton skeleton-text" style="width: 40%; height: 24px; margin-top: var(--space-4);"></div>
    </div>
  `).join('');
}

function renderSummary(summary) {
  document.getElementById('debts-summary').innerHTML = `
    <div class="card">
      <div class="card-subtitle">Total devido</div>
      <div class="amount amount--lg amount--negative">${formatCurrency(summary.totalOwed)}</div>
    </div>
    <div class="card">
      <div class="card-subtitle">Total pago</div>
      <div class="amount amount--lg amount--positive">${formatCurrency(summary.totalPaid)}</div>
    </div>
    <div class="card">
      <div class="card-subtitle">Quantidade de dívidas</div>
      <div class="amount amount--lg">${summary.count}</div>
    </div>
    <div class="card">
      <div class="card-subtitle">Próximo vencimento</div>
      ${summary.nextDueDate
        ? `<div class="amount amount--lg">${formatDate(summary.nextDueDate)}</div><div class="goal-card-progress-label">${escapeHtml(summary.nextDueTitle)}</div>`
        : '<div class="amount amount--lg">—</div>'}
    </div>
  `;
}

async function loadSummary() {
  renderSummarySkeletons();
  try {
    const summary = await debtService.getSummary();
    renderSummary(summary);
  } catch (error) {
    console.error('[debts] Falha ao carregar resumo:', error);
    document.getElementById('debts-summary').innerHTML = `
      <div class="card" style="grid-column: 1 / -1;">
        <p class="empty-state-desc" style="margin: 0;">Não foi possível carregar o resumo.</p>
      </div>
    `;
  }
}

/* --------------------------------------------------------------------
   Lista
   -------------------------------------------------------------------- */

function renderSkeletons() {
  document.getElementById('debts-list').innerHTML = Array.from({ length: 6 }, () => `
    <div class="card">
      <div class="skeleton skeleton-text" style="width: 70%;"></div>
      <div class="skeleton skeleton-text" style="width: 40%; margin-top: var(--space-2);"></div>
      <div class="skeleton skeleton-card" style="height: 80px; margin-top: var(--space-4);"></div>
    </div>
  `).join('');
}

function renderEmptyState() {
  document.getElementById('debts-list').innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <h3 class="empty-state-title">Nenhuma dívida encontrada</h3>
      <p class="empty-state-desc">Ajuste os filtros ou cadastre sua primeira dívida.</p>
      <button class="btn btn--primary btn--sm" type="button" id="empty-state-add-debt">+ Nova dívida</button>
    </div>
  `;
  document.getElementById('empty-state-add-debt')?.addEventListener('click', () => openDebtModal());
}

function renderErrorState() {
  document.getElementById('debts-list').innerHTML = `
    <div class="card" style="grid-column: 1 / -1;">
      <p class="empty-state-desc" style="margin: 0;">Não foi possível carregar as dívidas.</p>
    </div>
  `;
}

function statusBadge(debt) {
  if (debt.status === 'paid') return { cls: 'badge--success', label: STATUS_LABEL.paid };
  if (debt.status === 'overdue') return { cls: 'badge--danger', label: STATUS_LABEL.overdue };
  if (debt.isDueSoon) return { cls: 'badge--info', label: 'Vence em breve' };
  return { cls: 'badge--gold', label: STATUS_LABEL.open };
}

function formatDueLabel(debt) {
  if (debt.status === 'paid') return 'Dívida quitada';
  if (debt.daysUntilDue === null) return 'Sem vencimento definido';
  if (debt.daysUntilDue > 0) return `Vence em ${debt.daysUntilDue} dia${debt.daysUntilDue === 1 ? '' : 's'}`;
  if (debt.daysUntilDue === 0) return 'Vence hoje';
  const overdueDays = Math.abs(debt.daysUntilDue);
  return `Venceu há ${overdueDays} dia${overdueDays === 1 ? '' : 's'}`;
}

function renderDebts(debts) {
  if (debts.length === 0) {
    renderEmptyState();
    return;
  }

  document.getElementById('debts-list').innerHTML = debts.map((d) => {
    const badge = statusBadge(d);
    const metaParts = [];
    if (d.installments_total) {
      metaParts.push(`Parcela ${d.installments_paid ?? 0} de ${d.installments_total}`);
    }
    if (d.interest_rate) {
      metaParts.push(`Juros: ${d.interest_rate}% a.m.`);
    }

    return `
      <div class="card goal-card">
        <div class="goal-card-header">
          <div>
            <div class="card-title">${escapeHtml(d.title)}</div>
            <div class="card-subtitle">${[d.creditor, d.type].filter(Boolean).map(escapeHtml).join(' · ') || '—'}</div>
          </div>
          <span class="badge ${badge.cls}">${badge.label}</span>
        </div>

        <div class="progress-bar"><div class="progress-bar-fill" style="width: ${d.progress}%;"></div></div>
        <div class="goal-card-progress-label">${d.progress}% pago</div>

        <div class="goal-card-stats">
          <div>
            <span class="goal-card-stat-label">Pago</span>
            <div class="amount amount--sm">${formatCurrency(d.paid_amount)}</div>
          </div>
          <div>
            <span class="goal-card-stat-label">Restante</span>
            <div class="amount amount--sm">${formatCurrency(d.remaining)}</div>
          </div>
        </div>

        ${metaParts.length ? `<div class="debt-card-meta">${metaParts.map((p) => `<span>${p}</span>`).join('')}</div>` : ''}

        <div class="goal-card-footer">
          <span class="goal-card-deadline">${formatDueLabel(d)}</span>
          <div class="cluster" style="gap: var(--space-2); flex-wrap: nowrap;">
            <button class="btn btn--ghost btn--sm" type="button" data-action="edit" data-id="${d.id}">Editar</button>
            <button class="btn btn--ghost btn--sm" type="button" data-action="delete" data-id="${d.id}">Excluir</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function getFilters() {
  return {
    status: document.getElementById('filter-debt-status').value || undefined,
    type: document.getElementById('filter-debt-type').value || undefined,
    sortBy: document.getElementById('sort-debts').value,
    search: document.getElementById('filter-debt-search').value || undefined,
  };
}

async function loadDebts() {
  renderSkeletons();
  try {
    currentDebts = await debtService.list(getFilters());
    renderDebts(currentDebts);
  } catch (error) {
    console.error('[debts] Falha ao carregar dívidas:', error);
    currentDebts = [];
    renderErrorState();
  }
}

/* --------------------------------------------------------------------
   Modal de criar/editar
   -------------------------------------------------------------------- */

function populateTypeSelects() {
  populateOptions(document.getElementById('debt-type'), DEBT_TYPES, {
    getValue: (t) => t, getLabel: (t) => t, placeholder: 'Selecione um tipo',
  });
  populateOptions(document.getElementById('filter-debt-type'), DEBT_TYPES, {
    getValue: (t) => t, getLabel: (t) => t, placeholder: 'Todos',
  });
}

function openDebtModal(debt = createEmptyDebt()) {
  const form = document.getElementById('debt-form');
  form.reset();

  document.getElementById('debt-id').value = debt.id ?? '';
  document.getElementById('debt-title').value = debt.title || '';
  document.getElementById('debt-type').value = debt.type || '';
  document.getElementById('debt-creditor').value = debt.creditor || '';
  document.getElementById('debt-total').value = debt.total_amount || '';
  document.getElementById('debt-paid').value = debt.paid_amount || '';
  document.getElementById('debt-interest').value = debt.interest_rate || '';
  document.getElementById('debt-due-date').value = debt.due_date || '';
  document.getElementById('debt-installments-total').value = debt.installments_total || '';
  document.getElementById('debt-installments-paid').value = debt.installments_paid || '';
  document.getElementById('debt-notes').value = debt.notes || '';

  document.getElementById('debt-modal-title').textContent = debt.id ? 'Editar dívida' : 'Nova dívida';

  clearFieldError(document.getElementById('debt-title'));
  clearFieldError(document.getElementById('debt-total'));

  openModal(document.getElementById('debt-modal'));
}

function validateForm() {
  let isValid = true;
  const title = document.getElementById('debt-title');
  const total = document.getElementById('debt-total');

  clearFieldError(title);
  clearFieldError(total);

  if (!title.value.trim()) {
    setFieldError(title, 'Informe o nome da dívida.');
    isValid = false;
  }
  if (!total.value || Number(total.value) <= 0) {
    setFieldError(total, 'Informe um valor total maior que zero.');
    isValid = false;
  }

  return isValid;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  if (!validateForm()) return;

  const id = document.getElementById('debt-id').value;
  const payload = {
    title: document.getElementById('debt-title').value,
    type: document.getElementById('debt-type').value || null,
    creditor: document.getElementById('debt-creditor').value,
    total_amount: document.getElementById('debt-total').value,
    paid_amount: document.getElementById('debt-paid').value || 0,
    interest_rate: document.getElementById('debt-interest').value || 0,
    due_date: document.getElementById('debt-due-date').value || null,
    installments_total: document.getElementById('debt-installments-total').value || null,
    installments_paid: document.getElementById('debt-installments-paid').value || null,
    notes: document.getElementById('debt-notes').value,
  };

  const submitButton = document.getElementById('debt-submit');
  setButtonLoading(submitButton, true);

  try {
    if (id) {
      await debtService.update(id, payload);
      showToast('Dívida atualizada.', 'success');
    } else {
      const user = getCurrentUser();
      await debtService.create({ ...payload, user_id: user.id });
      showToast('Dívida criada.', 'success');
    }
    closeModal(document.getElementById('debt-modal'));
    loadDebts();
    loadSummary();
  } catch (error) {
    console.error('[debts] Falha ao salvar dívida:', error);
    showToast(error?.message ?? 'Não foi possível salvar a dívida.', 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

/* --------------------------------------------------------------------
   Exclusão
   -------------------------------------------------------------------- */

function openDeleteModal(id) {
  pendingDeleteId = id;
  openModal(document.getElementById('delete-debt-modal'));
}

async function handleConfirmDelete() {
  if (!pendingDeleteId) return;

  const button = document.getElementById('confirm-delete-debt-btn');
  setButtonLoading(button, true);

  try {
    await debtService.remove(pendingDeleteId);
    showToast('Dívida excluída.', 'success');
    closeModal(document.getElementById('delete-debt-modal'));
    loadDebts();
    loadSummary();
  } catch (error) {
    console.error('[debts] Falha ao excluir dívida:', error);
    showToast('Não foi possível excluir a dívida.', 'danger');
  } finally {
    setButtonLoading(button, false);
    pendingDeleteId = null;
  }
}

/* --------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------- */

function bindEvents() {
  document.getElementById('add-debt-btn').addEventListener('click', () => openDebtModal());

  document.getElementById('debts-list').addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-action="edit"]');
    const deleteBtn = event.target.closest('[data-action="delete"]');

    if (editBtn) {
      const debt = currentDebts.find((d) => d.id === editBtn.dataset.id);
      if (debt) openDebtModal(debt);
    }
    if (deleteBtn) {
      openDeleteModal(deleteBtn.dataset.id);
    }
  });

  document.getElementById('debt-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('confirm-delete-debt-btn').addEventListener('click', handleConfirmDelete);

  ['filter-debt-status', 'filter-debt-type', 'sort-debts'].forEach((id) => {
    document.getElementById(id).addEventListener('change', loadDebts);
  });

  let searchTimeout;
  document.getElementById('filter-debt-search').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadDebts, 400);
  });

  bindModalDismiss(document.getElementById('debt-modal'));
  bindModalDismiss(document.getElementById('delete-debt-modal'));
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  bindEvents();
  populateTypeSelects();
  loadSummary();
  loadDebts();
}
