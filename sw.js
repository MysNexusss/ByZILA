/**
 * sw.js — Service Worker do ByZIFA
 * ============================================================================
 * Service Worker "clássico" (sem type: module — melhor compatibilidade
 * entre navegadores). Responsabilidades:
 *
 *  1. Pré-cachear o App Shell (HTML/CSS/JS essenciais) na instalação.
 *  2. Servir arquivos estáticos com estratégia Cache First.
 *  3. Servir navegação/HTML com estratégia Network First (sempre busca a
 *     versão mais nova quando online; cai pro cache quando offline).
 *  4. NUNCA interceptar chamadas ao Supabase (*.supabase.co) — dados
 *     financeiros e tokens de sessão jamais tocam o Cache Storage.
 *  5. Limpar caches de versões antigas na ativação.
 *  6. Aplicar atualizações assim que o app pedir (mensagem SKIP_WAITING),
 *     sem esperar todas as abas fecharem.
 *
 * Ao alterar a lista SHELL_ASSETS de forma relevante, incremente VERSION
 * — isso cria caches novos e descarta os antigos na próxima ativação.
 * ============================================================================
 */

const VERSION = 'v1';
const SHELL_CACHE = `byzifa-shell-${VERSION}`;
const STATIC_CACHE = `byzifa-static-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE];

/**
 * App Shell: o mínimo necessário para o app abrir e mostrar a tela de
 * login/dashboard offline. Só inclui o que já está de fato referenciado
 * em index.html hoje — as demais telas (pages/*.html) são cacheadas
 * sozinhas, na primeira visita, pela estratégia de runtime abaixo.
 */
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/reset.css',
  './css/layout.css',
  './css/components.css',
  './css/pages.css',
  './css/responsive.css',
  './components/header/header.css',
  './components/sidebar/sidebar.css',
  './components/bottom-navigation/bottom-navigation.css',
  './components/input/input.css',
  './components/toast/toast.css',
  './components/loader/loader.css',
  './components/empty-state/empty-state.css',
  './components/skeleton/skeleton.css',
  './components/modal/modal.css',
  './components/chart-card/chart-card.css',
  './js/app.js',
  './js/router.js',
  './js/auth.js',
  './js/profile.js',
  './js/supabase.js',
  './js/config.js',
  './js/utils.js',
  './js/pwa.js',
  './components/header/header.js',
  './components/toast/toast.js',
  './assets/images/brand-mark.png',
  './assets/icons/icon-192.png',
];

/* --------------------------------------------------------------------
   Instalação — pré-cacheia o App Shell.
   -------------------------------------------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Promise.allSettled em vez de cache.addAll(): um único arquivo
      // ausente/renomeado não deve derrubar a instalação inteira.
      Promise.allSettled(
        SHELL_ASSETS.map((url) =>
          cache.add(url).catch((error) => {
            console.warn('[sw] Falha ao pré-cachear', url, error.message);
          })
        )
      )
    )
  );
});

/* --------------------------------------------------------------------
   Ativação — descarta caches de versões antigas e assume o controle.
   -------------------------------------------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/* --------------------------------------------------------------------
   Mensagens — permite que js/pwa.js dispare a ativação imediata de uma
   nova versão, sem esperar todas as abas fecharem.
   -------------------------------------------------------------------- */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* --------------------------------------------------------------------
   Fetch — roteia cada requisição para a estratégia certa.
   -------------------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Regra de segurança #1: nada relacionado ao Supabase passa pelo cache.
  // Dados financeiros e tokens de autenticação nunca tocam o Cache Storage.
  if (url.hostname.endsWith('supabase.co')) {
    return;
  }

  // Fontes do Google Fonts: raramente mudam, cache first.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Navegação e fragmentos HTML: network first (sempre tenta a versão
  // mais nova; cai pro cache, e depois pro próprio shell, se offline).
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // CSS, JS (inclusive Chart.js/Supabase SDK via CDN), imagens, fontes: cache first.
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Qualquer outra coisa: tenta a rede, cai pro cache se existir.
  event.respondWith(networkFirst(request, STATIC_CACHE));
});

/**
 * Cache First: serve do cache se existir; senão busca na rede e guarda
 * uma cópia para a próxima vez. Ideal para arquivos que raramente mudam.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  // response.ok é sempre false em respostas "opacas" (cross-origin sem
  // CORS, como o CSS do Google Fonts) mesmo quando a requisição deu
  // certo — por isso também aceitamos response.type === 'opaque' aqui.
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network First: tenta a rede primeiro (e atualiza o cache com o
 * resultado); só usa o cache se a rede falhar. Ideal para HTML, que deve
 * sempre refletir a versão mais recente quando há conexão.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Sem rede e sem cópia em cache desta página específica: pelo menos
    // devolve o shell (index.html), que sabe mostrar o aviso de offline.
    if (request.mode === 'navigate') {
      const shellFallback = await caches.match('./index.html');
      if (shellFallback) return shellFallback;
    }

    throw error;
  }
}
