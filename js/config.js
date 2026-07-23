/**
 * config.js
 * ============================================================================
 * Configurações globais e constantes da aplicação ByZIFA.
 *
 * Como o projeto é 100% estático (hospedado no GitHub Pages), não existe
 * servidor para guardar segredos — por isso, SOMENTE a chave pública
 * "anon" do Supabase pode viver aqui. Ela é segura para expor no client
 * porque toda a proteção real dos dados é feita por Row Level Security
 * (RLS), configurado nas policies em /sql. NUNCA coloque a "service_role
 * key" neste arquivo.
 * ============================================================================
 */

/**
 * URL do projeto Supabase.
 * Encontrada em: Supabase Dashboard > Project Settings > API > Project URL
 * @type {string}
 */
export const SUPABASE_URL = 'https://eywnprmdysfspbbkicfv.supabase.co';

/**
 * Chave pública (anon/publishable) do Supabase.
 * Encontrada em: Supabase Dashboard > Project Settings > API > anon public
 * @type {string}
 */
export const SUPABASE_ANON_KEY = 'sb_publishable_kHwLL5rzJqAlNmveDA0Lsg_7x1jZmWe';

/**
 * Configurações gerais da aplicação, sem relação com o Supabase.
 * Centralizadas aqui para evitar valores "mágicos" espalhados pelo código.
 */
export const APP_CONFIG = {
  name: 'ByZIFA',
  version: '0.3.0',

  // Chaves usadas para persistir dados no localStorage/sessionStorage
  // (uso futuro — nenhum módulo grava nelas ainda).
  storageKeys: {
    session: 'nexora_session',
    theme: 'nexora_theme',
  },
};
