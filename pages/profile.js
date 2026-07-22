/**
 * profile.js
 * ============================================================================
 * Controlador da tela de Perfil. router.js chama init() logo depois de
 * injetar pages/profile.html em #route-outlet.
 *
 * Os dados do card "Informações pessoais" são renderizados via JS (em
 * vez de já vir prontos no HTML) para permitir o skeleton enquanto o
 * perfil carrega — o card "Segurança" é sempre o mesmo formulário vazio,
 * por isso ele já vem pronto em pages/profile.html.
 * ============================================================================
 */

import * as profileService from '../services/profile.service.js';
import { getCurrentUser, changePassword } from '../js/auth.js';
import { getProfile, refreshProfile } from '../js/profile.js';
import { applyTheme, escapeHtml } from '../js/utils.js';
import { showToast } from '../components/toast/toast.js';
import { setFieldError, clearFieldError } from '../components/input/input.js';
import { setButtonLoading } from '../components/button/button.js';

/* --------------------------------------------------------------------
   Card "Informações pessoais" — skeleton e formulário
   -------------------------------------------------------------------- */

function renderInfoSkeleton() {
  document.getElementById('profile-info-body').innerHTML = `
    <div class="profile-avatar-row">
      <div class="skeleton skeleton-avatar" style="width: 72px; height: 72px;"></div>
      <div class="skeleton skeleton-text" style="width: 120px;"></div>
    </div>
    <div class="stack" style="--stack-gap: var(--space-4); margin-top: var(--space-6);">
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 80%;"></div>
      <div class="skeleton skeleton-text" style="width: 60%;"></div>
      <div class="skeleton skeleton-text" style="width: 90%;"></div>
    </div>
  `;
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

function renderAvatarPreview(profile) {
  const el = document.getElementById('profile-avatar-preview');
  if (!el) return;

  if (profile?.avatar_url) {
    el.style.backgroundImage = `url("${profile.avatar_url}?v=${encodeURIComponent(profile.updated_at ?? '')}")`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    el.textContent = '';
  } else {
    el.style.backgroundImage = '';
    el.textContent = initials(profile?.full_name);
  }
}

function renderInfoForm(profile, email) {
  document.getElementById('profile-info-body').innerHTML = `
    <div class="profile-avatar-row">
      <div class="avatar avatar--gold profile-avatar-preview" id="profile-avatar-preview"></div>
      <div>
        <button class="btn btn--outline btn--sm" type="button" id="avatar-upload-btn">Alterar foto</button>
        <input type="file" id="avatar-file-input" accept="image/png,image/jpeg,image/webp" hidden>
        <p class="hint">JPG, PNG ou WEBP · máx. 2MB</p>
      </div>
    </div>

    <form id="profile-form" novalidate>
      <div class="stack" style="--stack-gap: var(--space-5); margin-top: var(--space-6);">
        <div class="field">
          <label class="label" for="profile-name">Nome completo</label>
          <input class="input" type="text" id="profile-name" placeholder="Seu nome">
          <span class="hint hint--error" data-error-for="profile-name" hidden></span>
        </div>

        <div class="field">
          <label class="label" for="profile-email">E-mail</label>
          <input class="input" type="email" id="profile-email" disabled>
          <span class="hint">O e-mail não pode ser alterado por aqui.</span>
        </div>

        <div class="field">
          <label class="label" for="profile-phone">Telefone (opcional)</label>
          <input class="input" type="tel" id="profile-phone" placeholder="(00) 00000-0000">
          <span class="hint hint--error" data-error-for="profile-phone" hidden></span>
        </div>

        <div class="cluster" style="align-items: flex-start;">
          <div class="field" style="flex: 1; min-width: 140px;">
            <label class="label" for="profile-currency">Moeda padrão</label>
            <select class="select" id="profile-currency">
              <option value="BRL">Real (BRL)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
          <div class="field" style="flex: 1; min-width: 140px;">
            <label class="label" for="profile-language">Idioma</label>
            <select class="select" id="profile-language">
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es-ES">Español</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label class="label">Tema</label>
          <div class="cluster">
            <label class="radio"><input type="radio" name="theme" value="light"> Claro</label>
            <label class="radio"><input type="radio" name="theme" value="dark"> Escuro</label>
            <label class="radio"><input type="radio" name="theme" value="system"> Sistema</label>
          </div>
        </div>

        <button class="btn btn--primary" type="submit" id="profile-submit">Salvar alterações</button>
      </div>
    </form>
  `;

  // Preenchido via propriedade, não via template string — evita qualquer
  // risco de HTML/atributo malformado a partir de dados do usuário.
  document.getElementById('profile-name').value = profile?.full_name || '';
  document.getElementById('profile-email').value = email || '';
  document.getElementById('profile-phone').value = profile?.phone || '';
  document.getElementById('profile-currency').value = profile?.currency || 'BRL';
  document.getElementById('profile-language').value = profile?.language || 'pt-BR';

  const theme = profile?.theme || 'system';
  const themeRadio = document.querySelector(`input[name="theme"][value="${theme}"]`);
  if (themeRadio) themeRadio.checked = true;

  renderAvatarPreview(profile);
  bindInfoFormEvents();
}

async function loadProfileInfo() {
  const cached = getProfile();
  if (cached) {
    renderInfoForm(cached, getCurrentUser()?.email);
    return;
  }

  renderInfoSkeleton();
  try {
    const profile = await refreshProfile();
    renderInfoForm(profile, getCurrentUser()?.email);
  } catch (error) {
    console.error('[profile] Falha ao carregar perfil:', error);
    showToast('Não foi possível carregar seu perfil.', 'danger');
  }
}

/* --------------------------------------------------------------------
   Salvar informações pessoais
   -------------------------------------------------------------------- */

function validateProfileForm() {
  let isValid = true;
  const name = document.getElementById('profile-name');
  const phone = document.getElementById('profile-phone');

  clearFieldError(name);
  clearFieldError(phone);

  if (!name.value.trim()) {
    setFieldError(name, 'Informe seu nome.');
    isValid = false;
  }
  if (phone.value.trim() && !/^[\d\s()+-]{8,20}$/.test(phone.value.trim())) {
    setFieldError(phone, 'Telefone em formato inválido.');
    isValid = false;
  }

  return isValid;
}

async function handleProfileSubmit(event) {
  event.preventDefault();
  if (!validateProfileForm()) return;

  const submitButton = document.getElementById('profile-submit');
  setButtonLoading(submitButton, true);

  try {
    const user = getCurrentUser();
    await profileService.updateProfile(user.id, {
      full_name: document.getElementById('profile-name').value,
      phone: document.getElementById('profile-phone').value,
      currency: document.getElementById('profile-currency').value,
      language: document.getElementById('profile-language').value,
      theme: document.querySelector('input[name="theme"]:checked').value,
    });

    await refreshProfile(); // atualiza o estado global -> header e tema reagem sozinhos
    showToast('Perfil atualizado.', 'success');
  } catch (error) {
    console.error('[profile] Falha ao salvar perfil:', error);
    showToast(error?.message ?? 'Não foi possível salvar o perfil.', 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

/* --------------------------------------------------------------------
   Upload de avatar
   -------------------------------------------------------------------- */

async function handleAvatarChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const user = getCurrentUser();
    await profileService.updateAvatar(user.id, file);
    await refreshProfile();
    renderAvatarPreview(getProfile());
    showToast('Foto de perfil atualizada.', 'success');
  } catch (error) {
    console.error('[profile] Falha ao enviar foto:', error);
    showToast(error?.message ?? 'Não foi possível enviar a foto.', 'danger');
  } finally {
    event.target.value = ''; // permite selecionar o mesmo arquivo de novo, se preciso
  }
}

/* --------------------------------------------------------------------
   Alterar senha
   -------------------------------------------------------------------- */

function validatePasswordForm() {
  let isValid = true;
  const newPassword = document.getElementById('password-new');
  const confirmPassword = document.getElementById('password-confirm');

  clearFieldError(newPassword);
  clearFieldError(confirmPassword);

  if (!newPassword.value || newPassword.value.length < 6) {
    setFieldError(newPassword, 'A senha deve ter pelo menos 6 caracteres.');
    isValid = false;
  }
  if (confirmPassword.value !== newPassword.value) {
    setFieldError(confirmPassword, 'As senhas não coincidem.');
    isValid = false;
  }

  return isValid;
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  if (!validatePasswordForm()) return;

  const submitButton = document.getElementById('password-submit');
  setButtonLoading(submitButton, true);

  try {
    await changePassword(document.getElementById('password-new').value);
    showToast('Senha alterada com sucesso.', 'success');
    document.getElementById('password-form').reset();
  } catch (error) {
    console.error('[profile] Falha ao trocar senha:', error);
    showToast(error?.message ?? 'Não foi possível alterar a senha.', 'danger');
  } finally {
    setButtonLoading(submitButton, false);
  }
}

/* --------------------------------------------------------------------
   Eventos
   -------------------------------------------------------------------- */

/** Liga os eventos do formulário de informações — chamado após cada render, já que o form é recriado via innerHTML. */
function bindInfoFormEvents() {
  document.getElementById('profile-form').addEventListener('submit', handleProfileSubmit);
  document.getElementById('avatar-upload-btn').addEventListener('click', () => {
    document.getElementById('avatar-file-input').click();
  });
  document.getElementById('avatar-file-input').addEventListener('change', handleAvatarChange);

  // Pré-visualização instantânea do tema ao escolher, sem esperar "Salvar".
  document.querySelectorAll('input[name="theme"]').forEach((radio) => {
    radio.addEventListener('change', (event) => applyTheme(event.target.value));
  });
}

/** Card "Segurança" é estático (já vem em pages/profile.html) — ligado uma única vez. */
function bindPasswordFormEvents() {
  document.getElementById('password-form').addEventListener('submit', handlePasswordSubmit);
}

/** Chamado por router.js depois de injetar o HTML desta página. */
export function init() {
  bindPasswordFormEvents();
  loadProfileInfo();
}
