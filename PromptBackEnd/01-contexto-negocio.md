# 01 — Contexto de Negócio

> Fonte de verdade: `d:\ObsidianDocumentos\Conhecimento\cálculos\financeiras\markup\wiki\wiki-markup.md`

## Objetivo do sistema

Implementar o backend do sistema de precificação estratégica **Markup por Divisor**, expondo uma API **GraphQL** completa com todos os cálculos centralizados no servidor.

O frontend (Vue 3 + Apollo Client) **não executa nenhum cálculo** — ele apenas exibe os resultados retornados pela API.

---

## Domínio: Precificação por Markup Divisor

O sistema calcula o **Preço de Venda (PV)** de produtos usando a fórmula:

```
PV = CP / (1 - (Impostos + DF + ML + D) / 100)
```

| Símbolo  | Significado                                                        |
|----------|--------------------------------------------------------------------|
| PV       | Preço de Venda Final                                               |
| CP       | Custo Base do Produto (R$) — soma dos insumos                      |
| Impostos | Soma das alíquotas de impostos do produto (%)                      |
| DF       | % Despesas Fixas = Total DF Mensal / Faturamento Médio Mensal × 100 |
| ML       | Margem de Lucro Líquido (%) — definida por produto                 |
| D        | Desconto Máximo Previsto (%) — definido por produto                |

O denominador `1 - (soma / 100)` é o **Divisor Markup**.

---

## Segmentos de negócio (multi-empresa)

O sistema atende **três segmentos**, cada empresa identificada por `EMPRESA.segmento`. A fórmula do markup é idêntica; muda a composição do custo e a tributação:

| Segmento | Exemplo (seed) | CNPJ | Custo Base | Anexo |
|----------|----------------|------|------------|-------|
| 🧁 `CONFEITARIA` | Doces da Ana | 12.345.678/0001-90 | Ingredientes + embalagem | Anexo II (4,5%) |
| 🏭 `INDUSTRIA` | MetalForte Esquadrias | 23.456.789/0001-12 | Matéria-prima + insumos | Anexo II (4,5%) |
| 🛠️ `SERVICOS` | NexaTech Consultoria | 34.567.890/0001-34 | Hora técnica + custos diretos | Anexo III (6%) — Fator R 32,9% |
| 🛠️ `SERVICOS` | CodeLab Studio | 45.678.901/0001-56 | Hora técnica + terceirização | Anexo V (15,5%) — Fator R 20% |

### Prestação de serviços e Fator R

Para `segmento = SERVICOS` no Simples Nacional, o anexo tributário é decidido pelo **Fator R**:

```
Fator R = folha_pagamento_mensal / faturamento_medio_mensal × 100
  ≥ 28% → Anexo III (6% na 1ª faixa)
  < 28% → Anexo V   (15,5% na 1ª faixa)
```

O ISS (imposto municipal sobre serviços) já está **embutido no DAS** no Simples Nacional. No Lucro Presumido/Real seria recolhido por fora (2%–5%). Confeitaria e indústria vendem mercadoria própria → **ISS zero**.

> Detalhamento completo: seção "Precificação de Prestação de Serviços" e "Fator R" no vault `wiki-markup.md`.

---

## Cálculos que DEVEM sair do frontend e ir para o backend

| Cálculo | Lógica atual no front (`useMarkup.ts`) | Onde vai no backend |
|---------|---------------------------------------|---------------------|
| Custo Base (CP) | `SUM(quantidade_utilizada × custo_unitario)` por produto | Campo `custoBase` resolvido em `Produto` |
| % Despesas Fixas (DF) | `SUM(despesas_ativas.valor_mensal) / faturamento_medio_mensal × 100` | Campo `percentualDespesasFixas` resolvido em `Empresa` |
| % Impostos total | `SUM(aliquota_percentual)` dos impostos do produto | Campo `percentualImpostos` resolvido em `Produto` |
| Divisor Markup | `1 - soma_percentuais / 100` | Calculado dentro do `precificacao_service.go` |
| Preço de Venda | `CP / divisor_markup` | Query `precificarProduto` |
| Breakdown do PV | Decomposição por componente (impostos, DF, lucro, desconto) | Tipo `ResultadoPrecificacao` na resposta |

---

## Referência rápida — Fórmula central

```
PV = CP / (1 - (Impostos + DF + ML + D) / 100)

Onde:
  CP       = SUM(quantidade_utilizada × custo_unitario)        [via PRODUTO_MATERIAL]
  DF       = SUM(valor_mensal_ativo) / faturamento_medio × 100 [via DESPESA_FIXA da EMPRESA]
  Impostos = SUM(aliquota_percentual)                          [via PRODUTO_IMPOSTO]
  ML       = produto.margem_lucro
  D        = produto.desconto_maximo
```

**Regra crítica:** se `Divisor Markup <= 0`, a soma de percentuais atingiu ou ultrapassou 100% — retornar `error`, nunca calcular preço negativo ou zero.
