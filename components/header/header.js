/**
 * header.js
 * ============================================================================
 * Comportamento do componente Header (App Shell). Nesta fase, sua única
 * responsabilidade real é refletir o perfil do usuário no avatar — as
 * outras responsabilidades documentadas para este arquivo (menu mobile,
 * notificações, menu de usuário) seguem sem funcionalidade, fora do
 * escopo da Fase 11.
 * ============================================================================
 */

import { onProfileChange, getProfile } from '../../js/profile.js';

function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function renderAvatar(profile) {
  const avatarEl = document.querySelector('.header-user .avatar');
  if (!avatarEl) return;

  if (profile?.avatar_url) {
    avatarEl.style.backgroundImage = `url("${profile.avatar_url}?v=${encodeURIComponent(profile.updated_at ?? '')}")`;
    avatarEl.style.backgroundSize = 'cover';
    avatarEl.style.backgroundPosition = 'center';
    avatarEl.textContent = '';
  } else {
    avatarEl.style.backgroundImage = '';
    avatarEl.textContent = initials(profile?.full_name);
  }
}

/**
 * Liga o header ao estado global do perfil (ver js/profile.js). Chamado
 * uma única vez, no bootstrap da aplicação (ver js/app.js).
 */
export function initHeader() {
  onProfileChange(renderAvatar);
  renderAvatar(getProfile());
}
