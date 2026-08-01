# Plano técnico — Módulo de relatórios (Jasper) e regras novas no backend

- **Slug:** modulo-relatorios-jasper  •  **Baseado em:** spec.md  •  **Data:** 2026-08-01
- **Depende de:** `backend-java-spring` (o backend ainda não existe em código)

## Estado atual, sem rodeio

O backend é hoje **base de conhecimento + specs** (`.claude/backend-markup`); não
há projeto Java neste repositório. Então este plano entrega, agora:

1. **contrato e requisitos** — schema, rules e spec do backend atualizados, para
   que as regras novas nasçam no servidor quando ele for gerado;
2. **o módulo de relatórios como template completo** —
   [`modulo-relatorios-jasper`](../../backend-markup/skills/modulo-relatorios-jasper/SKILL.md)
   com layout, catálogo, engine, service, controller, convenções de JRXML e a
   bateria de testes obrigatórios;
3. **o lado do front já funcionando** — `src/graphql/relatorios.ts`, que fala com
   o endpoint quando `MOCK_MODE = false` e cai na impressão local enquanto não há
   servidor.

O código Java entra quando o backend for scaffoldado (`/recriar-backend-markup`),
que passa a incluir a fase 9 — Relatórios.

## Abordagem

**Módulo, não camada.** `com.markup.reports` fica ao lado de `service/` e
`graphql/`, com dependência num sentido só. Relatório muda por pedido comercial,
numa cadência diferente do domínio; separado, um template novo não arrasta
`service/` junto.

**Catálogo fechado como porta única.** Um `enum` amarra template + permissão +
escopo. Isso mata de saída a geração dinâmica ("passe o nome do template") — que
é como se lê arquivo arbitrário do classpath — e deixa a autorização declarada
junto do relatório, não espalhada.

**O relatório não sabe calcular.** Ele chama `PrecificacaoService` e recebe
`ResultadoPrecificacao` pronto (C1–C12). O `.jrxml` formata e soma banda.

**REST para o binário.** Dados continuam em `/graphql`; PDF sai em
`POST /api/relatorios/{tipo}`, protegido pelo mesmo JWT.

## Camadas afetadas

- **Backend (a construir)**
  - `reports/` — `ReportCatalog`, `JasperEngine`, `ReportService`,
    `ReportsController`, `datasource/`, `exception/`.
  - `resources/reports/` — `.jrxml` + `shared/` (estilos e subrelatório da faixa).
  - `service/PrecificacaoService` — passa a devolver `faixaNegociacao` (C10–C12).
  - `service/GestaoDoSiteService` + controller — queries/mutations de escopo global.
  - `security/` — authority `ESCOPO_GLOBAL`; `/api/relatorios/**` sob o mesmo filtro.
  - `resources/graphql/schema.graphqls` — tipos e operações novos.
- **Frontend**
  - `src/graphql/relatorios.ts` (novo) — porta única de documento.
  - `src/views/ProdutoDetalheView.vue` — botão chama o cliente, não `window.print()`.
  - Stores `admin`/`produtos` — quando `MOCK_MODE = false`, passam a consumir as
    queries novas (já isoladas na camada `graphql`, F6).

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-02/05 | `@PreAuthorize("hasAuthority('ESCOPO_GLOBAL')")` — authority derivada de `perfil.escopo_global`, não uma `PermissaoChave` |
| REQ-04 | guarda no service, com erro de negócio explícito (não `Boolean false` mudo) |
| REQ-06 | pacote próprio; ArchUnit garante que ninguém importa `reports` |
| REQ-07 | `enum ReportCatalog` (template, permissão, escopo) |
| REQ-08/09 | `JRBeanCollectionDataSource` sobre records; teste falha se houver `<queryString>` no `.jrxml` |
| REQ-11 | REST + `Content-Disposition`; base64 em GraphQL descartado (+33%, sem streaming) |
| REQ-13 | `ConcurrentHashMap<String, JasperReport>` preenchido no primeiro uso |
| REQ-14/15 | `gerarRelatorioPdf()` com dois caminhos sob `MOCK_MODE`, igual ao padrão da camada GraphQL |

## Riscos e alternativas

- **SQL dentro do JRXML** → é o vazamento clássico entre clientes; proibido por
  regra e checado por teste que varre os templates.
- **Fórmula duplicada no template** → segunda fonte de verdade para preço; o
  teste compara os números do PDF com os do `ResultadoPrecificacao`.
- **Fonte ausente no servidor** (PDF com caixinhas) → `jasperreports-fonts` no
  classpath, sem depender de fonte do SO.
- **Alternativa descartada:** gerar PDF no front com `jspdf`/`pdfmake` — dois
  layouts do mesmo documento e nenhum controle de autorização sobre o arquivo.
- **Alternativa descartada:** manter a impressão do navegador como via oficial —
  o documento sairia diferente conforme navegador, margem e zoom de cada usuário.

## Rules aplicáveis

**B12/R12** (relatório no backend, módulo próprio), B1/R01 (cálculo), B2/R02 e
B9/R09 (isolamento e ownership), B5/R05 (RBAC), B11/R11 (guardas),
**F11/FR11** (front pede e baixa), F6/FR06 (camada de dados isolada).

---
**Próximo passo:** `/tasks`
