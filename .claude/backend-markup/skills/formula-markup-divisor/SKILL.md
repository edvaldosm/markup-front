---
name: formula-markup-divisor
description: Fórmula do Markup por Divisor e seus componentes (PV, CP, Impostos, DF, ML, D). Use ao implementar ou revisar qualquer cálculo de preço de venda no backend Markup.
metadata:
  domain: backend-markup
  kind: skill
  origin: IniciandoBackEndMarkup.md §1, §5, §12
---

# Fórmula Markup por Divisor

## Fórmula central

```
PV = CP / (1 - (Impostos + DF + ML + D) / 100)
```

O denominador `1 - (soma / 100)` é o **Divisor Markup**.

## Componentes

| Símbolo | Significado | Como obter |
|---------|-------------|------------|
| PV | Preço de Venda Final | resultado |
| CP | Custo Base do Produto (R$) | `SUM(quantidade_utilizada × custo_unitario)` via `PRODUTO_MATERIAL` |
| Impostos | Soma das alíquotas do produto (%) | `SUM(aliquota_percentual)` via `PRODUTO_IMPOSTO` |
| DF | % Despesas Fixas | `SUM(valor_mensal_ativo) / faturamento_medio_mensal × 100` via `DESPESA_FIXA` |
| ML | Margem de Lucro Líquido (%) | `produto.margem_lucro` |
| D | Desconto Máximo Previsto (%) | `produto.desconto_maximo` |

## Referência rápida

```
CP       = SUM(quantidade_utilizada × custo_unitario)        [PRODUTO_MATERIAL]
DF       = SUM(valor_mensal_ativo) / faturamento_medio × 100 [DESPESA_FIXA da EMPRESA]
Impostos = SUM(aliquota_percentual)                          [PRODUTO_IMPOSTO]
ML       = produto.margem_lucro
D        = produto.desconto_maximo
```

## Regra crítica

Se `1 - soma/100 <= 0`, retornar erro — ver [[R03-divisor-markup-positivo]].

**Fonte de verdade:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`.
Implementação: [[service-precificacao-java]].
