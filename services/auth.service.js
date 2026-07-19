/**
 * auth.service.js
 * ============================================================================
 * Camada de serviço de autenticação — orquestra regras de negócio de auth
 * sobre o Supabase Auth (via js/supabase.js).
 *
 * Diferença entre service e repository:
 *  - Repository: consultas cruas ao banco (CRUD puro).
 *  - Service: regras de negócio, validações e orquestração, consumido
 *    pelas telas (ex.: dashboard.js, profile.js).
 *
 * Responsabilidades futuras:
 *  - login(email, senha)
 *  - cadastrar(dados)
 *  - logout()
 *  - recuperarSenha(email)
 *  - obterUsuarioAtual()
 *
 * Status: 🚧 Não implementado — fase atual: App Shell (arquitetura).
 * Depende de: supabase.js
 * ============================================================================
 */
