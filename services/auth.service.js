/**
 * auth.service.js
 * ============================================================================
 * Camada de serviço de autenticação — único módulo que chama
 * supabase.auth diretamente. js/auth.js consome estas funções e mantém o
 * estado de autenticação da aplicação; nenhum outro módulo deve importar
 * este arquivo diretamente.
 * ============================================================================
 */

import { supabase, handleResponse } from '../js/supabase.js';

/**
 * Garante que o client do Supabase foi inicializado corretamente antes de
 * qualquer chamada — evita um erro genérico do tipo "Cannot read
 * properties of null" quando js/config.js ainda não foi preenchido.
 */
function ensureClient() {
  if (!supabase) {
    throw new Error('Cliente Supabase não inicializado. Verifique as credenciais em js/config.js.');
  }
}

/**
 * Cria uma nova conta de usuário.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object|null, session: object|null }>}
 */
export async function signUp(email, password) {
  ensureClient();
  return handleResponse(await supabase.auth.signUp({ email, password }));
}

/**
 * Autentica um usuário existente.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: object, session: object }>}
 */
export async function signIn(email, password) {
  ensureClient();
  return handleResponse(await supabase.auth.signInWithPassword({ email, password }));
}

/**
 * Encerra a sessão do usuário atual.
 * @returns {Promise<void>}
 */
export async function signOut() {
  ensureClient();
  return handleResponse(await supabase.auth.signOut());
}

/**
 * Retorna a sessão atual armazenada, se houver.
 * @returns {Promise<{ session: object|null }>}
 */
export async function getSession() {
  ensureClient();
  return handleResponse(await supabase.auth.getSession());
}

/**
 * Retorna os dados do usuário autenticado, consultando o Supabase
 * diretamente (diferente de js/auth.js -> getCurrentUser(), que retorna
 * um valor em cache, sem round-trip ao servidor).
 * @returns {Promise<{ user: object|null }>}
 */
export async function getCurrentUser() {
  ensureClient();
  return handleResponse(await supabase.auth.getUser());
}

/**
 * Registra um listener para mudanças no estado de autenticação (login,
 * logout, renovação de token). Usado internamente por js/auth.js.
 * @param {(event: string, session: object|null) => void} callback
 * @returns {{ unsubscribe: () => void }}
 */
export function onAuthStateChange(callback) {
  ensureClient();
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}

/**
 * Atualiza a senha do usuário autenticado.
 * @param {string} newPassword
 * @returns {Promise<{ user: object }>}
 */
export async function updatePassword(newPassword) {
  ensureClient();
  return handleResponse(await supabase.auth.updateUser({ password: newPassword }));
}
