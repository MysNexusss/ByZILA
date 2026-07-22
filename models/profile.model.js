/**
 * profile.model.js
 * ============================================================================
 * Definição da forma dos dados do Perfil (tabela "profiles" no Supabase).
 * Apenas forma/constantes — nenhuma validação ou cálculo pertence a este
 * arquivo (isso é responsabilidade de services/profile.service.js).
 *
 * @typedef {Object} Profile
 * @property {string} id             - igual ao id em auth.users
 * @property {string|null} full_name
 * @property {string|null} avatar_url
 * @property {string|null} phone
 * @property {string} currency
 * @property {string} language
 * @property {string} theme          - "light" | "dark" | "system"
 * @property {string} created_at     - formato ISO 8601
 * @property {string} updated_at     - formato ISO 8601
 * ============================================================================
 */

export const THEME_OPTIONS = Object.freeze(['light', 'dark', 'system']);
export const CURRENCY_OPTIONS = Object.freeze(['BRL', 'USD', 'EUR']);
export const LANGUAGE_OPTIONS = Object.freeze(['pt-BR', 'en-US', 'es-ES']);
