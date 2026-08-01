# Rule FR11 — Relatório vem do backend; o front pede e baixa

**Categoria:** Integração / Documentos
**Origem:** Requisito do usuário (2026-08-01); par de [[R12-relatorios-no-backend]]

## Regra

O front **não monta documento**. Para exportar qualquer coisa — PDF, planilha —
ele chama o módulo de relatórios do backend e entrega o binário ao usuário:

```ts
// src/graphql/relatorios.ts — única porta de saída de documento
await gerarRelatorioPdf('FICHA_TECNICA_PRODUTO', { produtoId })
```

- **Nada de biblioteca de PDF no bundle** (`jspdf`, `pdfmake`, `html2canvas`):
  seria um segundo layout do mesmo documento, para manter em dia em paralelo.
- **A chamada passa pela camada de dados** (`src/graphql/`), como todo o resto —
  nunca um `fetch` solto dentro de uma view ([[FR06-camada-graphql-isolada]]).
- **`MOCK_MODE = true` cai na impressão do navegador** (`window.print()` + a
  camada `@media print`). É o **stopgap datado** do protótipo, para a tela
  funcionar sem backend — exatamente como `useMarkupCalculator` é para o cálculo.
- **`MOCK_MODE = false`** ⇒ `POST /api/relatorios/{tipo}` com o JWT, e download
  do blob. É o caminho definitivo.

## Por quê

Documento é contrato com o mundo lá fora: vai anexado a proposta, vai para o
contador, vira comprovante. Precisa ser igual para todo mundo, versionado e
auditável — coisas que um PDF montado no navegador de cada usuário não entrega.
E manter dois geradores (um no front, um no backend) termina com dois documentos
diferentes para o mesmo produto.

## Escopo

Vale para o que sai da tela. Gráfico, tabela e cartão dentro da UI continuam
sendo front. A camada `@media print` **permanece** no projeto: ela serve à
impressão rápida da tela e ao modo mock — não é a via oficial do documento.
