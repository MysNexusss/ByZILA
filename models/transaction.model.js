/**
 * transaction.model.js
 * ============================================================================
 * Definição da forma dos dados de uma Transação (representação em código
 * da tabela "transactions" no Supabase). Apenas forma/constantes — nenhuma
 * validação ou cálculo pertence a este arquivo (isso é responsabilidade de
 * services/transaction.service.js).
 *
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} user_id
 * @property {string|null} category_id
 * @property {"income"|"expense"} type
 * @property {number} amount
 * @property {string} description
 * @property {string} date            - formato ISO 8601 (aaaa-mm-dd)
 * @property {string} created_at      - formato ISO 8601
 * ============================================================================
 */

/** Valores possíveis para o campo "type", usados em toda a aplicação. */
export const TRANSACTION_TYPES = Object.freeze({
  INCOME: 'income',
  EXPENSE: 'expense',
});

/**
 * Retorna a forma inicial de uma transação nova, no formato esperado pelo
 * formulário (ver pages/transactions.js). Não persiste nada.
 * @returns {{ id: null, type: string, amount: string, category_id: string, description: string, date: string }}
 */
export function createEmptyTransaction() {
  return {
    id: null,
    type: TRANSACTION_TYPES.EXPENSE,
    amount: '',
    category_id: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  };
}
