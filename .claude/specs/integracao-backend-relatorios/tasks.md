# Tarefas — Integração com o backend: módulo de relatórios (PDF/XLSX)

> Preenchido por `/tasks` a partir do `plan.md`. Lista ordenada, pequena e
> rastreável. Cada tarefa referencia o requisito (`REQ-xx`) e o arquivo/skill alvo.

- **Slug:** integracao-backend-relatorios  •  **Baseado em:** plan.md  •  **Data:** 2026-08-06

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

## Backend

Nenhuma tarefa: `POST /api/relatorios/{tipo}` já existe e está no ar
(confirmado via Swagger). Pré-requisito de ambiente: backend com perfil `dev`
no ar em `localhost:8080` para verificação manual.

## Frontend

### Camada de dados

- [x] **T-F1** (REQ-01, REQ-02, REQ-03, REQ-07) — `src/graphql/relatorios.ts`:
  `TipoRelatorio` ganha `CUSTO_MATERIAIS`; `FormatoRelatorio`/`ModoRelatorio`;
  `pedirRelatorio()` interno monta `formato`/`modo` na query string, usa
  `tokenDeAcesso()` por padrão, e lança **antes do fetch** se
  `modo=INLINE` com `formato≠PDF` · alvo: `src/graphql/relatorios.ts` ·
  done: nenhuma combinação inválida chega a `fetch`.
- [x] **T-F2** (REQ-04, REQ-05) — `visualizarRelatorioPdf(tipo, params)`:
  sempre `formato=PDF, modo=INLINE`, devolve `{ nomeArquivo, blobUrl }` sem
  disparar download · alvo: `src/graphql/relatorios.ts` · dep: T-F1.
- [x] **T-F3** (REQ-06) — `baixarRelatorioXlsx(tipo, params)`: atalho para
  `baixarRelatorioDoBackend(tipo, params, { formato: 'XLSX' })` · alvo:
  `src/graphql/relatorios.ts` · dep: T-F1.
- [x] **T-F4** (REQ-08) — `baixarRelatorioDoBackend`/`visualizarRelatorioPdf`
  seguem lançando `Error` com o status HTTP no texto; nenhuma delas tenta
  fallback local · alvo: `src/graphql/relatorios.ts` · dep: T-F1, T-F2.
- [x] **T-F5** — Testes: query string com `formato`/`modo`, `Authorization`
  vindo de `tokenDeAcesso()` sem o caller passar nada, guarda de
  `inline`+`XLSX` sem round-trip, `visualizarRelatorioPdf` devolvendo
  `blobUrl` sem chamar `URL.createObjectURL` de novo no download da modal ·
  alvo: `src/graphql/relatorios.spec.ts` · dep: T-F1…T-F4.

### UI compartilhada

- [x] **T-F6** (REQ-04, REQ-05, REQ-08) — Composable `useRelatorio()`:
  `carregando`, `erro`, `pdfAberto`, `visualizarPdf(tipo, params)`,
  `fecharPdf()` (revoga o Object URL), `baixar(tipo, formato, params)` · alvo:
  `src/composables/useRelatorio.ts` · dep: T-F1…T-F4.
- [x] **T-F7** (REQ-04, REQ-05) — `RelatorioPdfModal.vue`: `BaseModal
  size="xl"` com `<iframe :src="url">` e rodapé "Fechar"/"Baixar PDF"; baixar
  reaproveita o `url` recebido (nenhuma chamada de rede nova) · alvo:
  `src/components/ui/RelatorioPdfModal.vue` · dep: nenhuma (consome props, não
  o composable diretamente).

### Superfícies

- [x] **T-F8** (REQ-09) — `ProdutoDetalheView`: botão "Gerar PDF" vira
  "Visualizar PDF" (abre `RelatorioPdfModal` via `useRelatorio`) + novo
  "Baixar XLSX"; erro exibido como já fazia (`erroPdf` some, usa
  `useRelatorio().erro`) · alvo: `src/views/ProdutoDetalheView.vue` · dep:
  T-F6, T-F7.
- [x] **T-F9** (REQ-10) — `RelatoriosView`: remove `gerandoPDF`/`gerarPDF()`
  (mock); cada aba (`precificacao`→`LISTA_PRECIFICACAO`,
  `despesas`→`DESPESAS_FIXAS`, `materiais`→`CUSTO_MATERIAIS`) ganha
  "Visualizar PDF" + "Baixar XLSX" com `empresaId: empresaStore.empresa.id` ·
  alvo: `src/views/RelatoriosView.vue` · dep: T-F6, T-F7.
- [x] **T-F10** (REQ-11) — `AdminVisaoGeralView`: bloco de ação para
  `GESTAO_EMPRESAS_USUARIOS` (visualizar + baixar PDF, baixar XLSX), com
  `v-if="authStore.adminGlobal"` · alvo: `src/views/admin/AdminVisaoGeralView.vue` ·
  dep: T-F6, T-F7.

### Documentação

- [x] **T-F11** — `FR11-relatorio-vem-do-backend.md`: descreve `formato`/
  `modo`, a pré-visualização inline, e remove a menção a `MOCK_MODE` (não
  existe mais no código desde a migração para backend real) · alvo:
  `.claude/frontend-markup/rules/FR11-relatorio-vem-do-backend.md`.
- [x] **T-F12** — `constitution.md`: linha F11 + entrada de histórico v2.6.0 ·
  alvo: `.claude/constitution.md`.
- [x] **T-F13** — `specs/README.md`: linha "Módulo de relatórios (Jasper)"
  passa de bloqueada para linkar `integracao-backend-relatorios/spec.md` ·
  alvo: `.claude/specs/README.md`.

### Testes de aceite

- [x] **T-F14** (REQ-11, F9) — Teste de navegação por perfil: usuário sem
  `adminGlobal` não vê a ação de `GESTAO_EMPRESAS_USUARIOS` em
  `AdminVisaoGeralView` · alvo: `src/views/admin/AdminVisaoGeralView.spec.ts`
  (novo, se a tela ainda não tiver suíte) · dep: T-F10.

## Verificação

- [x] `npm run build` (inclui `vue-tsc`) sem erro.
- [x] `npm test` verde.
- [x] `grep -rn "modo=inline\|INLINE" src/graphql/relatorios.ts` só aparece
  associado a `formato=PDF`.
- [x] Verificação manual contra o backend em `dev`: ficha de produto
  (`FICHA_TECNICA_PRODUTO`), a aba "Precificação Completa" de Relatórios
  (`LISTA_PRECIFICACAO`, PDF inline e XLSX download) e a Visão Geral do admin
  (`GESTAO_EMPRESAS_USUARIOS`, logado como ADMIN global) — as 5 chamadas
  saíram com `formato`/`modo` corretos na query string e voltaram 200,
  confirmando que o JWT da sessão viaja sem passagem manual (REQ-03) e que
  `GESTAO_EMPRESAS_USUARIOS` só aparece autorizado para ESCOPO_GLOBAL. O botão
  "Baixar PDF" da modal não gerou requisição nova (REQ-05, checado pela aba de
  rede).

---
**Próximo passo:** implementar, começando por T-F1.
