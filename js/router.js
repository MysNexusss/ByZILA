/**
 * router.js
 * ============================================================================
 * Roteador client-side (hash-based) da aplicação.
 *
 * Necessário porque o GitHub Pages serve arquivos estáticos e não suporta
 * roteamento server-side: a navegação entre telas será feita via #hash,
 * sem recarregar a página.
 *
 * Rotas previstas (definidas nos atributos data-route de sidebar.html e
 * bottom-navigation.html):
 *   #/dashboard    → dashboard.js
 *   #/transacoes   → transactions.js
 *   #/estatisticas → statistics.js
 *   #/metas        → goals.js
 *   #/dividas      → debts.js
 *   #/perfil       → profile.js
 *
 * Responsabilidades futuras:
 *  - Mapear cada rota ao módulo de tela correspondente.
 *  - Renderizar o conteúdo da rota ativa dentro de #route-outlet
 *    (ver index.html, dentro de .app-main).
 *  - Atualizar o aria-current="page" no item ativo da sidebar e da
 *    bottom-navigation.
 *  - Aplicar guardas de autenticação (redirecionar para login se não
 *    houver sessão).
 *
 * Status: 🚧 Não implementado — fase atual: App Shell (arquitetura).
 * Depende de: auth.js, ui.js
 * ============================================================================
 */
