/**
 * auth.js
 * ============================================================================
 * Estado de autenticação da aplicação — mantém em memória o usuário/sessão
 * atual e notifica outros módulos (router.js) sempre que esse estado muda.
 *
 * Diferente de services/auth.service.js (que só fala com o Supabase), este
 * arquivo é a "fonte da verdade" que o resto do app consulta para saber se
 * há alguém autenticado, sem precisar chamar o Supabase de novo a cada
 * verificação.
 * ============================================================================
 */

import * as authService from '../services/auth.service.js';

let currentSession = null;
let currentUser = null;
const listeners = new Set();

/** Notifica todos os módulos inscritos (ex.: router.js) da mudança de estado. */
function notify() {
  listeners.forEach((callback) => callback({ session: currentSession, user: currentUser }));
}

/**
 * Recupera a sessão existente (se houver) e começa a escutar mudanças
 * futuras de autenticação. Deve ser chamado uma única vez, no bootstrap da
 * aplicação (ver js/app.js), antes de iniciar o roteamento.
 * @returns {Promise<object|null>} o usuário autenticado, se houver
 */
export async function initAuth() {
  try {
    const { session } = await authService.getSession();
    currentSession = session;
    currentUser = session?.user ?? null;
  } catch (error) {
    console.error('[auth] Falha ao recuperar sessão:', error?.message ?? error);
    currentSession = null;
    currentUser = null;
  }

  try {
    authService.onAuthStateChange((_event, session) => {
      currentSession = session;
      currentUser = session?.user ?? null;
      notify();
    });
  } catch (error) {
    console.error('[auth] Falha ao registrar listener de autenticação:', error?.message ?? error);
  }

  notify();
  return currentUser;
}

/** @returns {boolean} true se houver um usuário autenticado */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Retorna o usuário em cache (atualizado automaticamente pelo listener
 * registrado em initAuth). Para forçar uma nova consulta ao Supabase, use
 * services/auth.service.js -> getCurrentUser().
 * @returns {object|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Inscreve um callback para ser chamado sempre que o estado de
 * autenticação mudar (login, logout, refresh de token).
 * @param {(state: { session: object|null, user: object|null }) => void} callback
 * @returns {() => void} função para cancelar a inscrição
 */
export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Autentica um usuário existente. O estado interno é atualizado
 * automaticamente pelo listener registrado em initAuth assim que o
 * Supabase confirmar o login.
 * @param {string} email
 * @param {string} password
 */
export async function login(email, password) {
  await authService.signIn(email, password);
}

/**
 * Cria uma nova conta. Retorna { user, session } para a tela de cadastro
 * decidir a mensagem certa: se "session" vier vazia, o projeto Supabase
 * exige confirmação de e-mail antes do primeiro login.
 * @param {string} email
 * @param {string} password
 */
export async function register(email, password) {
  return authService.signUp(email, password);
}

/** Encerra a sessão atual. */
export async function logout() {
  await authService.signOut();
}
