/**
 * sidebar.js
 * ============================================================================
 * Comportamento do componente Sidebar (App Shell — desktop).
 *
 * As duas responsabilidades originalmente previstas para este arquivo já
 * são cobertas por outros módulos, implementados na Fase 5:
 *
 *  - Marcar o item ativo (aria-current="page") → feito por
 *    js/router.js -> setActiveNavItem(), que atualiza sidebar e
 *    bottom-navigation juntas a cada troca de rota.
 *  - Clique em "Sair" (data-action="logout") → coberto pela delegação
 *    global de eventos em js/app.js -> bindGlobalActions(), que escuta
 *    [data-action="logout"] em qualquer lugar do documento.
 *
 * Este arquivo não precisa de código próprio: nenhuma responsabilidade
 * ficou sem dono, ela só migrou para um local mais central — evitar duas
 * fontes de verdade para a mesma lógica é intencional.
 * ============================================================================
 */
