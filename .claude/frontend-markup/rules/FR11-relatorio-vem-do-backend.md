# Rule FR11 — Relatório vem do backend; o front pede, exibe e baixa

**Categoria:** Integração / Documentos
**Origem:** Requisito do usuário (2026-08-01); emendada em 2026-08-06 (preview
inline) · par de [[R12-relatorios-no-backend]]

## Regra

O front **não monta documento**. Para exportar qualquer coisa — PDF, planilha —
ele chama o módulo de relatórios do backend (`POST /api/relatorios/{tipo}`,
catálogo fechado de 5 tipos: `FICHA_TECNICA_PRODUTO`, `LISTA_PRECIFICACAO`,
`DESPESAS_FIXAS`, `CUSTO_MATERIAIS`, `GESTAO_EMPRESAS_USUARIOS`) e entrega o
binário ao usuário:

```ts
// src/graphql/relatorios.ts — única porta de saída de documento

// PDF, pré-visualizado em modal (RelatorioPdfModal)
const { blobUrl, nomeArquivo } = await visualizarRelatorioPdf('FICHA_TECNICA_PRODUTO', { produtoId })

// PDF ou XLSX, direto para "Salvar Como"
await baixarRelatorioDoBackend('LISTA_PRECIFICACAO', { empresaId }, { formato: 'XLSX' })
```

- **Nada de biblioteca de PDF no bundle** (`jspdf`, `pdfmake`, `html2canvas`):
  seria um segundo layout do mesmo documento, para manter em dia em paralelo.
  A pré-visualização usa o binário que **o backend já gerou**, num
  `<iframe>` sobre o Object URL do blob — não é o front desenhando PDF.
- **A chamada passa pela camada de dados** (`src/graphql/`), como todo o resto —
  nunca um `fetch` solto dentro de uma view ([[FR06-camada-graphql-isolada]]).
- **Dois parâmetros de query, sempre explícitos:** `formato` (`PDF` ou
  `XLSX`) e `modo` (`DOWNLOAD` ou `INLINE`). `modo=inline` só é aceito pelo
  backend com `formato=PDF` — o front barra a combinação inválida antes do
  `fetch`, nunca deixa o 400 do servidor ser a primeira notícia disso.
- **PDF pode ser pré-visualizado; XLSX nunca.** Planilha binária não tem
  leitor nativo no navegador — a única ação para XLSX é baixar.
- **O JWT vai por padrão**, lido do mesmo cofre que o Apollo usa
  (`tokenDeAcesso()`, em `src/graphql/sessao.ts`) — quem chama não precisa
  (nem deve) passar o token à mão.
- **Sem modo alternativo.** Não existe fallback local: se o backend recusar
  (401/403/404), o erro sobe como mensagem — nunca um documento montado no
  navegador como consolo.

## Por quê

Documento é contrato com o mundo lá fora: vai anexado a proposta, vai para o
contador, vira comprovante. Precisa ser igual para todo mundo, versionado e
auditável — coisas que um PDF montado no navegador de cada usuário não entrega.
E manter dois geradores (um no front, um no backend) termina com dois documentos
diferentes para o mesmo produto.

A pré-visualização inline (emenda 2026-08-06) não muda essa fronteira: o
binário renderizado na modal é **exatamente** o que o backend devolveria para
download — só muda onde ele aparece primeiro. Existe porque o próprio backend
já suporta (`modo=inline`) e a UX de "ver antes de baixar" vale só para o
formato que o navegador sabe renderizar nativamente (PDF).

## Escopo

Vale para o que sai da tela. Gráfico, tabela e cartão dentro da UI continuam
sendo front. A camada `@media print` **permanece** no projeto para impressão
rápida da tela (ex.: `ProdutoDetalheView`) — é um atalho de teclado do
usuário, não a via oficial do documento.
