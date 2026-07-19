/**
 * register.js
 * ============================================================================
 * Controlador da tela de Cadastro. router.js chama init() logo depois de
 * injetar pages/register.html em #route-outlet.
 * ============================================================================
 */

import { register } from '../js/auth.js';
import { showToast } from '../components/toast/toast.js';
import { setFieldError, clearFieldError, isValidEmail } from '../components/input/input.js';
import { setButtonLoading } from '../components/button/button.js';

/** Mensagens amigáveis para os erros mais comuns do Supabase Auth. */
const AUTH_ERROR_MESSAGES = {
  'User already registered': 'Este e-mail já está cadastrado.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
};

function translateError(error) {
  return AUTH_ERROR_MESSAGES[error?.message] ?? error?.message ?? 'Não foi possível concluir o cadastro. Tente novamente.';
}

function validate(form) {
  let isValid = true;
  const { email, password, passwordConfirm } = form.elements;

  clearFieldError(email);
  clearFieldError(password);
  clearFieldError(passwordConfirm);

  if (!email.value.trim()) {
    setFieldError(email, 'Informe seu e-mail.');
    isValid = false;
  } else if (!isValidEmail(email.value)) {
    setFieldError(email, 'E-mail em formato inválido.');
    isValid = false;
  }

  if (!password.value) {
    setFieldError(password, 'Crie uma senha.');
    isValid = false;
  } else if (password.value.length < 6) {
    setFieldError(password, 'A senha deve ter pelo menos 6 caracteres.');
    isValid = false;
  }

  if (passwordConfirm.value !== password.value) {
    setFieldError(passwordConfirm, 'As senhas não coincidem.');
    isValid = false;
  }

  return isValid;
}

async function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;

  if (!validate(form)) return;

  const submitButton = document.getElementById('register-submit');
  setButtonLoading(submitButton, true);

  try {
    const { session } = await register(form.elements.email.value.trim(), form.elements.password.value);

    if (session) {
      showToast('Conta criada com sucesso.', 'success');
      // Sessão já ativa — a navegação para o dashboard é automática
      // (ver js/auth.js e router.js).
    } else {
      // Projeto Supabase configurado para exigir confirmação de e-mail.
      showToast('Conta criada! Verifique seu e-mail para confirmar o cadastro.', 'success', 6000);
      window.location.hash = '/login';
    }
  } catch (error) {
    showToast(translateError(error), 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  document.getElementById('register-form')?.addEventListener('submit', handleSubmit);
}
