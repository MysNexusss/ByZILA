/**
 * pwa.js
 * ============================================================================
 * Tudo relacionado a "app instalável": registro do Service Worker (com
 * atualização automática), prompt de instalação (Add to Home Screen), e
 * aviso de conectividade (offline/online).
 * ============================================================================
 */

import { showToast } from '../components/toast/toast.js';

let deferredInstallPrompt = null;

/**
 * Registra o Service Worker. Quando uma nova versão é detectada, ela é
 * ativada imediatamente (sem esperar todas as abas fecharem) e a página
 * recarrega sozinha assim que a troca acontece.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('sw.js');

      // Cobre o caso de já existir uma atualização esperando de uma
      // sessão anterior (a aba foi fechada antes dela ser aplicada).
      if (registration.waiting && navigator.serviceWorker.controller) {
        notifyUpdateAndActivate(registration);
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          const isUpdate = newWorker.state === 'installed' && navigator.serviceWorker.controller;
          if (isUpdate) {
            notifyUpdateAndActivate(registration);
          }
        });
      });
    } catch (error) {
      console.error('[pwa] Falha ao registrar o Service Worker:', error);
    }
  });

  let hasReloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hasReloaded) return; // evita loop de reload caso o evento dispare mais de uma vez
    hasReloaded = true;
    window.location.reload();
  });
}

function notifyUpdateAndActivate(registration) {
  showToast('Nova versão disponível. Atualizando...', 'info');
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

/**
 * Escuta o evento de instalação do navegador (Add to Home Screen) e
 * exibe/liga o botão de instalação quando disponível.
 */
export function initInstallPrompt() {
  const installButton = document.getElementById('pwa-install-btn');
  if (!installButton) return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener('click', async () => {
    if (!deferredInstallPrompt) return;

    installButton.hidden = true;
    deferredInstallPrompt.prompt();

    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') {
      showToast('ByZIFA instalado com sucesso.', 'success');
    }
    deferredInstallPrompt = null;
  });

  window.addEventListener('appinstalled', () => {
    installButton.hidden = true;
    deferredInstallPrompt = null;
  });
}

/**
 * Exibe uma barra persistente enquanto o usuário estiver offline, e
 * avisos rápidos (toast) nas transições de conectividade.
 */
export function initConnectivityWatcher() {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;

  function updateBanner() {
    banner.hidden = navigator.onLine;
  }

  window.addEventListener('online', () => {
    updateBanner();
    showToast('Conexão restabelecida.', 'success');
  });

  window.addEventListener('offline', () => {
    updateBanner();
    showToast('Você está offline. Alguns dados podem estar desatualizados.', 'danger');
  });

  updateBanner();
}

/** Inicializa todas as funcionalidades de PWA. Chamado por js/app.js. */
export function initPWA() {
  registerServiceWorker();
  initInstallPrompt();
  initConnectivityWatcher();
}
