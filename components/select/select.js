/**
 * select.js
 * ============================================================================
 * Preenchimento dinâmico de campos <select>.
 * ============================================================================
 */

import { escapeHtml } from '../../js/utils.js';

/**
 * Preenche um <select> com opções a partir de uma lista de objetos.
 * @param {HTMLSelectElement} selectEl
 * @param {Array<object>} items
 * @param {Object} [config]
 * @param {(item: object) => string} [config.getValue] - padrão: item.id
 * @param {(item: object) => string} [config.getLabel] - padrão: item.name
 * @param {string} [config.placeholder] - texto da primeira opção (value="")
 */
export function populateOptions(selectEl, items, config = {}) {
  if (!selectEl) return;

  const getValue = config.getValue ?? ((item) => item.id);
  const getLabel = config.getLabel ?? ((item) => item.name);

  const placeholderOption = config.placeholder
    ? `<option value="">${escapeHtml(config.placeholder)}</option>`
    : '';

  selectEl.innerHTML = placeholderOption + items
    .map((item) => `<option value="${escapeHtml(String(getValue(item)))}">${escapeHtml(getLabel(item))}</option>`)
    .join('');
}
