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
 * Tabela de rotas. "path" é o fragmento HTML buscado via fetch() e
 * injetado em #route-outlet; "controller" é o módulo cujo init() é
 * chamado logo em seguida, para dar comportamento a esse HTML.
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
    path: 'pages/dashboard.html',
    controller: () => import('../pages/dashboard.js'),
  },
  transactions: {
    public: false,
    path: 'pages/transactions.html',
    controller: () => import('../pages/transactions.js'),
  },
  statistics: {
    public: false,
    path: 'pages/statistics.html',
    controller: () => import('../pages/statistics.js'),
  },
  goals: {
    public: false,
    path: 'pages/goals.html',
    controller: () => import('../pages/goals.js'),
  },
  debts: {
    public: false,
    path: 'pages/debts.html',
    controller: () => import('../pages/debts.js'),
  },
  profile: {
    public: false,
    path: 'pages/profile.html',
    controller: () => import('../pages/profile.js'),
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
 * Inicia o roteamento: renderiza a rota atual e passa a reagir tanto a
 * mudanças de hash quanto a mudanças no estado de autenticação (ex.:
 * logout deve levar de volta ao login mesmo sem o hash mudar).
 */
export function initRouter() {
  window.addEventListener('hashchange', renderRoute);
  auth.onAuthChange(renderRoute);
  renderRoute();
}
