---
title: "Relatórios"
ordem: 12
tags: [relatorios, exportar-pdf, precificacao-completa, despesas-fixas, custo-de-materiais]
resumo: "Os três relatórios disponíveis no sistema — Precificação Completa, Despesas Fixas e Custo de Materiais — e como exportá-los em PDF."
---

# 12. Relatórios

> **Contexto:** este documento faz parte do *Manual de Utilização — Sistema Markup*, ferramenta de precificação estratégica por Markup Divisor (`PV = CP / Divisor`). Veja o índice completo em [`00-indice.md`](./00-indice.md).

Menu lateral → **Análise → Relatórios** (rota `/relatorios`).

Três relatórios estão disponíveis por abas:

1. **Precificação Completa** — tabela com todos os produtos e, para cada um: custo base, % impostos, % DF, % ML, % desconto, divisor e preço de venda/lucro líquido calculados (ver [`09-precificacao.md`](./09-precificacao.md)).
2. **Despesas Fixas** — lista de despesas com valor, % do faturamento e status, mais o total geral (ver [`06-despesas-fixas.md`](./06-despesas-fixas.md)).
3. **Custo de Materiais** — lista de materiais com custo unitário, fornecedor, estoque e um alerta visual (**"Baixo"**) quando o estoque estiver ≤ 5 unidades (ver [`07-materiais-insumos.md`](./07-materiais-insumos.md)).

```mermaid
flowchart TD
    A["Menu: Análise > Relatórios"] --> B["Selecionar a aba do relatório"]
    B --> C["Precificação Completa"]
    B --> D["Despesas Fixas"]
    B --> E["Custo de Materiais"]
    C --> F["Clicar em Exportar PDF"]
    D --> F
    E --> F
    F --> G["Documento gerado pelo backend"]
```

Clique em **"📄 Exportar PDF"** no canto superior direito para gerar o documento correspondente à aba selecionada.
