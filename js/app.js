/**
 * app.js
 * ============================================================================
 * Ponto de entrada da aplicação ByZIFA.
 * ============================================================================
 */

import { initAuth, logout } from './auth.js';
import { initProfile } from './profile.js';
import { initRouter } from './router.js';
import { initPWA } from './pwa.js';
import { applyTheme, getStoredThemePreference } from './utils.js';
import { initHeader } from '../components/header/header.js';
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

/**
 * Reaplica o tema automaticamente quando o sistema operacional muda de
 * claro para escuro (ou vice-versa) enquanto o app está aberto — só tem
 * efeito quando a preferência salva é "system".
 */
function bindSystemThemeListener() {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getStoredThemePreference() === 'system') {
      applyTheme('system');
    }
  });
}

async function bootstrap() {
  applyTheme(getStoredThemePreference()); // evita flash de tema errado (ver também o <script> inline em index.html)
  bindSystemThemeListener();
  bindGlobalActions();
  initPWA(); // registra o Service Worker, o prompt de instalação e o aviso de offline

  await initAuth();    // recupera a sessão existente (se houver) antes de rotear
  await initProfile();  // carrega o perfil (se autenticado) e passa a reagir a mudanças de sessão
  initHeader();          // liga o avatar do header ao estado do perfil

  initRouter();           // decide qual tela mostrar com base no estado de autenticação
}

bootstrap();
