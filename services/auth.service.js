/**
 * auth.service.js
 * ============================================================================
 * Camada de serviço de autenticação — ponto único que as futuras telas
 * (login, cadastro, perfil) vão chamar para lidar com o usuário.
 *
 * IMPORTANTE: este arquivo define apenas o CONTRATO das funções (nomes,
 * parâmetros, retorno documentado via JSDoc). Nenhuma delas chama o
 * Supabase de fato ainda — cada uma lança um erro "não implementado".
 * A implementação real fica para uma fase futura, quando login e
 * cadastro forem construídos.
 * ============================================================================
 */

import { supabase } from '../js/supabase.js';

/**
 * Cria uma nova conta de usuário.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} o usuário criado
 */
export async function signUp(email, password) {
  // Futuro: return handleResponse(await supabase.auth.signUp({ email, password }));
  throw new Error('[auth.service] signUp ainda não implementado.');
}

/**
 * Autentica um usuário já cadastrado.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<object>} a sessão autenticada
 */
export async function signIn(email, password) {
  // Futuro: return handleResponse(await supabase.auth.signInWithPassword({ email, password }));
  throw new Error('[auth.service] signIn ainda não implementado.');
}

/**
 * Encerra a sessão do usuário atual.
 * @returns {Promise<void>}
 */
export async function signOut() {
  // Futuro: return handleResponse(await supabase.auth.signOut());
  throw new Error('[auth.service] signOut ainda não implementado.');
}

/**
 * Retorna a sessão atual armazenada, se houver.
 * @returns {Promise<object|null>}
 */
export async function getSession() {
  // Futuro: return handleResponse(await supabase.auth.getSession());
  throw new Error('[auth.service] getSession ainda não implementado.');
}

/**
 * Retorna os dados do usuário autenticado atual, se houver.
 * @returns {Promise<object|null>}
 */
export async function getCurrentUser() {
  // Futuro: return handleResponse(await supabase.auth.getUser());
  throw new Error('[auth.service] getCurrentUser ainda não implementado.');
}

/**
 * Registra um listener para mudanças no estado de autenticação
 * (login, logout, renovação de token). Usado futuramente por router.js
 * para proteger rotas privadas.
 * @param {(event: string, session: object|null) => void} callback
 * @returns {{ unsubscribe: () => void }}
 */
export function onAuthStateChange(callback) {
  // Futuro: return supabase.auth.onAuthStateChange(callback);
  throw new Error('[auth.service] onAuthStateChange ainda não implementado.');
}
