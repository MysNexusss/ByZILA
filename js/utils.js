/**
 * utils.js
 * ============================================================================
 * Funções utilitárias puras, sem dependência de estado.
 * ============================================================================
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * Formata um valor numérico como moeda (R$) — usado em todo elemento
 * .amount ("Ledger Numerals") do Design System.
 * @param {number|string} value
 * @returns {string}
 */
export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

/**
 * Formata uma data (string "aaaa-mm-dd" ou Date) no padrão dd/mm/aaaa.
 * @param {string|Date} value
 * @returns {string}
 */
export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
}

/**
 * Escapa caracteres HTML especiais antes de inserir texto vindo do banco
 * de dados via innerHTML — evita injeção de HTML/script a partir de
 * descrições de transações, títulos de metas/dívidas, etc.
 * @param {string} value
 * @returns {string}
 */
export function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

/* --------------------------------------------------------------------
   Tema (claro/escuro/sistema)
   -------------------------------------------------------------------- */

const THEME_STORAGE_KEY = 'nexora_theme'; // igual a APP_CONFIG.storageKeys.theme

/**
 * Resolve a preferência salva ("light" | "dark" | "system") para um
 * valor concreto de aplicação ("light" | "dark"), consultando a
 * preferência do sistema operacional quando necessário.
 * @param {string} preference
 * @returns {'light'|'dark'}
 */
export function resolveTheme(preference) {
  if (preference === 'dark' || preference === 'light') return preference;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Aplica o tema no documento (via atributo data-theme em <html>, usado
 * pelos overrides em css/variables.css) e persiste a preferência em
 * localStorage, para leitura rápida e síncrona no próximo carregamento
 * (ver o <script> inline em index.html).
 * @param {string} preference - "light" | "dark" | "system"
 */
export function applyTheme(preference) {
  document.documentElement.dataset.theme = resolveTheme(preference);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // localStorage indisponível (modo privado, etc.) — o tema ainda
    // funciona na sessão atual, só não persiste entre recarregamentos.
  }
}

/**
 * Lê a preferência de tema salva localmente. Usado no boot do app, antes
 * do perfil (que vem do Supabase) estar disponível.
 * @returns {string}
 */
export function getStoredThemePreference() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
}
