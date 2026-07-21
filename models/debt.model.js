/**
 * debt.model.js
 * ============================================================================
 * Definição da forma dos dados de uma Dívida (tabela "debts" no Supabase).
 * Apenas forma/constantes — nenhuma validação ou cálculo pertence a este
 * arquivo (isso é responsabilidade de services/debt.service.js).
 *
 * @typedef {Object} Debt
 * @property {string} id
 * @property {string} user_id
 * @property {string} title
 * @property {string|null} type
 * @property {string|null} creditor
 * @property {number} total_amount
 * @property {number} paid_amount
 * @property {number|null} installments_total
 * @property {number|null} installments_paid
 * @property {number} interest_rate
 * @property {string|null} due_date       - formato ISO 8601 (aaaa-mm-dd)
 * @property {string|null} notes
 * @property {string} created_at          - formato ISO 8601
 * @property {string} updated_at          - formato ISO 8601
 * ============================================================================
 */

/**
 * Status possíveis de uma dívida — sempre calculado por
 * services/debt.service.js, nunca armazenado no banco.
 */
export const DEBT_STATUS = Object.freeze({
  OPEN: 'open',
  OVERDUE: 'overdue',
  PAID: 'paid',
});

/** Lista fixa de tipos de dívida — texto livre, sem relação com o banco. */
export const DEBT_TYPES = Object.freeze(['Cartão', 'Empréstimo', 'Financiamento', 'Outro']);

/**
 * Retorna a forma inicial de uma dívida nova, no formato esperado pelo
 * formulário (ver pages/debts.js). Não persiste nada.
 */
export function createEmptyDebt() {
  return {
    id: null,
    title: '',
    type: '',
    creditor: '',
    total_amount: '',
    paid_amount: '',
    interest_rate: '',
    due_date: '',
    installments_total: '',
    installments_paid: '',
    notes: '',
  };
}
