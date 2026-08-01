# Rule FR05 — Formatação só via `useCurrency`

**Categoria:** Apresentação
**Origem:** `src/composables/useMarkup.ts` (`useCurrency`)

## Regra

Moeda e percentual são formatados **apenas** pelo composable `useCurrency`
(`Intl.NumberFormat` em `pt-BR`): `formatCurrency`, `formatPercent`,
`formatNumber`. Nunca concatenar `'R$ '` ou `'%'` à mão.

## Por quê

Garante formatação consistente (locale pt-BR, casas decimais) e centraliza a
apresentação numérica. É o lado-front da fronteira: o back devolve números
crus, o front formata — ver backend [[R07-fora-do-backend]].
