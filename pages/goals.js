/**
 * goals.js
 * ============================================================================
 * Controlador da tela de Metas. router.js chama init() logo depois de
 * injetar pages/goals.html em #route-outlet.
 * ============================================================================
 */

import * as goalService from '../services/goal.service.js';
import { createEmptyGoal, GOAL_CATEGORIES } from '../models/goal.model.js';
import { formatCurrency, escapeHtml } from '../js/utils.js';
import { getCurrentUser } from '../js/auth.js';
import { showToast } from '../components/toast/toast.js';
import { setFieldError, clearFieldError } from '../components/input/input.js';
import { setButtonLoading } from '../components/button/button.js';
import { openModal, closeModal, bindModalDismiss } from '../components/modal/modal.js';
import { populateOptions } from '../components/select/select.js';

let currentGoals = [];
let pendingDeleteId = null;

const STATUS_BADGE = { active: 'badge--gold', completed: 'badge--success', overdue: 'badge--danger' };
const STATUS_LABEL = { active: 'Ativa', completed: 'Concluída', overdue: 'Vencida' };

/* --------------------------------------------------------------------
   Lista
   -------------------------------------------------------------------- */

function renderSkeletons() {
  document.getElementById('goals-list').innerHTML = Array.from({ length: 6 }, () => `
    <div class="card">
      <div class="skeleton skeleton-text" style="width: 70%;"></div>
      <div class="skeleton skeleton-text" style="width: 40%; margin-top: var(--space-2);"></div>
      <div class="skeleton skeleton-card" style="height: 80px; margin-top: var(--space-4);"></div>
    </div>
  `).join('');
}

function renderEmptyState() {
  document.getElementById('goals-list').innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <h3 class="empty-state-title">Nenhuma meta encontrada</h3>
      <p class="empty-state-desc">Ajuste os filtros ou crie sua primeira meta.</p>
      <button class="btn btn--primary btn--sm" type="button" id="empty-state-add-goal">+ Nova meta</button>
    </div>
  `;
  document.getElementById('empty-state-add-goal')?.addEventListener('click', () => openGoalModal());
}

function renderErrorState() {
  document.getElementById('goals-list').innerHTML = `
    <div class="card" style="grid-column: 1 / -1;">
      <p class="empty-state-desc" style="margin: 0;">Não foi possível carregar as metas.</p>
    </div>
  `;
}

function renderGoals(goals) {
  if (goals.length === 0) {
    renderEmptyState();
    return;
  }

  document.getElementById('goals-list').innerHTML = goals.map((g) => `
    <div class="card goal-card">
      <div class="goal-card-header">
        <div class="card-title">${escapeHtml(g.title)}</div>
        <span class="badge ${STATUS_BADGE[g.status]}">${STATUS_LABEL[g.status]}</span>
      </div>

      ${g.category ? `<span class="badge badge--neutral goal-card-category">${escapeHtml(g.category)}</span>` : ''}
      ${g.description ? `<p class="goal-card-description">${escapeHtml(g.description)}</p>` : ''}

      <div class="progress-bar"><div class="progress-bar-fill" style="width: ${g.progress}%;"></div></div>
      <div class="goal-card-progress-label">${g.progress}% concluído</div>

      <div class="goal-card-stats">
        <div>
          <span class="goal-card-stat-label">Atual</span>
          <div class="amount amount--sm">${formatCurrency(g.current_amount)}</div>
        </div>
        <div>
          <span class="goal-card-stat-label">Restante</span>
          <div class="amount amount--sm">${formatCurrency(g.remaining)}</div>
        </div>
      </div>

      <div class="goal-card-footer">
        <span class="goal-card-deadline">${formatDeadlineLabel(g)}</span>
        <div class="cluster" style="gap: var(--space-2); flex-wrap: nowrap;">
          <button class="btn btn--ghost btn--sm" type="button" data-action="edit" data-id="${g.id}">Editar</button>
          <button class="btn btn--ghost btn--sm" type="button" data-action="delete" data-id="${g.id}">Excluir</button>
        </div>
      </div>
    </div>
  `).join('');
}

function formatDeadlineLabel(goal) {
  if (goal.status === 'completed') return 'Meta concluída';
  if (goal.daysRemaining === null) return 'Sem prazo definido';
  if (goal.daysRemaining > 0) return `Faltam ${goal.daysRemaining} dia${goal.daysRemaining === 1 ? '' : 's'}`;
  if (goal.daysRemaining === 0) return 'Vence hoje';
  const overdueDays = Math.abs(goal.daysRemaining);
  return `Venceu há ${overdueDays} dia${overdueDays === 1 ? '' : 's'}`;
}

function getFilters() {
  return {
    status: document.getElementById('filter-status').value || undefined,
    sortBy: document.getElementById('sort-goals').value,
    search: document.getElementById('filter-search').value || undefined,
  };
}

async function loadGoals() {
  renderSkeletons();
  try {
    currentGoals = await goalService.list(getFilters());
    renderGoals(currentGoals);
  } catch (error) {
    console.error('[goals] Falha ao carregar metas:', error);
    currentGoals = [];
    renderErrorState();
  }
}

/* --------------------------------------------------------------------
   Modal de criar/editar
   -------------------------------------------------------------------- */

function populateCategorySelect(selected) {
  const select = document.getElementById('goal-category');
  populateOptions(select, GOAL_CATEGORIES, {
    getValue: (c) => c,
    getLabel: (c) => c,
    placeholder: 'Selecione uma categoria',
  });
  select.value = selected || '';
}

function openGoalModal(goal = createEmptyGoal()) {
  const form = document.getElementById('goal-form');
  form.reset();

  document.getElementById('goal-id').value = goal.id ?? '';
  document.getElementById('goal-title').value = goal.title || '';
  document.getElementById('goal-target').value = goal.target_amount || '';
  document.getElementById('goal-current').value = goal.current_amount || '';
  document.getElementById('goal-deadline').value = goal.deadline || '';
  document.getElementById('goal-description').value = goal.description || '';
  populateCategorySelect(goal.category);

  document.getElementById('goal-modal-title').textContent = goal.id ? 'Editar meta' : 'Nova meta';

  clearFieldError(document.getElementById('goal-title'));
  clearFieldError(document.getElementById('goal-target'));

  openModal(document.getElementById('goal-modal'));
}

function validateForm() {
  let isValid = true;
  const title = document.getElementById('goal-title');
  const target = document.getElementById('goal-target');

  clearFieldError(title);
  clearFieldError(target);

  if (!title.value.trim()) {
    setFieldError(title, 'Informe o nome da meta.');
    isValid = false;
  }
  if (!target.value || Number(target.value) <= 0) {
    setFieldError(target, 'Informe um valor objetivo maior que zero.');
    isValid = false;
  }

  return isValid;
}

async function handleFormSubmit(event) {
  event.preventDefault();
  if (!validateForm()) return;

  const id = document.getElementById('goal-id').value;
  const payload = {
    title: document.getElementById('goal-title').value,
    target_amount: document.getElementById('goal-target').value,
    current_amount: document.getElementById('goal-current').value || 0,
    deadline: document.getElementById('goal-deadline').value || null,
    category: document.getElementById('goal-category').value || null,
    description: document.getElementById('goal-description').value,
  };

  const submitButton = document.getElementById('goal-submit');
  setButtonLoading(submitButton, true);

  try {
    if (id) {
      await goalService.update(id, payload);
      showToast('Meta atualizada.', 'success');
    } else {
      const user = getCurrentUser();
      await goalService.create({ ...payload, user_id: user.id });
      showToast('Meta criada.', 'success');
    }
    closeModal(document.getElementById('goal-modal'));
    loadGoals();
  } catch (error) {
    console.error('[goals] Falha ao salvar meta:', error);
    showToast(error?.message ?? 'Não foi possível salvar a meta.', 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

/* --------------------------------------------------------------------
   Exclusão
   -------------------------------------------------------------------- */

function openDeleteModal(id) {
  pendingDeleteId = id;
  openModal(document.getElementById('delete-goal-modal'));
}

async function handleConfirmDelete() {
  if (!pendingDeleteId) return;

  const button = document.getElementById('confirm-delete-goal-btn');
  setButtonLoading(button, true);

  try {
    await goalService.remove(pendingDeleteId);
    showToast('Meta excluída.', 'success');
    closeModal(document.getElementById('delete-goal-modal'));
    loadGoals();
  } catch (error) {
    console.error('[goals] Falha ao excluir meta:', error);
    showToast('Não foi possível excluir a meta.', 'danger');
  } finally {
    setButtonLoading(button, false);
    pendingDeleteId = null;
  }
}

/* --------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------- */

function bindEvents() {
  document.getElementById('add-goal-btn').addEventListener('click', () => openGoalModal());

  document.getElementById('goals-list').addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-action="edit"]');
    const deleteBtn = event.target.closest('[data-action="delete"]');

    if (editBtn) {
      const goal = currentGoals.find((g) => g.id === editBtn.dataset.id);
      if (goal) openGoalModal(goal);
    }
    if (deleteBtn) {
      openDeleteModal(deleteBtn.dataset.id);
    }
  });

  document.getElementById('goal-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('confirm-delete-goal-btn').addEventListener('click', handleConfirmDelete);

  ['filter-status', 'sort-goals'].forEach((id) => {
    document.getElementById(id).addEventListener('change', loadGoals);
  });

  let searchTimeout;
  document.getElementById('filter-search').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadGoals, 400);
  });

  bindModalDismiss(document.getElementById('goal-modal'));
  bindModalDismiss(document.getElementById('delete-goal-modal'));
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  bindEvents();
  loadGoals();
}
