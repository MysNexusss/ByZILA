/**
 * toast.js
 * ============================================================================
 * Notificações temporárias, injetadas em #toast-root (ver index.html).
 * ============================================================================
 */

const DEFAULT_DURATION_MS = 4000;

function getContainer() {
  const root = document.getElementById('toast-root');
  let container = root.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    root.appendChild(container);
  }
  return container;
}

/**
 * Exibe uma notificação temporária.
 * @param {string} message
 * @param {'info'|'success'|'danger'} [type='info']
 * @param {number} [duration=4000]
 */
export function showToast(message, type = 'info', duration = DEFAULT_DURATION_MS) {
  const container = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'status');

  const messageEl = document.createElement('span');
  messageEl.className = 'toast-message';
  messageEl.textContent = message;
  toast.appendChild(messageEl);

  container.appendChild(toast);

  setTimeout(() => toast.remove(), duration);
}
