/**
 * input.js
 * ============================================================================
 * Comportamento e validação visual do componente Input.
 * ============================================================================
 */

/**
 * Marca um campo como inválido, exibindo a mensagem de erro associada.
 * Espera um elemento <span class="hint hint--error" data-error-for="ID">
 * logo após o input (ver pages/login.html para um exemplo).
 * @param {HTMLInputElement} inputEl
 * @param {string} message
 */
export function setFieldError(inputEl, message) {
  inputEl.classList.add('input--error');
  inputEl.setAttribute('aria-invalid', 'true');

  const hint = document.querySelector(`[data-error-for="${inputEl.id}"]`);
  if (hint) {
    hint.textContent = message;
    hint.hidden = false;
  }
}

/**
 * Remove o estado de erro de um campo.
 * @param {HTMLInputElement} inputEl
 */
export function clearFieldError(inputEl) {
  inputEl.classList.remove('input--error');
  inputEl.removeAttribute('aria-invalid');

  const hint = document.querySelector(`[data-error-for="${inputEl.id}"]`);
  if (hint) {
    hint.hidden = true;
    hint.textContent = '';
  }
}

/**
 * Validação simples de formato de e-mail (client-side apenas — a
 * validação definitiva sempre acontece no Supabase).
 * @param {string} value
 * @returns {boolean}
 */
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
