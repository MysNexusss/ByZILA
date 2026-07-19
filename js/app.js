/**
 * app.js
 * ============================================================================
 * Ponto de entrada da aplicação Nexora Financial.
 *
 * Responsabilidades futuras:
 *  - Aguardar o DOM estar pronto e inicializar o App Shell (header,
 *    sidebar, bottom-navigation) chamando seus respectivos init*().
 *  - Inicializar router.js e disparar a renderização da rota inicial
 *    dentro de #route-outlet.
 *  - Registrar o Service Worker da PWA.
 *
 * Ordem de inicialização prevista:
 *  1. config.js   → carrega constantes/credenciais públicas
 *  2. supabase.js → instancia o client
 *  3. auth.js     → verifica sessão atual
 *  4. ui.js       → prepara utilitários de interface (modal, toast, loader)
 *  5. router.js   → inicia o roteamento e renderiza a rota atual
 *
 * Status: 🚧 Não implementado — fase atual: App Shell (arquitetura).
 * Depende de: config.js, supabase.js, auth.js, router.js, ui.js
 * ============================================================================
 */
