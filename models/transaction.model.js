/**
 * transaction.model.js
 * ============================================================================
 * Definição da forma dos dados de uma Transação (representação em código
 * da futura tabela "transactions" no Supabase). Apenas documentação de
 * tipo — nenhuma lógica, validação ou cálculo pertence a este arquivo
 * (isso é responsabilidade de services/transaction.service.js).
 *
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} user_id
 * @property {string} category_id
 * @property {"income"|"expense"} type
 * @property {number} amount
 * @property {string} description
 * @property {string} date            - formato ISO 8601
 * @property {string} created_at      - formato ISO 8601
 *
 * Status: 🚧 Não implementado — fase atual: App Shell (arquitetura).
 * ============================================================================
 */
