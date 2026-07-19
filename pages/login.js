/**
 * login.js
 * ============================================================================
 * Controlador da tela de Login. router.js chama init() logo depois de
 * injetar pages/login.html em #route-outlet.
 * ============================================================================
 */

import { login } from '../js/auth.js';
import { showToast } from '../components/toast/toast.js';
import { setFieldError, clearFieldError, isValidEmail } from '../components/input/input.js';
import { setButtonLoading } from '../components/button/button.js';

/** Mensagens amigáveis para os erros mais comuns do Supabase Auth. */
const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'E-mail ou senha incorretos.',
  'Email not confirmed': 'Confirme seu e-mail antes de entrar.',
};

function translateError(error) {
  return AUTH_ERROR_MESSAGES[error?.message] ?? error?.message ?? 'Não foi possível entrar. Tente novamente.';
}

function validate(form) {
  let isValid = true;
  const { email, password } = form.elements;

  clearFieldError(email);
  clearFieldError(password);

  if (!email.value.trim()) {
    setFieldError(email, 'Informe seu e-mail.');
    isValid = false;
  } else if (!isValidEmail(email.value)) {
    setFieldError(email, 'E-mail em formato inválido.');
    isValid = false;
  }

  if (!password.value) {
    setFieldError(password, 'Informe sua senha.');
    isValid = false;
  }

  return isValid;
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;

  if (!validate(form)) return;

  const submitButton = document.getElementById('login-submit');
  setButtonLoading(submitButton, true);

  try {
    await login(form.elements.email.value.trim(), form.elements.password.value);
    showToast('Login realizado com sucesso.', 'success');
    // A navegação para o dashboard é automática: js/auth.js notifica a
    // mudança de estado e router.js reage a ela (ver initRouter).
  } catch (error) {
    showToast(translateError(error), 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  document.getElementById('login-form')?.addEventListener('submit', handleSubmit);
}
