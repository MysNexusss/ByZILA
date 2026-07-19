/**
 * app.js
 * ============================================================================
 * Ponto de entrada da aplicação Nexora Financial.
 * ============================================================================
 */

import { initAuth, logout } from './auth.js';
import { initRouter } from './router.js';
import { showToast } from '../components/toast/toast.js';

/**
 * Delegação global de clique para qualquer botão de logout do App Shell
 * (sidebar, bottom navigation, ou telas futuras) — um único listener cobre
 * todos, inclusive elementos injetados dinamicamente pelo router.
 */
function bindGlobalActions() {
  document.addEventListener('click', async (event) => {
    const trigger = event.target.closest('[data-action="logout"]');
    if (!trigger) return;

    try {
      await logout();
      showToast('Sessão encerrada.', 'info');
    } catch (error) {
      console.error('[app] Falha ao sair:', error);
      showToast('Não foi possível sair. Tente novamente.', 'danger');
    }
  });
}

async function bootstrap() {
  bindGlobalActions();
  await initAuth(); // recupera a sessão existente (se houver) antes de rotear
  initRouter();      // decide qual tela mostrar com base no estado de autenticação
}

bootstrap();
