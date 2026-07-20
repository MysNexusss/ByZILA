/**
 * modal.js
 * ============================================================================
 * Controle de abertura/fechamento de modais. Funciona com qualquer
 * elemento .modal-overlay presente no documento.
 * ============================================================================
 */

/**
 * Abre um modal, opcionalmente substituindo o conteúdo interno (.modal).
 * @param {HTMLElement} overlayEl - o elemento .modal-overlay
 * @param {string} [innerHTML] - se fornecido, substitui o innerHTML de .modal
 */
export function openModal(overlayEl, innerHTML) {
  if (!overlayEl) return;
  if (innerHTML !== undefined) {
    const modal = overlayEl.querySelector('.modal');
    if (modal) modal.innerHTML = innerHTML;
  }
  overlayEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

/**
 * Fecha um modal.
 * @param {HTMLElement} overlayEl
 */
export function closeModal(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.remove('is-open');
  document.body.style.overflow = '';
}

/**
 * Liga o comportamento padrão de fechamento a um overlay: clique fora do
 * card, qualquer elemento com data-action="close-modal", ou tecla Esc.
 * Chame uma única vez, ao montar a página que usa o modal.
 * @param {HTMLElement} overlayEl
 */
export function bindModalDismiss(overlayEl) {
  if (!overlayEl) return;

  overlayEl.addEventListener('click', (event) => {
    if (event.target === overlayEl || event.target.closest('[data-action="close-modal"]')) {
      closeModal(overlayEl);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlayEl.classList.contains('is-open')) {
      closeModal(overlayEl);
    }
  });
}
