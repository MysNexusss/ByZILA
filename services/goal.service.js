/**
 * goal.service.js
 * ============================================================================
 * Regras de negócio relacionadas a metas financeiras: cálculo de status
 * (ativa/concluída/vencida), progresso, valor restante e dias restantes;
 * listagem com filtro/ordenação/busca; validação antes de criar/atualizar.
 * ============================================================================
 */

import * as goalRepository from '../repositories/goal.repository.js';
import { GOAL_STATUS } from '../models/goal.model.js';

/**
 * Lista as metas do usuário, já decoradas com status/progresso/dias
 * restantes, com filtro de status, busca por nome e ordenação opcionais.
 * @param {Object} [filters]
 * @param {string} [filters.status] - "active" | "completed" | "overdue"
 * @param {string} [filters.search]
 * @param {string} [filters.sortBy] - "deadline" | "progress" | "name" (padrão "deadline")
 */
export async function list(filters = {}) {
  const goals = (await goalRepository.findAll()).map(decorate);

  let filtered = goals;
  if (filters.status) {
    filtered = filtered.filter((g) => g.status === filters.status);
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim().toLowerCase();
    filtered = filtered.filter((g) => g.title.toLowerCase().includes(term));
  }

  return sortGoals(filtered, filters.sortBy);
}

/**
 * Retorna as metas ativas (não concluídas, não vencidas), usado pelo
 * Dashboard — limitadas a "limit" itens, ordenadas pelo prazo mais próximo.
 * @param {number} [limit=3]
 */
export async function getInProgress(limit = 3) {
  const goals = await list({ status: GOAL_STATUS.ACTIVE, sortBy: 'deadline' });
  return goals.slice(0, limit);
}

/**
 * Cria uma nova meta para o usuário autenticado. "data" deve incluir
 * user_id (anexado pela página).
 * @param {object} data
 */
export async function create(data) {
  validate(data);

  return goalRepository.insert({
    user_id: data.user_id,
    title: data.title.trim(),
    target_amount: Number(data.target_amount),
    current_amount: Number(data.current_amount) || 0,
    deadline: data.deadline || null,
    category: data.category || null,
    description: data.description?.trim() || null,
  });
}

/**
 * Atualiza uma meta existente.
 * @param {string} id
 * @param {object} data
 */
export async function update(id, data) {
  validate(data);

  return goalRepository.update(id, {
    title: data.title.trim(),
    target_amount: Number(data.target_amount),
    current_amount: Number(data.current_amount) || 0,
    deadline: data.deadline || null,
    category: data.category || null,
    description: data.description?.trim() || null,
  });
}

/**
 * Remove uma meta.
 * @param {string} id
 */
export async function remove(id) {
  return goalRepository.remove(id);
}

/* --------------------------------------------------------------------
   Cálculos derivados (status, progresso, valor restante, dias restantes)
   -------------------------------------------------------------------- */

function decorate(goal) {
  const target = Number(goal.target_amount) || 0;
  const current = Number(goal.current_amount) || 0;
  const status = computeStatus(goal, target, current);
  const progress = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return {
    ...goal,
    target_amount: target,
    current_amount: current,
    status,
    progress,
    remaining: Math.max(0, target - current),
    daysRemaining: goal.deadline ? daysUntil(goal.deadline) : null,
  };
}

/** Calculado sempre na leitura — é isso que "marca como concluída automaticamente". */
function computeStatus(goal, target, current) {
  if (target > 0 && current >= target) return GOAL_STATUS.COMPLETED;
  if (goal.deadline && goal.deadline < todayISO()) return GOAL_STATUS.OVERDUE;
  return GOAL_STATUS.ACTIVE;
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

function sortGoals(goals, sortBy = 'deadline') {
  const sorted = [...goals];

  switch (sortBy) {
    case 'progress':
      sorted.sort((a, b) => b.progress - a.progress);
      break;
    case 'name':
      sorted.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
      break;
    case 'deadline':
    default:
      sorted.sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      });
  }

  return sorted;
}

/** Última linha de defesa antes de enviar dados ao Supabase. */
function validate(data) {
  if (!data.title?.trim()) {
    throw new Error('Informe o nome da meta.');
  }
  if (!(Number(data.target_amount) > 0)) {
    throw new Error('O valor objetivo deve ser maior que zero.');
  }
  if (data.current_amount !== undefined && Number(data.current_amount) < 0) {
    throw new Error('O valor atual não pode ser negativo.');
  }
}
