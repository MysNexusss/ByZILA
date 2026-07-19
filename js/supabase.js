/**
 * supabase.js
 * ============================================================================
 * Inicialização do cliente Supabase — ponto único de acesso ao SDK para
 * todo o restante da aplicação (services, repositories).
 *
 * Nenhuma consulta ao banco ou lógica de autenticação acontece aqui.
 * Este arquivo faz apenas três coisas: (1) carregar o SDK, (2) validar a
 * configuração, (3) criar e exportar a instância do client.
 * ============================================================================
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
// Alternativa, caso o jsDelivr apresente problema de resolução de módulos:
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

/**
 * Verifica se as credenciais em config.js foram preenchidas.
 * Evita que o app quebre silenciosamente com uma URL/chave de exemplo.
 * @throws {Error} se a URL ou a chave ainda estiverem com o valor placeholder.
 */
function assertConfigIsValid() {
  if (!SUPABASE_URL || SUPABASE_URL.includes('SEU-PROJETO')) {
    throw new Error(
      '[supabase.js] SUPABASE_URL não configurada. Edite js/config.js com a URL do seu projeto Supabase.'
    );
  }

  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('SUA_CHAVE')) {
    throw new Error(
      '[supabase.js] SUPABASE_ANON_KEY não configurada. Edite js/config.js com a chave anon do seu projeto Supabase.'
    );
  }
}

/**
 * Instância única (singleton) do client Supabase, usada por toda a
 * aplicação. Permanece `null` se a configuração for inválida — módulos
 * que a consomem devem verificar isso antes de usar.
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export let supabase = null;

try {
  assertConfigIsValid();

  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,   // mantém a sessão entre recarregamentos de página
      autoRefreshToken: true, // renova o token automaticamente antes de expirar
    },
  });
} catch (error) {
  // Tratamento básico de erro: a aplicação não quebra, mas o problema
  // fica registrado de forma clara no console para quem for configurar.
  console.error(error.message);
}

/**
 * Helper genérico para tratar o formato padrão de resposta do Supabase
 * ({ data, error }). Centraliza o tratamento de erro para que
 * repositories/ não precisem repetir essa lógica em cada consulta futura.
 *
 * @template T
 * @param {{ data: T, error: object|null }} response
 * @returns {T} os dados da resposta, caso não haja erro
 * @throws {object} o erro retornado pelo Supabase, caso exista
 */
export function handleResponse({ data, error }) {
  if (error) {
    console.error('[Supabase]', error.message ?? error);
    throw error;
  }
  return data;
}
