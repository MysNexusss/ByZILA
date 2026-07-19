/**
 * utils.js
 * ============================================================================
 * Funções utilitárias puras, sem dependência de estado.
 * ============================================================================
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata um valor numérico como moeda (R$) — usado em todo elemento
 * .amount ("Ledger Numerals") do Design System.
 * @param {number|string} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

/**
 * Formata uma data (string "aaaa-mm-dd" ou Date) no padrão dd/mm/aaaa.
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
}

/**
 * Escapa caracteres HTML especiais antes de inserir texto vindo do banco
 * de dados via innerHTML — evita injeção de HTML/script a partir de
 * descrições de transações, títulos de metas/dívidas, etc.
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

// TODO (fase futura): validações genéricas, debounce/throttle.
