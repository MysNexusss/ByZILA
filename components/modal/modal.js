/**
 * modal.js
 * ============================================================================
 * Controle de abertura/fechamento de modais. Funciona com qualquer
 * elemento .modal-overlay presente no documento.
 *
 * Também cuida de acessibilidade de teclado: ao abrir, o foco vai para o
 * primeiro campo do modal; Tab/Shift+Tab ficam presos dentro dele
 * (focus trap); ao fechar, o foco volta pra quem abriu o modal.
 * ============================================================================
 */

let lastFocusedElement = null;

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

  lastFocusedElement = document.activeElement;
  overlayEl.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  getFocusableElements(overlayEl)[0]?.focus();
}

/**
 * Fecha um modal e devolve o foco para o elemento que o abriu.
 * @param {HTMLElement} overlayEl
 */
export function closeModal(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.remove('is-open');
  document.body.style.overflow = '';

  lastFocusedElement?.focus?.();
  lastFocusedElement = null;
}

/**
 * Liga o comportamento padrão de um overlay: clique fora do card, botão
 * com data-action="close-modal", tecla Esc, e o focus trap do Tab.
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
    if (!overlayEl.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      closeModal(overlayEl);
      return;
    }

    if (event.key === 'Tab') {
      trapFocus(event, overlayEl);
    }
  });
}

function trapFocus(event, overlayEl) {
  const focusable = getFocusableElements(overlayEl);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function getFocusableElements(overlayEl) {
  return Array.from(
    overlayEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  ).filter((el) => !el.disabled && el.offsetParent !== null);
}
