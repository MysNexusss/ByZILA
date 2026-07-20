/**
 * transactions.js
 * ============================================================================
 * Controlador da tela de Transações. router.js chama init() logo depois
 * de injetar pages/transactions.html em #route-outlet.
 * ============================================================================
 */

import * as transactionService from '../services/transaction.service.js';
import * as categoryService from '../services/category.service.js';
import { createEmptyTransaction } from '../models/transaction.model.js';
import { formatCurrency, formatDate, escapeHtml } from '../js/utils.js';
import { getCurrentUser } from '../js/auth.js';
import { showToast } from '../components/toast/toast.js';
import { setFieldError, clearFieldError } from '../components/input/input.js';
import { setButtonLoading } from '../components/button/button.js';
import { openModal, closeModal, bindModalDismiss } from '../components/modal/modal.js';
import { populateOptions } from '../components/select/select.js';

let categories = [];
let currentTransactions = [];
let pendingDeleteId = null;

/* --------------------------------------------------------------------
   Lista
   -------------------------------------------------------------------- */

function renderSkeletonRows() {
  const tbody = document.getElementById('transactions-table-body');
  tbody.innerHTML = Array.from({ length: 5 }, () => `
    <tr><td colspan="5"><div class="skeleton skeleton-text"></div></td></tr>
  `).join('');
}

function renderEmptyState() {
  document.getElementById('transactions-table-body').innerHTML = `
    <tr><td colspan="5">
      <div class="empty-state empty-state--compact">
        <h3 class="empty-state-title">Nenhuma transação encontrada</h3>
        <p class="empty-state-desc">Ajuste os filtros ou adicione sua primeira transação.</p>
      </div>
    </td></tr>
  `;
}

function renderErrorState(message) {
  document.getElementById('transactions-table-body').innerHTML =
    `<tr><td colspan="5"><p class="empty-state-desc">${escapeHtml(message)}</p></td></tr>`;
}

function renderTransactions(transactions) {
  if (transactions.length === 0) {
    renderEmptyState();
    return;
  }

  document.getElementById('transactions-table-body').innerHTML = transactions.map((t) => `
    <tr>
      <td>${formatDate(t.date)}</td>
      <td>${escapeHtml(t.description || '—')}</td>
      <td>${t.category?.name ? `<span class="badge badge--neutral">${escapeHtml(t.category.name)}</span>` : '—'}</td>
      <td class="amount amount--sm ${t.type === 'income' ? 'amount--positive' : 'amount--negative'}">
        ${t.type === 'income' ? '+' : '−'} ${formatCurrency(t.amount)}
      </td>
      <td>
        <div class="cluster" style="gap: var(--space-2); flex-wrap: nowrap;">
          <button class="btn btn--ghost btn--sm" type="button" data-action="edit" data-id="${t.id}">Editar</button>
          <button class="btn btn--ghost btn--sm" type="button" data-action="delete" data-id="${t.id}">Excluir</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getFilters() {
  return {
    month: document.getElementById('filter-month').value || undefined,
    type: document.getElementById('filter-type').value || undefined,
    categoryId: document.getElementById('filter-category').value || undefined,
    search: document.getElementById('filter-search').value || undefined,
  };
}

async function loadTransactions() {
  renderSkeletonRows();
  try {
    currentTransactions = await transactionService.list(getFilters());
    renderTransactions(currentTransactions);
  } catch (error) {
    console.error('[transactions] Falha ao carregar transações:', error);
    currentTransactions = [];
    renderErrorState('Não foi possível carregar as transações.');
  }
}

/* --------------------------------------------------------------------
   Categorias (filtro + formulário)
   -------------------------------------------------------------------- */

async function loadCategories() {
  try {
    categories = await categoryService.list();
    populateOptions(document.getElementById('filter-category'), categories, { placeholder: 'Todas' });
  } catch (error) {
    console.error('[transactions] Falha ao carregar categorias:', error);
    // Não bloqueia a tela — o filtro de categoria só fica vazio.
  }
}

function populateFormCategories(type) {
  const select = document.getElementById('transaction-category');
  const filtered = categories.filter((c) => c.type === type);
  populateOptions(select, filtered, { placeholder: 'Sem categoria' });
}

/* --------------------------------------------------------------------
   Modal de criar/editar
   -------------------------------------------------------------------- */

function openTransactionModal(transaction = createEmptyTransaction()) {
  const form = document.getElementById('transaction-form');
  form.reset();

  document.getElementById('transaction-id').value = transaction.id ?? '';
  form.elements.type.value = transaction.type;
  document.getElementById('transaction-amount').value = transaction.amount || '';
  document.getElementById('transaction-description').value = transaction.description || '';
  document.getElementById('transaction-date').value = transaction.date;

  populateFormCategories(transaction.type);
  document.getElementById('transaction-category').value = transaction.category_id || '';

  document.getElementById('transaction-modal-title').textContent =
    transaction.id ? 'Editar transação' : 'Nova transação';

  clearFieldError(document.getElementById('transaction-amount'));
  clearFieldError(document.getElementById('transaction-date'));

  openModal(document.getElementById('transaction-modal'));
}

function validateForm() {
  let isValid = true;
  const amount = document.getElementById('transaction-amount');
  const date = document.getElementById('transaction-date');

  clearFieldError(amount);
  clearFieldError(date);

  if (!amount.value || Number(amount.value) <= 0) {
    setFieldError(amount, 'Informe um valor maior que zero.');
    isValid = false;
  }
  if (!date.value) {
    setFieldError(date, 'Informe a data.');
    isValid = false;
  }

  return isValid;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  if (!validateForm()) return;

  const id = document.getElementById('transaction-id').value;
  const payload = {
    type: document.querySelector('input[name="type"]:checked').value,
    amount: document.getElementById('transaction-amount').value,
    category_id: document.getElementById('transaction-category').value || null,
    description: document.getElementById('transaction-description').value,
    date: document.getElementById('transaction-date').value,
  };

  const submitButton = document.getElementById('transaction-submit');
  setButtonLoading(submitButton, true);

  try {
    if (id) {
      await transactionService.update(id, payload);
      showToast('Transação atualizada.', 'success');
    } else {
      const user = getCurrentUser();
      await transactionService.create({ ...payload, user_id: user.id });
      showToast('Transação criada.', 'success');
    }

    closeModal(document.getElementById('transaction-modal'));
    loadTransactions();
  } catch (error) {
    console.error('[transactions] Falha ao salvar transação:', error);
    showToast(error?.message ?? 'Não foi possível salvar a transação.', 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

/* --------------------------------------------------------------------
   Exclusão
   -------------------------------------------------------------------- */

function openDeleteModal(id) {
  pendingDeleteId = id;
  openModal(document.getElementById('delete-modal'));
}

async function handleConfirmDelete() {
  if (!pendingDeleteId) return;

  const button = document.getElementById('confirm-delete-btn');
  setButtonLoading(button, true);

  try {
    await transactionService.remove(pendingDeleteId);
    showToast('Transação excluída.', 'success');
    closeModal(document.getElementById('delete-modal'));
    loadTransactions();
  } catch (error) {
    console.error('[transactions] Falha ao excluir transação:', error);
    showToast('Não foi possível excluir a transação.', 'danger');
  } finally {
    setButtonLoading(button, false);
    pendingDeleteId = null;
  }
}

/* --------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------- */

function bindEvents() {
  document.getElementById('add-transaction-btn').addEventListener('click', () => openTransactionModal());

  document.getElementById('transactions-table-body').addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-action="edit"]');
    const deleteBtn = event.target.closest('[data-action="delete"]');

    if (editBtn) {
      const transaction = currentTransactions.find((t) => t.id === editBtn.dataset.id);
      if (transaction) openTransactionModal(transaction);
    }
    if (deleteBtn) {
      openDeleteModal(deleteBtn.dataset.id);
    }
  });

  document.getElementById('transaction-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('confirm-delete-btn').addEventListener('click', handleConfirmDelete);

  document.querySelectorAll('input[name="type"]').forEach((radio) => {
    radio.addEventListener('change', (event) => populateFormCategories(event.target.value));
  });

  ['filter-month', 'filter-type', 'filter-category'].forEach((id) => {
    document.getElementById(id).addEventListener('change', loadTransactions);
  });

  let searchTimeout;
  document.getElementById('filter-search').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadTransactions, 400);
  });

  bindModalDismiss(document.getElementById('transaction-modal'));
  bindModalDismiss(document.getElementById('delete-modal'));
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  bindEvents();
  loadCategories();
  loadTransactions();
}
