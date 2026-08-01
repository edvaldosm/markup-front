# Plano técnico — Módulo de Gestão do Site (ADMIN global)

- **Slug:** modulo-gestao-site  •  **Baseado em:** spec.md  •  **Data:** 2026-08-01
- **Depende de:** `multiempresa-ownership` (R09 / `src/auth/autorizacao.ts`)

## Abordagem

Um **módulo à parte dentro do mesmo app**: rotas sob `/admin`, store própria de
escopo global e um **escopo de tema** neutro aplicado por variáveis CSS. Nada de
segundo app, segundo layout ou componentes duplicados — o `AppLayout` é o mesmo;
o que muda é o *conjunto de tokens* ativo e o que a sidebar oferece.

Três decisões estruturam o módulo:

1. **Porteiro único.** `meta.adminGlobal: true` na rota + checagem no
   `guardaNavegacao`, espelhando o que já existe para `meta.permissao`. A store
   também se recusa a carregar para quem não é ADMIN — porta e cofre trancados,
   não só a porta.
2. **Escopo global explícito.** `stores/admin.ts` lê `mockEmpresas`/`mockUsuarios`
   inteiros — de propósito. As outras stores filtram por empresa ativa (R02); esta
   é a única que não filtra, e por isso o guard dela é a razão de ser do arquivo.
3. **Tema por escopo, não por componente.** `.theme-admin` remapeia
   `--color-primary-*` para a escala neutra. Todo componente que já usa tokens
   (F3) muda de cor sem uma linha de CSS nova.

## Camadas afetadas

- **Frontend**
  - `src/assets/main.css` — escala `--color-neutral-*`, tokens `--color-primary-shadow`
    e `--focus-ring`, bloco de escopo `.theme-admin`.
  - `src/auth/autorizacao.ts` — `podeAcessarModuloAdmin()` (função pura).
  - `src/router/index.ts` — 4 rotas `/admin*` + `meta.adminGlobal` no guard.
  - `src/stores/admin.ts` — store de escopo global (empresas, usuários, vínculos).
  - `src/views/admin/*` — `AdminVisaoGeralView`, `AdminEmpresasView`,
    `AdminEmpresaDetalheView`, `AdminUsuariosView`.
  - `src/components/layout/*` — grupo de menu só-ADMIN, brand/tema neutros,
    header sem `CompanySwitcher` em `/admin*`.
  - `src/components/ui/BaseButton.vue` — sombra do botão primário via token
    (era hex verde fixo; no escopo neutro precisava acompanhar).
- **Backend:** nenhuma mudança agora. O módulo consome o mesmo contrato: quando o
  backend existir, `todasEmpresas`/`todosUsuarios` (queries só-ADMIN) substituem a
  leitura do mock — a store é o único ponto a trocar (F6).

## Mudanças de modelo / contrato

- **Tipos do front:** nenhum tipo novo de domínio. O módulo compõe os existentes
  em *view models* locais da store (`EmpresaAdmin`, `UsuarioAdmin`) — derivados,
  não persistidos.
- **Schema GraphQL (futuro):** `todasEmpresas: [Empresa!]!`,
  `todosUsuarios: [Usuario!]!`, `definirPerfilNoVinculo`, `vincularUsuario`,
  `desvincularUsuario`, `definirUsuarioAtivo` — todas com `@PreAuthorize` de
  escopo global no backend.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | `meta.adminGlobal` + guard; sidebar filtra o grupo por `auth.adminGlobal`; store devolve vazio para não-ADMIN |
| REQ-02 | `stores/admin.ts` lê a base inteira (única store sem filtro por empresa) |
| REQ-03/04/05 | *view models* derivados na store: `empresasAdmin` (empresa + dono + equipe) e `usuariosAdmin` (usuário + vínculos + escopo) |
| REQ-06 | ações da store mutam o mock (mesma estratégia de `criarEmpresa`), cada uma reguardada por `isAdminGlobal` |
| REQ-07 | `desvincularUsuario` recusa quando `empresa.donoUsuarioId === usuarioId` e devolve `false` |
| REQ-08 | escopo `.theme-admin` remapeando os tokens; **sem** hex novo nos componentes (F3) |
| REQ-09 | `AppHeader` troca `CompanySwitcher` por um selo "Gestão do Site" em `/admin*` |
| REQ-10 | `usePaginacao` + `InfiniteScrollSentinel` nas listas + busca/filtros locais |
| REQ-11 | personas existentes ganham as rotas `/admin*` em `bloqueadas`; spec dedicada cobre conteúdo e tema |

### Por que o tema é aplicado em dois lugares

A classe `theme-admin` vai no `<div class="app-layout">` **e** no
`documentElement`. O primeiro escopa o layout; o segundo alcança o que o Vue
teleporta para fora dele (`BaseModal` usa `<Teleport to="body">` — sem isso, um
modal aberto no módulo administrativo voltaria a ser verde).

## Rules aplicáveis

F3 (tokens), F4 (paginação), F7 (rotas protegidas), **F10** (escopo de tema por
módulo — artigo novo), F9 (teste por perfil), B9/R09 (ownership + ADMIN global),
B5/R05 (RBAC).

## Riscos e alternativas

- **Store global vazando para tela de cliente** → a store é usada só pelas views
  `/admin*`; guard em `fetchTudo()` e em toda ação; teste prova conjunto vazio
  para não-ADMIN.
- **Tema neutro não alcançar algum componente** → causa seria hex hardcoded
  (violação de F3); o `BaseButton` foi corrigido, e o teste de tema fixa o
  contrato do escopo.
- **Alternativa descartada:** app/rota separada com layout próprio — dobraria
  sidebar, header e responsividade para ganhar só a cor.

---
**Próximo passo:** `/tasks`
