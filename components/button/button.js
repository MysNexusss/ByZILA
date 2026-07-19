/**
 * button.js
 * ============================================================================
 * Estado de carregamento reutilizável para botões (ex.: durante chamadas
 * de autenticação ao Supabase).
 * ============================================================================
 */

/**
 * Alterna um botão para o estado de carregamento: desabilita o clique e
 * troca o conteúdo por um loader, preservando o texto original para
 * restaurar depois.
 * @param {HTMLButtonElement} buttonEl
 * @param {boolean} isLoading
 */
export function setButtonLoading(buttonEl, isLoading) {
  if (isLoading) {
    buttonEl.dataset.originalText = buttonEl.textContent;
    buttonEl.disabled = true;
    buttonEl.innerHTML = '<span class="loader loader--sm"></span>';
  } else {
    buttonEl.disabled = false;
    buttonEl.textContent = buttonEl.dataset.originalText ?? buttonEl.textContent;
  }
}
