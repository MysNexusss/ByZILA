/**
 * badge.js
 * ============================================================================
 * Construção compartilhada do HTML de um badge — usado por Metas e
 * Dívidas para não duplicar a montagem de `<span class="badge ...">`
 * (o mapeamento status → variante/rótulo continua em cada página, já
 * que os status de cada domínio são diferentes entre si).
 * ============================================================================
 */

import { escapeHtml } from '../../js/utils.js';

/**
 * Retorna o HTML de um badge.
 * @param {string} label
 * @param {'gold'|'success'|'danger'|'neutral'|'info'} [variant='neutral']
 * @returns {string}
 */
export function renderBadge(label, variant = 'neutral') {
  return `<span class="badge badge--${variant}">${escapeHtml(label)}</span>`;
}
