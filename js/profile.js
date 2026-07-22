/**
 * profile.js
 * ============================================================================
 * Estado do perfil do usuário, compartilhado por toda a aplicação —
 * diferente das demais telas (Dashboard, Transações, Metas, Dívidas),
 * o perfil precisa ser conhecido fora da própria página: o header exibe
 * o nome/avatar em qualquer tela autenticada, e o tema precisa ser
 * aplicado assim que o perfil carrega. Por isso este arquivo segue o
 * mesmo padrão de js/auth.js — um estado em memória, com inscrição para
 * mudanças — em vez de virar só um comentário como os outros js/X.js.
 * ============================================================================
 */

import * as auth from './auth.js';
import * as profileService from '../services/profile.service.js';
import { applyTheme } from './utils.js';

let currentProfile = null;
const listeners = new Set();

function notify() {
  listeners.forEach((callback) => callback(currentProfile));
}

/**
 * Registra a reação a mudanças de autenticação (recarrega o perfil ao
 * logar, limpa ao deslogar) e carrega o perfil imediatamente se já
 * houver uma sessão ativa. Chamado uma única vez, no bootstrap da
 * aplicação (ver js/app.js), depois de initAuth().
 */
export async function initProfile() {
  auth.onAuthChange(({ user }) => {
    if (user) {
      refreshProfile();
    } else {
      currentProfile = null;
      notify();
    }
  });

  if (auth.isAuthenticated()) {
    await refreshProfile();
  }
}

/**
 * Busca o perfil do usuário atual no Supabase, atualiza o estado em
 * memória, aplica o tema salvo, e notifica os inscritos (ex.: o header).
 * Chamado também depois de qualquer edição no perfil, para manter tudo
 * sincronizado sem precisar recarregar a página.
 * @returns {Promise<object|null>}
 */
export async function refreshProfile() {
  const user = auth.getCurrentUser();
  if (!user) {
    currentProfile = null;
    notify();
    return null;
  }

  try {
    currentProfile = await profileService.getMyProfile(user.id);
    if (currentProfile?.theme) applyTheme(currentProfile.theme);
  } catch (error) {
    console.error('[profile] Falha ao carregar perfil:', error?.message ?? error);
  }

  notify();
  return currentProfile;
}

/**
 * Retorna o perfil em cache (atualizado automaticamente pelo listener
 * registrado em initProfile). Para forçar uma nova consulta ao Supabase,
 * use refreshProfile().
 * @returns {object|null}
 */
export function getProfile() {
  return currentProfile;
}

/**
 * Inscreve um callback para ser chamado sempre que o perfil mudar
 * (carregado, atualizado, ou limpo no logout).
 * @param {(profile: object|null) => void} callback
 * @returns {() => void} função para cancelar a inscrição
 */
export function onProfileChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}
