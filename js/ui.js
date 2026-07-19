/**
 * ui.js
 * ============================================================================
 * Utilitários de interface compartilhados entre telas.
 *
 * Responsabilidades futuras:
 *  - Orquestrar os componentes de overlay globais, montados em
 *    #modal-root, #bottom-sheet-root e #toast-root (ver index.html):
 *      - components/modal        → abrir/fechar modais
 *      - components/bottom-sheet → abrir/fechar bottom sheets
 *      - components/toast        → exibir notificações temporárias
 *      - components/loader       → exibir estado de carregamento
 *  - Alternar a sidebar em mobile (chamado pelo components/header).
 *  - Fornecer helpers de manipulação de DOM usados por múltiplos módulos
 *    de tela (dashboard.js, transactions.js, etc.).
 *
 * Status: 🚧 Não implementado — fase atual: App Shell (arquitetura).
 * Depende de: components/modal, components/bottom-sheet, components/toast, components/loader
 * ============================================================================
 */
