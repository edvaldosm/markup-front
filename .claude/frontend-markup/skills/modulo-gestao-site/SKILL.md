---
name: modulo-gestao-site
description: Módulo administrativo do gestor do site (ADMIN global) — rotas /admin, store de escopo global, listagem de empresas e usuários e tema neutro. Use ao mexer na área de suporte ou ao criar outro módulo com público próprio.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/views/admin/*, src/stores/admin.ts, src/router/index.ts, src/assets/main.css
  spec: .claude/specs/modulo-gestao-site/
---

# Módulo de Gestão do Site (ADMIN global)

Área do **gestor do site**: visão da base inteira (todas as empresas, todos os
usuários) e gestão dos vínculos. Não é "mais uma tela do produto" — tem público,
escopo e identidade visual próprios.

## Anatomia

```
src/router/index.ts          rotas /admin* com meta.adminGlobal
src/auth/autorizacao.ts      podeAcessarModuloAdmin(user)  ← função pura
src/stores/admin.ts          store de escopo global (empresas + usuários + ações)
src/views/admin/             AdminVisaoGeralView, AdminEmpresasView,
                             AdminEmpresaDetalheView, AdminUsuariosView
src/assets/main.css          escala --color-neutral-* + escopo .theme-admin
src/components/layout/       grupo de menu só-ADMIN, brand e header do modo gestor
src/test/admin-gestao-site.spec.ts   aceite (FR09/FR10)
```

## Três decisões que definem o módulo

**1. O que separa é escopo, não permissão.** `meta.adminGlobal: true` na rota; o
guard checa `auth.adminGlobal`. Um PROPRIETARIO tem todas as `PermissaoChave` e
mesmo assim não entra ([[FR10-escopo-de-tema-por-modulo]], [[R09-ownership-multiempresa]]).

**2. A store não filtra por empresa — e por isso se guarda sozinha.** É a única
que lê a base inteira; todas as demais filtram pela empresa ativa (R02). Cada
caminho de entrada checa o escopo:

```ts
const souGestor = computed(() => podeAcessarModuloAdmin(auth.user))

async function fetchTudo() {
  if (!souGestor.value) { limpar(); return }   // para não-ADMIN: conjunto vazio
  …
}
async function desvincularUsuario(usuarioId, empresaId) {
  if (!souGestor.value) return false
  if (empresa.donoUsuarioId === usuarioId) return false   // dono não perde a própria empresa
  …
}
```

Porta (guard de rota) e cofre (store) trancados: um bug de navegação não vira
vazamento de base.

**3. A cor vem do tema, não dos componentes.** `.theme-admin` remapeia os tokens;
nenhuma view do módulo tem hex de acento. Ver [[design-tokens-tema]].

## Modelo de leitura (view models derivados)

A store não cria tipos novos de domínio — compõe os existentes:

| Derivado | Serve a |
|----------|---------|
| `empresasAdmin` → `{ empresa, dono, equipe[] }` | listagem e detalhe da empresa |
| `usuariosAdmin` → `{ usuario, perfilGlobal, acessos[] }` | listagem global de usuários |
| `metricas` | painel de entrada |

`equipe` inclui o dono mesmo se faltar o vínculo — empresa sem dono na tela é
sintoma que o gestor precisa ver, não estado a esconder.

## Ao ligar o backend

Trocar só a carga da store: `todasEmpresas` / `todosUsuarios` (queries de escopo
global) e as mutations `definirPerfilNoVinculo`, `vincularUsuario`,
`desvincularUsuario`, `definirUsuarioAtivo` — todas com autorização de escopo no
servidor ([[camada-graphql-mock]], [[FR06-camada-graphql-isolada]]).

## Checklist ao estender

- [ ] Rota nova do módulo declara `meta.adminGlobal` **e** entra em `ADMIN` no
      `navegacao-multiusuario.spec.ts` (bloqueada para todas as outras personas).
- [ ] Lista nova usa `usePaginacao` + `InfiniteScrollSentinel` ([[paginacao-infinita]]).
- [ ] Tabela larga rola dentro do card (`.tabela-scroll` com `overflow-x: auto`),
      em vez de ser cortada pelo `overflow: hidden` do `BaseCard`.
- [ ] Ação nova na store começa por `if (!souGestor.value) return false`.
- [ ] Ação que muda o mock é restaurada no `afterEach` do teste — o mock é módulo
      compartilhado entre os testes do arquivo.
