# Tarefas — Módulo de Gestão do Site (ADMIN global)

- **Slug:** modulo-gestao-site  •  **Baseado em:** plan.md  •  **Data:** 2026-08-01

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Documentação (SDD)

- [x] **T-D1** — `spec.md`, `plan.md`, `tasks.md` da feature
- [x] **T-D2** — emenda da Constituição: artigo **F10** + versão 2.3.0
- [x] **T-D3** — rule [`FR10-escopo-de-tema-por-modulo`](../../frontend-markup/rules/FR10-escopo-de-tema-por-modulo.md)
- [x] **T-D4** — skill [`modulo-gestao-site`](../../frontend-markup/skills/modulo-gestao-site/SKILL.md)
- [x] **T-D5** — atualizar `frontend-markup/README.md` e `spec.md` (RF-12), skills
      `design-tokens-tema`, `roteamento-e-layout`, `store-pinia-dominio`,
      `testes-navegacao-multiusuario`, rule `FR03`
- [x] **T-D6** — atualizar `recriar-frontend-markup`, `recriar-projeto-markup`,
      `markup_knowledge_architecture.md` e a memória do projeto

## Frontend

- [x] **T-F1** (REQ-08) — tokens: escala `--color-neutral-*`, `--color-primary-shadow*`,
      `--focus-ring` e o escopo `.theme-admin` · alvo: `src/assets/main.css`
- [x] **T-F2** (REQ-08) — `BaseButton` usa os tokens de sombra (era hex verde fixo);
      `BaseCard` passa a honrar `padding="none"` (tabela rente à borda)
- [x] **T-F3** (REQ-01) — `podeAcessarModuloAdmin()` · alvo: `src/auth/autorizacao.ts`
- [x] **T-F4** (REQ-01) — `meta.adminGlobal` + checagem no `guardaNavegacao` + as 4
      rotas `/admin*` (lazy) · alvo: `src/router/index.ts`
- [x] **T-F5** (REQ-02..07) — `stores/admin.ts`: carga de escopo global, derivados
      (`empresasAdmin`, `usuariosAdmin`, `metricas`) e as 4 ações · dep: T-F3
- [x] **T-F6** (REQ-03) — `AdminVisaoGeralView` (painel de métricas e atalhos)
- [x] **T-F7** (REQ-03/REQ-10) — `AdminEmpresasView` (busca, filtro por segmento,
      paginação infinita, equipe por empresa)
- [x] **T-F8** (REQ-04/REQ-06/REQ-07) — `AdminEmpresaDetalheView` (equipe, troca de
      perfil, desvincular, conceder acesso; dono protegido)
- [x] **T-F9** (REQ-05/REQ-06/REQ-10) — `AdminUsuariosView` (4 filtros, acessos,
      ativar/desativar)
- [x] **T-F10** (REQ-01/REQ-08/REQ-09) — layout: grupo de menu só-ADMIN, marca do
      gestor, escopo de tema no `AppLayout` e selo "Modo gestor" no `AppHeader`
- [x] **T-F11** (REQ-11) — `src/test/admin-gestao-site.spec.ts` (19 testes) +
      rotas `/admin*` nas `bloqueadas` das personas não-ADMIN

## Verificação

- [x] `npx vue-tsc --noEmit` limpo · `npm run build` OK
- [x] `npm test` — **93 testes** (74 antes, +19 do módulo)
- [x] Mutação: removendo a checagem `meta.adminGlobal` do guard, **9 testes falham**
      nos dois arquivos de aceite; restaurada, tudo volta a passar
- [x] Navegado no app real como ADMIN: painel, lista de 4 empresas, detalhe da
      `emp-001` (4 usuários, "Desvincular" do dono desabilitado), lista de 8
      usuários, ativar/reativar com aviso; sem erros no console
- [x] Tema: em `/admin*` `--color-primary-600` = `#475569` e sidebar `#0f172a`;
      fora dele volta a `#2d7d31` / `#193f1b`
- [ ] Backend: queries `todasEmpresas`/`todosUsuarios` e mutations do módulo com
      autorização de escopo — depende de `backend-java-spring`
- [ ] Transferência de propriedade da empresa — fora de escopo (spec própria)

---
**Próximo passo:** quando o backend existir, trocar a carga da `stores/admin.ts`
pelas queries de escopo global (F6) — nenhuma view precisa mudar.
