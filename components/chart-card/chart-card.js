/**
 * chart-card.js
 * ============================================================================
 * Integração com o Chart.js. O import é feito por CDN (ESM) e só é
 * baixado quando este módulo é carregado — ou seja, apenas quando a
 * tela de Estatísticas é aberta, nunca no carregamento inicial do app.
 * ============================================================================
 */

import Chart from 'https://cdn.jsdelivr.net/npm/chart.js@4/auto/+esm';
// Alternativa, caso o jsDelivr apresente problema de resolução de módulos:
// import Chart from 'https://esm.sh/chart.js@4/auto';

/** Lê um token de cor do Design System (css/variables.css) em tempo real. */
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Alinha a aparência padrão do Chart.js à tipografia e cores do Design
// System, em vez de usar os padrões genéricos da biblioteca.
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = cssVar('--color-graphite-soft');
Chart.defaults.borderColor = cssVar('--color-line-on-white');

/**
 * Renderiza (ou re-renderiza) um gráfico dentro de um <canvas>. Destrói
 * qualquer instância anterior associada ao mesmo elemento antes de criar
 * uma nova — evita gráficos sobrepostos ao atualizar filtros.
 * @param {HTMLCanvasElement} canvasEl
 * @param {object} config - configuração padrão do Chart.js (type, data, options)
 * @returns {Chart|null}
 */
export function renderChart(canvasEl, config) {
  if (!canvasEl) return null;

  Chart.getChart(canvasEl)?.destroy();

  return new Chart(canvasEl, {
    ...config,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...config.options,
    },
  });
}
