# Nexora Financial

Aplicação de gestão financeira pessoal, construída como uma **SPA estática**
(sem frameworks e sem build), hospedada no **GitHub Pages** e com
**Supabase** como backend (banco de dados, autenticação e API).

> **Status atual:** Fase 9 — CRUD completo de metas financeiras, com
> status (ativa/concluída/vencida), progresso e dias restantes
> calculados automaticamente. **Requer rodar `sql/goals_fields.sql`
> no Supabase** (adiciona `category` e `description` à tabela `goals`).

### Testando a autenticação

Com as credenciais reais preenchidas em `js/config.js` e o schema/policies
do banco já executados (ver seção anterior), sirva o projeto localmente e
acesse `http://localhost:8080`:

- Sem sessão salva → cai automaticamente em `#/login`
- Cadastro em `#/register` → cria a conta no Supabase Auth
- Login em `#/login` → redireciona sozinho para `#/dashboard` (placeholder)
- Botão "Sair" na sidebar → encerra a sessão e volta para `#/login`
- Recarregar a página autenticado → sessão é restaurada automaticamente

### Configurando o banco de dados

No **SQL Editor** do seu projeto Supabase, execute, nesta ordem:

1. `sql/schema.sql` — cria os tipos, tabelas, índices e triggers
2. `sql/policies.sql` — habilita RLS e cria as policies de acesso
3. `sql/goals_fields.sql` — **(Fase 9)** adiciona `category` e `description`
   à tabela `goals`. Só precisa rodar se seu banco já existia antes desta
   fase; quem monta o banco do zero já recebe isso em `schema.sql`.

Depois de rodar os dois, as tabelas `profiles`, `categories`,
`transactions`, `goals` e `debts` já existem e estão protegidas por RLS
— um usuário autenticado só enxerga (e só grava) as próprias linhas.

### Configurando o Supabase

Antes de usar, edite `js/config.js` e substitua os valores de exemplo:

```js
export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
export const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';
```

Ambos os valores ficam em Supabase Dashboard → Project Settings → API.
Use sempre a chave **anon/public** — nunca a `service_role key` (essa
nunca deve aparecer em código client-side).

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
- [x] **Fase 3** — Infraestrutura Supabase (client, config, contrato de autenticação)
- [x] **Fase 4** — Schema do banco de dados e Row Level Security
- [x] **Fase 5** — Autenticação completa (login, cadastro, logout, sessão, rotas protegidas)
- [x] **Fase 6** — Dashboard real (leitura de saldo, transações, metas e dívidas)
- [x] **Fase 7** — CRUD completo de transações (criar, editar, excluir, filtrar, buscar)
- [x] **Fase 8** — Estatísticas com gráficos (Chart.js)
- [x] **Fase 9** — CRUD completo de metas financeiras
- [ ] **Fase 10** — Cadastro/edição de dívidas
- [ ] **Fase 11** — Perfil do usuário
- [ ] **Fase 12** — PWA completa (manifest, service worker, ícones, offline)
- [ ] **Fase 13** — Deploy e ajustes finais no GitHub Pages
