/**
 * loader.js
 * ============================================================================
 * Estado de carregamento em nível de container, via .loader-overlay
 * (definido em loader.css). Complementar ao loading embutido em botões
 * (ver components/button/button.js -> setButtonLoading): aquele cobre um
 * único botão; este cobre uma área inteira — útil, por exemplo, enquanto
 * a sessão é recuperada do Supabase antes do roteamento inicial.
 * ============================================================================
 */

/**
 * Exibe um overlay de carregamento sobre um container. O container deve
 * ter position: relative (ou equivalente) para o overlay se posicionar
 * corretamente por cima do conteúdo existente.
 * @param {HTMLElement} container
 */
export function showLoader(container) {
  if (!container) return;

  let overlay = container.querySelector(':scope > .loader-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loader-overlay';
    overlay.innerHTML = '<span class="loader"></span>';
    container.appendChild(overlay);
  }
  overlay.classList.add('is-active');
}

/**
 * Remove o overlay de carregamento de um container.
 * @param {HTMLElement} container
 */
export function hideLoader(container) {
  if (!container) return;
  container.querySelector(':scope > .loader-overlay')?.classList.remove('is-active');
}
