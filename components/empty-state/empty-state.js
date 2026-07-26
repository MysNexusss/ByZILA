/**
 * empty-state.js
 * ============================================================================
 * Renderização compartilhada de estados vazios — usado quando uma lista
 * (transações, metas, dívidas) não retorna itens, evitando que cada
 * página reescreva o mesmo markup na mão.
 * ============================================================================
 */

import { escapeHtml } from '../../js/utils.js';

/**
 * Renderiza um empty state dentro de um container.
 * @param {HTMLElement} container
 * @param {Object} config
 * @param {string} config.title
 * @param {string} [config.description]
 * @param {boolean} [config.compact=false] - variante compacta, para dentro de cards menores (ex.: seções do Dashboard)
 * @param {boolean} [config.fullWidth=false] - ocupa todas as colunas quando o container é um grid de cards
 * @param {{ label: string, onClick: Function }} [config.action] - botão de ação opcional (ex.: "+ Nova meta")
 */
export function renderEmptyState(container, { title, description, compact = false, fullWidth = false, action } = {}) {
  if (!container) return;

  const actionId = action ? `empty-state-action-${Math.random().toString(36).slice(2, 8)}` : '';
  const classes = ['empty-state', compact && 'empty-state--compact', fullWidth && 'empty-state--full']
    .filter(Boolean)
    .join(' ');

  container.innerHTML = `
    <div class="${classes}">
      <h3 class="empty-state-title">${escapeHtml(title)}</h3>
      ${description ? `<p class="empty-state-desc">${escapeHtml(description)}</p>` : ''}
      ${action ? `<button class="btn btn--primary btn--sm" type="button" id="${actionId}">${escapeHtml(action.label)}</button>` : ''}
    </div>
  `;

  if (action) {
    document.getElementById(actionId)?.addEventListener('click', action.onClick);
  }
}

/**
 * Renderiza uma mensagem de erro simples (sem título, ícone ou ação) —
 * usado quando uma consulta ao Supabase falha.
 * @param {HTMLElement} container
 * @param {string} message
 * @param {boolean} [fullWidth=false] - ocupa todas as colunas quando o container é um grid de cards
 */
export function renderErrorMessage(container, message, fullWidth = false) {
  if (!container) return;
  const style = fullWidth ? 'grid-column: 1 / -1; margin: 0;' : 'margin: 0;';
  container.innerHTML = `<p class="empty-state-desc" style="${style}">${escapeHtml(message)}</p>`;
}
