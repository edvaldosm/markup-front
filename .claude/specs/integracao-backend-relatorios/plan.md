# Plano técnico — Integração com o backend: módulo de relatórios (PDF/XLSX)

> Preenchido por `/plan` a partir do `spec.md`. Descreve **como** construir.
> Nenhuma decisão pode violar [constitution.md](../../constitution.md).

- **Slug:** integracao-backend-relatorios  •  **Baseado em:** spec.md  •  **Data:** 2026-08-06

## Abordagem

`src/graphql/relatorios.ts` já era a porta única de saída de documento (FR11) —
não nasce um módulo novo, o existente **ganha o que faltava**:

1. **Contrato completo.** `formato` e `modo` viram parâmetros de query em toda
   chamada (hoje só existe PDF/download implícitos); `CUSTO_MATERIAIS` entra
   no catálogo de tipos.
2. **Token da sessão por padrão.** A função para de depender de quem chama
   passar `opcoes.token` — lê `tokenDeAcesso()` (o mesmo cofre que o
   `authLink` do Apollo usa), com `opcoes.token` sobrevivendo só como
   sobrescrita explícita (útil em teste). Fecha uma lacuna real: hoje
   `ProdutoDetalheView` chama sem token nenhum.
3. **Duas saídas, uma busca.** `visualizarRelatorioPdf` faz `fetch` com
   `modo=inline`, devolve o **Object URL** do blob (não dispara download); o
   componente de modal usa esse URL num `<iframe>`, e o botão "Baixar" da
   modal reaproveita o mesmo URL/blob — sem segunda chamada de rede (REQ-05).
   `baixarRelatorioDoBackend` continua fazendo `modo=download` e disparando o
   `<a download>` como já fazia, agora parametrizado por `formato`.
4. **Estado de UI num composable, não duplicado em 3 telas.**
   `useRelatorio()` centraliza `carregando`/`erro`/`pdfAberto` (o payload da
   pré-visualização atual) — `RelatoriosView`, `ProdutoDetalheView` e
   `AdminVisaoGeralView` chamam o mesmo composable em vez de reimplementar
   `ref` de loading e `try/catch` cada uma.

Não é um redesenho: a camada de dados, o padrão de composable e o `BaseModal`
já existem — esta fatia estende os três com o contrato real.

## Camadas afetadas

- **Frontend:**
  - `src/graphql/relatorios.ts` — catálogo com `CUSTO_MATERIAIS`, `formato`/
    `modo` na query string, token via `tokenDeAcesso()`, `visualizarRelatorioPdf`
    (inline), `baixarRelatorioXlsx` (conveniência), guarda client-side contra
    `inline`+`XLSX`.
  - `src/graphql/relatorios.spec.ts` — reescrito para o contrato novo.
  - `src/composables/useRelatorio.ts` — novo. Estado + as três ações
    (`visualizarPdf`, `fecharPdf`, `baixar`).
  - `src/components/ui/RelatorioPdfModal.vue` — novo. `BaseModal` (`size="xl"`)
    com `<iframe>` sobre o Object URL e rodapé com "Baixar"/"Fechar".
  - `src/views/RelatoriosView.vue` — remove `gerarPDF()` mock; cada aba ganha
    "Visualizar PDF" + "Baixar XLSX" via `useRelatorio`, com `empresaId` da
    empresa ativa.
  - `src/views/ProdutoDetalheView.vue` — troca `gerarRelatorioPdf` direto pelo
    composable; ganha "Visualizar" (antes só baixava) + "Baixar XLSX".
  - `src/views/admin/AdminVisaoGeralView.vue` — novo bloco de ação para
    `GESTAO_EMPRESAS_USUARIOS`, atrás de `authStore.adminGlobal`.
  - `.claude/frontend-markup/rules/FR11-relatorio-vem-do-backend.md` — descreve
    `formato`/`modo` e a pré-visualização inline; remove a menção a
    `MOCK_MODE` (não existe mais no código — a camada mock foi desligada nas
    fatias de integração anteriores).
  - `.claude/constitution.md` — linha F11 + entrada de versão 2.6.0.
- **Backend (repo markup-back):** nenhuma mudança — o módulo já está
  implementado; confirmado via Swagger em execução (`localhost:8080`).

## Mudanças de modelo / contrato

- **Schema GraphQL:** nenhuma — este contrato é REST (`/api/relatorios/{tipo}`),
  como já registrado no Artigo III ("binário sai por REST").
- **Tipos do front (`src/graphql/relatorios.ts`):**
  - `TipoRelatorio` ganha `'CUSTO_MATERIAIS'`.
  - Novos: `FormatoRelatorio = 'PDF' | 'XLSX'`, `ModoRelatorio = 'DOWNLOAD' | 'INLINE'`.
  - `ResultadoRelatorioInline` (novo): `{ nomeArquivo: string; blobUrl: string }`.
  - `OpcoesRelatorio.formato?: FormatoRelatorio` — quem chama
    `baixarRelatorioDoBackend` escolhe o formato; default `'PDF'`.
- **Migração de dados:** nenhuma.

## Decisões de design (requisito → decisão)

| Requisito | Decisão |
|-----------|---------|
| REQ-01 | `TipoRelatorio` com os 5 valores; `CUSTO_MATERIAIS` mapeado para a aba "Custo de Materiais" já existente em `RelatoriosView`. |
| REQ-02 | `pedirRelatorio()` interno monta `?formato=${formato}&modo=${modo}` e o `body` com o parâmetro do tipo — uma função só, usada pelas duas saídas públicas. |
| REQ-03 | `token = opcoes.token ?? tokenDeAcesso()`; sem token, header `Authorization` simplesmente não é enviado (o backend responde 401, tratado como qualquer outro erro — REQ-08). |
| REQ-04 | `visualizarRelatorioPdf(tipo, params)` sempre força `formato=PDF, modo=INLINE`; `RelatorioPdfModal` é o único lugar que a exibe. |
| REQ-05 | O blob de `visualizarRelatorioPdf` vira `Object URL` guardado em `pdfAberto` (composable); o botão "Baixar" da modal cria a âncora **a partir do mesmo URL**, sem chamar `pedirRelatorio` de novo. |
| REQ-06 | `baixarRelatorioXlsx(tipo, params)` é só `baixarRelatorioDoBackend(tipo, params, { formato: 'XLSX' })` — sempre `modo=download`, sem opção de outro modo na assinatura pública usada pelas views. |
| REQ-07 | `pedirRelatorio()` lança erro **antes** do `fetch` se `modo === 'INLINE' && formato !== 'PDF'` — combinação inválida nunca sai do processo do front. |
| REQ-08 | `!resposta.ok` vira `Error('Falha ao gerar o relatório (status)')`; o composable guarda em `erro.value`, cada view exibe perto do botão que disparou. |
| REQ-09 | `ProdutoDetalheView`: `useRelatorio().visualizarPdf('FICHA_TECNICA_PRODUTO', { produtoId })` / `.baixar(..., 'XLSX', ...)`. |
| REQ-10 | `RelatoriosView`: mapa `{ precificacao: 'LISTA_PRECIFICACAO', despesas: 'DESPESAS_FIXAS', materiais: 'CUSTO_MATERIAIS' }` reaproveita a aba já selecionada (`relatorioAtivo`) para decidir o tipo, com `empresaId: empresaStore.empresa.id`. |
| REQ-11 | Bloco novo em `AdminVisaoGeralView`, `v-if="authStore.adminGlobal"`; corpo vazio (`{}`) — o backend ignora, o tipo não usa parâmetro. |

## Rules aplicáveis

- **B12** — catálogo fechado respeitado à risca (nenhum tipo novo inventado).
- **F11 (emendada)** — pré-visualização inline continua sendo "pedir e baixar
  o binário do backend"; o que muda é só onde ele é exibido antes do download.
- **Artigo III** — REST com o JWT da sessão, dado que binário não viaja por
  GraphQL.
- **F9** — a visibilidade de `GESTAO_EMPRESAS_USUARIOS` por `adminGlobal`
  precisa do teste de navegação por perfil (ver `tasks.md`).
- **F2** — nenhum estado novo de sessão em store: `useRelatorio` é composable
  (estado de tela, não de domínio), coerente com `FR02` (Pinia é para domínio).

## Riscos e alternativas

- **`<iframe>` vs `<embed>` para o PDF inline** — `<iframe :src="blobUrl">` é
  suportado por todos os navegadores relevantes do projeto e não exige biblioteca;
  a alternativa (`<embed type="application/pdf">`) some silenciosamente sem o
  plugin de PDF nativo em alguns navegadores. Escolhido `<iframe>`.
- **Revogar o Object URL na hora certa** — revogar cedo demais quebra o
  `<iframe>` ainda visível; tarde demais vaza memória. Decisão: revogar só em
  `fecharPdf()` (fechamento explícito da modal) e ao trocar de relatório
  (nova chamada revoga o anterior antes de guardar o novo).
- **Enviar corpo vazio (`{}`) para `GESTAO_EMPRESAS_USUARIOS`** em vez de
  omitir o corpo — mais simples (uma função só monta o request) e o Swagger
  não indica que o backend rejeite corpo vazio quando não espera parâmetro;
  se isso mudar, é ajuste de uma linha, não de arquitetura.
- **Composable novo vs. estender `useCurrency`** — misturar formatação com
  chamada de rede + estado assíncrono tornaria `useCurrency` (hoje puro,
  síncrono, sem I/O) num tipo de composable diferente; `useRelatorio` fica
  separado por ter uma natureza distinta (efeito colateral, não formatação).

---
**Próximo passo:** `/tasks`
