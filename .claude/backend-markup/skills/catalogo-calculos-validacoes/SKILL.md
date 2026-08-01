---
name: catalogo-calculos-validacoes
description: Catálogo autoritativo de TODOS os cálculos e validações da precificação Markup (CP, %DF, %Impostos, divisor, PV, breakdown, Fator R, anexo) com as guardas de cada um. Use ao implementar, revisar ou migrar qualquer cálculo para o backend.
metadata:
  domain: backend-markup
  kind: skill
  origin: vault wiki-markup.md + src/composables/useMarkup.ts (implementação a migrar)
---

# Catálogo de cálculos e validações

**Fonte única de verdade dos números do sistema.** Todo cálculo listado aqui
pertence ao backend ([[R01-calculo-no-backend]]); o front apenas exibe.

- **Domínio:** `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`
- **Implementação provisória a migrar:** `src/composables/useMarkup.ts` (protótipo Vue)
- **Camada:** tudo em `service/` ([[R04-separacao-camadas]]), nunca no controller

---

## 1. Cálculos

### C1 — Custo Base (CP)

```
CP = Σ (produto_material.quantidade_utilizada × material.custo_unitario)
```

Origem: `PRODUTO_MATERIAL` ⋈ `MATERIAL`. Para **serviços**, um "material" pode
ser hora técnica (unidade `H`, custo unitário = custo/hora) — a fórmula não muda.

### C2 — Percentual de Despesas Fixas (%DF)

```
%DF = (Σ despesa_fixa.valor_mensal WHERE ativa = true) / empresa.faturamento_medio_mensal × 100
```

Rateio por faturamento, **nunca** fixado à mão no produto. É por **empresa**,
não por produto — o mesmo %DF entra em todos os produtos dela.

### C3 — Percentual de Impostos

```
%Impostos = Σ produto_imposto.aliquota_percentual
```

Soma simples das alíquotas vinculadas ao produto.

### C4 — Soma dos percentuais

```
soma = %Impostos + %DF + ML + D
```

Onde `ML = produto.margem_lucro` e `D = produto.desconto_maximo`.

### C5 — Divisor Markup

```
divisor = 1 − soma / 100
```

### C6 — Preço de Venda

```
PV = CP / divisor
```

### C7 — Breakdown do PV

| Componente | Fórmula |
|-----------|---------|
| `custoRecuperado` | `CP` |
| `valorImpostos` | `PV × %Impostos / 100` |
| `valorDespesasFixas` | `PV × %DF / 100` |
| `valorDesconto` | `PV × D / 100` |
| `lucroLiquido` | `PV × ML / 100` |

> Os cinco somam `PV` quando `divisor > 0` — serve de asserção de teste.

### C8 — Fator R

```
Fator R (%) = empresa.folha_pagamento_mensal / empresa.faturamento_medio_mensal × 100
```

"Folha" inclui salários, pró-labore, FGTS e encargos (CPP). A razão mensal e a
anual são idênticas, então a base mensal serve. Ver [[R10-fator-r-anexo-simples]].

### C9 — Anexo aplicado

```
se segmento = SERVICOS e regime = SIMPLES_NACIONAL:
    Fator R ≥ 28  →  ANEXO_III
    Fator R <  28  →  ANEXO_V
senão:
    anexo = empresa.anexo_simples (cadastrado)
```

Limite `28` é constante nomeada (`FATOR_R_LIMITE`), nunca literal espalhado.
Impacto real: o mesmo serviço fica ~40% mais caro no Anexo V.

---

## 2. Validações e guardas

| # | Guarda | Condição | Comportamento | Rule |
|---|--------|----------|---------------|------|
| V1 | Divisor inviável | `divisor <= 0` | **erro** explícito; nunca preço ≤ 0, negativo ou infinito | [[R03-divisor-markup-positivo]] |
| V2 | Faturamento zerado (DF) | `faturamento_medio_mensal <= 0` | `%DF = 0` — não dividir por zero | [[R11-guardas-de-calculo]] |
| V3 | Faturamento zerado (Fator R) | `faturamento_medio_mensal <= 0` | `Fator R = 0` ⇒ cai no Anexo V | [[R11-guardas-de-calculo]] |
| V4 | Despesa inativa | `ativa = false` | **não entra** no somatório do %DF | [[R11-guardas-de-calculo]] |
| V5 | Fator R fora de escopo | segmento ≠ SERVICOS **ou** regime ≠ SIMPLES | `fatorR` e `anexoAplicado` ficam **nulos** na resposta | [[R10-fator-r-anexo-simples]] |
| V6 | Material órfão | vínculo aponta material inexistente | **erro de integridade** — a FK deve impedir; nunca ignorar em silêncio | [[R11-guardas-de-calculo]] |
| V7 | Empresa não autorizada | `empresaId` fora do conjunto do usuário | **negar** antes de calcular | [[R02-isolamento-multiempresa]], [[R09-ownership-multiempresa]] |
| V8 | Percentuais negativos | `ML < 0`, `D < 0`, alíquota `< 0` | **rejeitar** na entrada (validação de input) | [[R11-guardas-de-calculo]] |

> **V6 é uma divergência consciente com o protótipo.** O front hoje ignora o
> material ausente (`if (!mat) return acc`), o que **subestima o custo em
> silêncio**. No backend isso é erro — ver [[R11-guardas-de-calculo]].

---

## 3. Contrato (o que a API devolve)

`ResultadoPrecificacao` carrega todos os números crus — o front **formata**
([[R07-fora-do-backend]] + front FR05):

```graphql
type ResultadoPrecificacao {
  produto: Produto!
  custoBase: Float!
  percentualImpostos: Float!
  percentualDespesasFixas: Float!
  percentualMargemLucro: Float!
  percentualDesconto: Float!
  somaTotalPercentuais: Float!
  divisorMarkup: Float!
  precoVenda: Float!
  fatorR: Float                 # nulo fora de serviços no Simples (V5)
  anexoAplicado: AnexoSimples   # nulo fora de serviços no Simples (V5)
  breakdown: BreakdownPrecificacao!
}
```

Ver [[schema-graphql-markup]] e [[R06-contrato-first-schema]].

---

## 4. Decisões em aberto

Registradas aqui para não virarem improviso na implementação:

- **Precisão monetária.** O protótipo usa `number` (double). Recomendação para o
  backend: `BigDecimal` com escala definida para dinheiro, `double` só para
  percentuais intermediários. **A decidir antes de T-B6.**
- **Arredondamento do PV.** O vault sugere arredondar para cima (R$ 26,37 →
  R$ 26,50) como boa prática comercial. Hoje **não** é aplicado. Se virar regra,
  é do backend e precisa entrar no contrato. **A decidir.**
- **Alíquota efetiva por faixa (RBT12).** O DAS é único por empresa e depende da
  receita bruta dos 12 meses; o sistema hoje usa a alíquota cadastrada por
  produto. Progressão por faixa está **fora de escopo** até haver spec própria.

---

**Verificação:** cada cálculo C1–C9 e cada guarda V1–V8 precisa de teste no
backend. O exemplo do vault (bolo de cenoura: CP 12,00 · soma 54,5% · divisor
0,455 · PV 26,37) e o de serviço (CP 360,00 · Anexo III 6% · PV 1.090,91) são
casos de aceite prontos.
