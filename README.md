# Nexora Financial

Aplicação de gestão financeira pessoal, construída como uma **SPA estática**
(sem frameworks e sem build), hospedada no **GitHub Pages** e com
**Supabase** como backend (banco de dados, autenticação e API).

> **Status atual:** Fase 2 — App Shell e arquitetura base (services,
> repositories, models, sistema de componentes). Nenhuma funcionalidade
> (autenticação, dados, roteamento) foi implementada ainda.

---

## Stack

- HTML5 · CSS3 · JavaScript ES6+ (vanilla, sem frameworks)
- [Supabase](https://supabase.com) (Postgres + Auth + API)
- GitHub / GitHub Pages
- PWA (Progressive Web App)

---

## Estrutura do projeto

```
/
├── index.html                  # App Shell (header, sidebar, bottom-nav, área de conteúdo)
│
├── assets/
│   ├── icons/ images/ fonts/    # Recursos estáticos
│
├── css/
│   ├── variables.css            # Tokens: cor, tipografia, espaçamento, sombra, raio
│   ├── reset.css                 # Reset moderno, base neutra
│   ├── layout.css                 # Container, grid, app-shell, stacks
│   ├── components.css              # Base do Design System: botão, card, badge, input...
│   ├── pages.css                    # Reservado para composição de telas (Fase 3)
│   └── responsive.css                # Media queries, incl. troca sidebar <-> bottom-nav
│
├── components/                 # Um componente = uma pasta com .html + .css + .js
│   ├── header/  sidebar/  bottom-navigation/     ← chrome do App Shell
│   ├── card/  badge/  button/  input/  select/  table/  skeleton/  ← "finos",
│   │                                                     estilo já em css/components.css
│   └── modal/  bottom-sheet/  toast/  loader/  empty-state/  chart-card/  ← novos,
│                                                     com CSS próprio
│
├── js/
│   ├── app.js         # Ponto de entrada — orquestra a inicialização
│   ├── router.js        # Roteamento client-side (hash-based)
│   ├── config.js          # Configurações e credenciais públicas
│   ├── supabase.js          # Inicialização do cliente Supabase
│   ├── auth.js                 # Autenticação (login, cadastro, sessão)
│   ├── dashboard.js               # Tela de dashboard        (Fase 3)
│   ├── transactions.js              # Gestão de transações   (Fase 3)
│   ├── statistics.js                  # Estatísticas          (Fase 3)
│   ├── goals.js                         # Metas financeiras    (Fase 3)
│   ├── debts.js                           # Gestão de dívidas   (Fase 3)
│   ├── profile.js                           # Perfil do usuário  (Fase 3)
│   ├── ui.js                                  # Orquestra modal/toast/bottom-sheet/loader
│   └── utils.js                                 # Funções puras (formatação, validação)
│
├── services/                   # Regras de negócio (orquestram os repositories)
│   ├── auth.service.js  transaction.service.js  goal.service.js
│   └── debt.service.js  report.service.js  category.service.js
│
├── repositories/                # Acesso cru ao Supabase (CRUD puro, sem regras)
│   ├── transaction.repository.js  goal.repository.js
│   └── debt.repository.js         category.repository.js
│
├── models/                       # Forma dos dados (JSDoc @typedef, sem lógica)
│   ├── transaction.model.js  goal.model.js
│   └── debt.model.js         category.model.js
│
├── sql/                          # Schemas e policies do Supabase (Fase 3)
└── README.md
```

Todos os arquivos `.js` deste projeto (core, components, services,
repositories, models) existem apenas como **stubs documentados** — cabeçalho
explicando a responsabilidade futura do módulo — nenhuma lógica foi escrita
ainda, conforme o escopo desta fase.

---

## Arquitetura em camadas

```
Tela (Fase 3)  →  Service  →  Repository  →  Supabase
                      ↑
                   Model (forma dos dados)
```

- **Model** — apenas a forma dos dados (JSDoc), espelhando as tabelas do Supabase.
- **Repository** — acesso cru ao banco (CRUD). Não sabe nada sobre regras de negócio.
- **Service** — regras de negócio, validações, cálculos. Consumido pelas telas.

Essa separação (Repository Pattern) permite trocar a fonte de dados, testar
regras isoladamente e evoluir o projeto sem reescrever telas inteiras.

---

## Sistema de componentes

Cada componente vive em `components/<nome>/` com três arquivos:
`<nome>.html` (markup de referência), `<nome>.css` (estilo) e `<nome>.js`
(estrutura preparada, sem lógica). Componentes que já têm classes no Design
System (`card`, `badge`, `button`, `input`, `select`, `table`, `skeleton`)
mantêm o `.css` enxuto para não duplicar `css/components.css`.

`index.html` carrega apenas o CSS dos componentes que estão realmente
renderizados no App Shell hoje (`header`, `sidebar`, `bottom-navigation`).
O CSS dos demais componentes será vinculado conforme as telas da Fase 3
forem construídas — evitando carregar estilos não utilizados.

---

## Como rodar localmente

```bash
python3 -m http.server 8080
# ou
npx serve .
```

Acesse `http://localhost:8080`.

---

## Roadmap

- [x] **Fase 1** — Estrutura do projeto e Design System
- [x] **Fase 2** — App Shell, sistema de componentes, services/repositories/models
- [ ] **Fase 3** — Schema do Supabase, autenticação, roteamento e telas
- [ ] **Fase 4** — Funcionalidades core (transações, estatísticas, metas, dívidas, perfil)
- [ ] **Fase 5** — PWA completa (manifest, service worker, ícones, offline)
- [ ] **Fase 6** — Deploy e ajustes finais no GitHub Pages
