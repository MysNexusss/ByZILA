/**
 * goal.model.js
 * ============================================================================
 * Definição da forma dos dados de uma Meta financeira (tabela "goals" no
 * Supabase). Apenas forma/constantes — nenhuma validação ou cálculo
 * pertence a este arquivo (isso é responsabilidade de services/goal.service.js).
 *
 * @typedef {Object} Goal
 * @property {string} id
 * @property {string} user_id
 * @property {string} title
 * @property {number} target_amount
 * @property {number} current_amount
 * @property {string|null} deadline      - formato ISO 8601 (aaaa-mm-dd)
 * @property {string|null} category
 * @property {string|null} description
 * @property {string} created_at         - formato ISO 8601
 * @property {string} updated_at         - formato ISO 8601
 * ============================================================================
 */

/**
 * Status possíveis de uma meta — sempre calculado por
 * services/goal.service.js, nunca armazenado no banco.
 */
export const GOAL_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
});

/** Lista fixa de categorias de meta — texto livre, sem relação com o banco. */
export const GOAL_CATEGORIES = Object.freeze([
  'Viagem',
  'Emergência',
  'Casa',
  'Carro',
  'Educação',
  'Saúde',
  'Outros',
]);

/**
 * Retorna a forma inicial de uma meta nova, no formato esperado pelo
 * formulário (ver pages/goals.js). Não persiste nada.
 */
export function createEmptyGoal() {
  return {
    id: null,
    title: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
    category: '',
    description: '',
  };
}
