/**
 * router.js
 * ============================================================================
 * Roteador client-side (hash-based). Decide qual página injetar em
 * #route-outlet com base no hash da URL e no estado de autenticação
 * (js/auth.js) — incluindo a proteção de rotas privadas e o
 * redirecionamento automático entre Login/Cadastro e a área autenticada.
 * ============================================================================
 */

import * as auth from './auth.js';

const DEFAULT_PUBLIC_ROUTE = 'login';
const DEFAULT_PRIVATE_ROUTE = 'dashboard';

/**
 * Tabela de rotas. Rotas com "path" são fragmentos HTML buscados via
 * fetch(); rotas com "render" são geradas diretamente em JS — usado por
 * enquanto só pelo placeholder de dashboard, até uma fase futura
 * implementar a tela real.
 */
const routes = {
  login: {
    public: true,
    path: 'pages/login.html',
    controller: () => import('../pages/login.js'),
  },
  register: {
    public: true,
    path: 'pages/register.html',
    controller: () => import('../pages/register.js'),
  },
  dashboard: {
    public: false,
    render: renderDashboardPlaceholder,
  },
};

function getRouteOutlet() {
  return document.getElementById('route-outlet');
}

function getCurrentRouteName() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash && routes[hash]) return hash;
  return auth.isAuthenticated() ? DEFAULT_PRIVATE_ROUTE : DEFAULT_PUBLIC_ROUTE;
}

function navigate(routeName) {
  window.location.hash = `/${routeName}`;
}

/**
 * Mostra/oculta o header, a sidebar e a bottom navigation: rotas públicas
 * (login/cadastro) usam um layout de página inteira, sem a navegação do
 * app autenticado (ver .is-auth-layout em css/pages.css).
 */
function applyLayout(isPublicRoute) {
  document.body.classList.toggle('is-auth-layout', isPublicRoute);
}

function setActiveNavItem(routeName) {
  document.querySelectorAll('[data-route]').forEach((el) => {
    if (el.dataset.route === routeName) {
      el.setAttribute('aria-current', 'page');
    } else {
      el.removeAttribute('aria-current');
    }
  });
}

async function renderRoute() {
  const routeName = getCurrentRouteName();
  const route = routes[routeName];

  // Guardas de autenticação — sempre redireciona para uma rota estável
  // (nenhuma das duas condições abaixo pode disparar a outra em seguida).
  if (!route.public && !auth.isAuthenticated()) {
    navigate(DEFAULT_PUBLIC_ROUTE);
    return;
  }
  if (route.public && auth.isAuthenticated()) {
    navigate(DEFAULT_PRIVATE_ROUTE);
    return;
  }

  applyLayout(route.public);
  setActiveNavItem(routeName);

  const outlet = getRouteOutlet();
  if (!outlet) return;

  outlet.innerHTML = '<div class="route-loading"><span class="loader loader--lg"></span></div>';

  try {
    if (route.render) {
      route.render(outlet);
      return;
    }

    const response = await fetch(route.path);
    if (!response.ok) throw new Error(`Não foi possível carregar ${route.path}`);
    outlet.innerHTML = await response.text();

    const pageController = await route.controller();
    pageController.init?.();
  } catch (error) {
    console.error('[router]', error);
    outlet.innerHTML = `
      <div class="empty-state">
        <h3 class="empty-state-title">Não foi possível carregar esta página</h3>
        <p class="empty-state-desc">Recarregue e tente novamente.</p>
      </div>
    `;
  }
}

/**
 * Placeholder temporário do Dashboard — a tela real será implementada em
 * uma fase futura. Existe apenas para o redirecionamento pós-login ter um
 * destino válido e para permitir testar o fluxo de logout.
 */
function renderDashboardPlaceholder(outlet) {
  outlet.innerHTML = `
    <div class="empty-state">
      <h2 class="empty-state-title">Você está autenticado</h2>
      <p class="empty-state-desc">O Dashboard ainda será implementado em uma fase futura.</p>
      <button class="btn btn--outline btn--sm" type="button" data-action="logout">Sair</button>
    </div>
  `;
}

/**
 * Inicia o roteamento: renderiza a rota atual e passa a reagir tanto a
 * mudanças de hash quanto a mudanças no estado de autenticação (ex.:
 * logout deve levar de volta ao login mesmo sem o hash mudar).
 */
export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
  auth.onAuthChange(renderRoute);
  renderRoute();
}
