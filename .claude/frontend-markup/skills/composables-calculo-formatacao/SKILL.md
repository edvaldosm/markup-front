---
name: composables-calculo-formatacao
description: Composables de cálculo (useMarkupCalculator, Fator R) e formatação (useCurrency) do frontend Markup. Use ao exibir precificação ou trabalhar com Simples/Fator R no protótipo.
metadata:
  domain: frontend-markup
  kind: skill
  origin: src/composables/useMarkup.ts
---

# Composables — cálculo e formatação

Arquivo: `src/composables/useMarkup.ts`.

> **Código com data de validade.** `useMarkupCalculator` existe só enquanto
> `MOCK_MODE = true`. Ao ligar o backend ele é **removido** (não vira fallback) e
> a precificação passa a vir de `precificarProduto`. Inventário do que migra:
> [[FR06-camada-graphql-isolada]]. Fonte de verdade das fórmulas e guardas:
> backend [[catalogo-calculos-validacoes]] + [[R01-calculo-no-backend]].
>
> `useCurrency` **fica** — formatação é do front ([[FR05-formatacao-intl]]).

## `useMarkupCalculator()`

Mesma fórmula do backend ([[formula-markup-divisor]]):

```
somaTotalPercentuais = %Impostos + %DF + %ML + %Desconto
divisorMarkup        = 1 - soma/100
precoVenda           = divisorMarkup > 0 ? custoBase / divisorMarkup : 0
```

Funções: `calcularCustoBase`, `calcularPercentualDF`, `calcularFatorR`,
`resolverAnexo`, `calcularPrecificacao` (devolve `ResultadoPrecificacao` com
`breakdown`).

## Fator R (apenas SERVIÇOS no Simples)

```ts
export const FATOR_R_LIMITE = 28  // %
// Fator R = folhaPagamentoMensal / faturamentoMedioMensal × 100
// Fator R ≥ 28% → ANEXO_III (mais barato); senão → ANEXO_V
```

`resolverAnexo` só decide anexo quando `segmento === 'SERVICOS'` e
`regimeTributario === 'SIMPLES_NACIONAL'`; caso contrário devolve
`empresa.anexoSimples`. UI de apoio: `FatorRView` + `FatorRNote`.

## `useCurrency()` — formatação (ver [[FR05-formatacao-intl]])

```ts
formatCurrency(v)  // Intl pt-BR, BRL → "R$ 1.234,56"
formatPercent(v)   // "4,5%"
formatNumber(v, d) // decimais configuráveis
```
