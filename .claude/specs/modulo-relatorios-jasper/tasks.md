# Tarefas — Módulo de relatórios (Jasper) e regras novas no backend

- **Slug:** modulo-relatorios-jasper  •  **Baseado em:** plan.md  •  **Data:** 2026-08-01

## Legenda

`[ ]` pendente · `[~]` em andamento · `[x]` concluída · **dep:** depende de

> **Leia isto antes de marcar backend como pendente por descuido:** o backend
> ainda **não existe em código** neste repositório (é base de conhecimento +
> specs). As tarefas `T-B*` são executadas quando ele for gerado por
> `/recriar-backend-markup`, que já inclui a fase 9 — Relatórios.

## Documentação e contrato (feito)

- [x] **T-D1** — `spec.md`, `plan.md`, `tasks.md` da feature
- [x] **T-D2** — emenda da Constituição: **B12** (relatório no backend, módulo
      próprio, Jasper) + **F11** (front pede e baixa) · versão 2.4.0
- [x] **T-D3** — rule [`R12-relatorios-no-backend`](../../backend-markup/rules/R12-relatorios-no-backend.md)
- [x] **T-D4** — rule [`FR11-relatorio-vem-do-backend`](../../frontend-markup/rules/FR11-relatorio-vem-do-backend.md)
- [x] **T-D5** — skill [`modulo-relatorios-jasper`](../../backend-markup/skills/modulo-relatorios-jasper/SKILL.md):
      layout, catálogo, engine com cache, service, controller REST, convenções de
      JRXML e a bateria de testes obrigatórios
- [x] **T-D6** (REQ-01/02/03) — `schema-graphql-markup`: `faixaNegociacao`,
      `escopoGlobal`/`perfilGlobal`, tipos da Gestão do Site, queries
      (`todasEmpresas`, `empresaAdmin`, `todosUsuarios`, `metricasDaBase`),
      mutations de vínculo e a nota de que binário sai por REST
- [x] **T-D7** (REQ-05) — `rbac-permissoes`: authority **`ESCOPO_GLOBAL`** —
      escopo, não permissão — e a guarda do dono
- [x] **T-D8** — `estrutura-projeto-spring`: módulo `reports/` + `resources/reports/`
      + dependências Jasper
- [x] **T-D9** — `backend-markup/spec.md`: **RB-11** (Gestão do Site),
      **RB-12** (faixa de negociação), **RB-13** (relatórios) + rastreabilidade
- [x] **T-D10** — `recriar-backend-markup` (12 rules + fase 9) e
      `recriar-frontend-markup` (11 rules); READMEs e arquitetura do conhecimento

## Frontend (feito)

- [x] **T-F1** (REQ-14) — `src/graphql/relatorios.ts`: porta única de documento,
      tipos do catálogo, endpoint derivado do GraphQL, download com
      `Content-Disposition`/blob
- [x] **T-F2** (REQ-15) — `MOCK_MODE = true` ⇒ impressão local; `false` ⇒ `POST`
      no módulo de relatórios
- [x] **T-F3** — `ProdutoDetalheView` chama o cliente (com estado de carregando e
      mensagem de erro), não mais `window.print()` direto
- [x] **T-F4** — 7 testes em `src/graphql/relatorios.spec.ts`, incluindo: negação
      do backend **propaga** em vez de cair na impressão local

## Backend (quando o projeto Java for gerado)

- [ ] **T-B1** (REQ-01) — `PrecificacaoService` devolve `faixaNegociacao` (C10–C12)
      · alvo: `service/` · done: `lucroNoPiso == breakdown.lucroLiquido`
- [ ] **T-B2** (REQ-02/03/05) — `GestaoDoSiteService` + controller com
      `@PreAuthorize("hasAuthority('ESCOPO_GLOBAL')")` · dep: authority no JWT
- [ ] **T-B3** (REQ-04) — `desvincularUsuario` recusa o dono, com erro de negócio
- [ ] **T-B4** (REQ-06/07) — módulo `com.markup.reports` + `ReportCatalog`
- [ ] **T-B5** (REQ-13) — `JasperEngine` com cache de `.jasper`
- [ ] **T-B6** (REQ-08/09/10) — `ReportService`: autoriza → busca via services →
      preenche por DTO · dep: T-B1, T-B4
- [ ] **T-B7** (REQ-11) — `ReportsController` REST + `/api/relatorios/**` no
      `SecurityConfig`
- [ ] **T-B8** (REQ-12) — os 4 `.jrxml` do primeiro lote + `shared/` (estilos e
      subrelatório da faixa de negociação)
- [ ] **T-B9** — testes do módulo: template compila, campos ⊆ record, PDF começa
      com `%PDF-`, sem permissão ⇒ negado, outra empresa ⇒ negado, não-ADMIN em
      relatório global ⇒ negado, números do PDF == `ResultadoPrecificacao`
- [ ] **T-B10** — ArchUnit: nenhum pacote de domínio importa `reports`; nenhum
      `.jrxml` contém `<queryString>`

## Verificação

- [x] `npx vue-tsc --noEmit` limpo · `npm run build` OK
- [x] `npm test` — **110 testes** (103 antes, +7 do cliente de relatórios)
- [x] No app real: "Gerar PDF" chama o cliente e, em `MOCK_MODE`, imprime a tela;
      nenhum erro de console
- [x] Nenhuma biblioteca de PDF no `package.json` (REQ-14)
- [ ] `./mvnw test` do módulo de relatórios — depende do backend
- [ ] PDF gerado pelo Jasper conferido contra a tela — depende do backend

---
**Próximo passo:** gerar o backend com `/recriar-backend-markup` (fase 9 já
inclui o módulo) ou implementar `T-B1..T-B10` num projeto Java existente.
